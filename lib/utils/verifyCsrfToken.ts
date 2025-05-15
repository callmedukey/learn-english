"server only";

import { cookies } from "next/headers";

// Match Auth.js's hash creation method
async function createHash(message: string) {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toString();
}

export const verifyCsrfToken = async (): Promise<boolean> => {
  try {
    const cookie = (await cookies()).get("authjs.csrf-token");
    if (!cookie) {
      return false;
    }

    const cookieValue = decodeURIComponent(cookie.value);

    // Split using the pipe character
    const [requestToken, requestHash] = cookieValue.split("|");

    if (!requestToken || !requestHash) {
      return false;
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return false;
    }

    // Compute the hash using Auth.js's method
    const validHash = await createHash(`${requestToken}${secret}`);

    return validHash === requestHash;
  } catch {
    return false;
  }
};
