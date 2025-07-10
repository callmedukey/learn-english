import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

const TOSS_CLIENT_SECRET = process.env.TOSS_CLIENT_SECRET;
const BILLING_KEY_ENCRYPTION_KEY = process.env.BILLING_KEY_ENCRYPTION_KEY;

// Check for required environment variables
if (!TOSS_CLIENT_SECRET) {
  throw new Error("TOSS_CLIENT_SECRET environment variable is not set");
}

if (!BILLING_KEY_ENCRYPTION_KEY) {
  console.error(
    "BILLING_KEY_ENCRYPTION_KEY is not set. Please run: npx tsx scripts/generate-billing-keys.ts",
  );
  throw new Error("BILLING_KEY_ENCRYPTION_KEY environment variable is not set");
}

// Encryption functions
const algorithm = "aes-256-gcm";
const key = Buffer.from(BILLING_KEY_ENCRYPTION_KEY, "hex");

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { authKey, customerKey } = await request.json();

    if (!authKey || !customerKey) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    if (customerKey !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Issue billing key from Toss
    const response = await fetch(
      "https://api.tosspayments.com/v1/billing/authorizations/issue",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(TOSS_CLIENT_SECRET + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey,
          customerKey,
        }),
      },
    );

    const billingKeyData = await response.json();

    if (!response.ok) {
      console.error("Toss billing key issue error:", billingKeyData);
      return NextResponse.json(
        { error: billingKeyData.message || "Failed to issue billing key" },
        { status: response.status },
      );
    }

    // Encrypt and store billing key
    const encryptedBillingKey = encrypt(billingKeyData.billingKey);

    await prisma.user.update({
      where: { id: customerKey },
      data: {
        billingKey: encryptedBillingKey,
        billingKeyIssuedAt: new Date(),
        billingMethod: billingKeyData.card?.cardType || "CARD",
        cardInfo: {
          last4: billingKeyData.card?.number?.slice(-4) || "",
          issuer: billingKeyData.card?.issuerCode || "",
          cardType: billingKeyData.card?.cardType || "",
          ownerType: billingKeyData.card?.ownerType || "",
        },
        // Clear the temporary auth key
        billingAuthKey: null,
      },
    });

    return NextResponse.json({
      success: true,
      cardInfo: {
        last4: billingKeyData.card?.number?.slice(-4),
        issuer: billingKeyData.card?.issuerCode,
      },
    });
  } catch (error) {
    console.error("Billing key issue error:", error);
    return NextResponse.json(
      { error: "Failed to issue billing key" },
      { status: 500 },
    );
  }
}
