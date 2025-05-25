import { prisma } from "../prisma/prisma-client";

async function createTestCoupon() {
  try {
    // Check if test coupon already exists
    const existingCoupon = await prisma.discountCoupon.findFirst({
      where: { code: "TEST20" },
    });

    if (existingCoupon) {
      console.log("Test coupon already exists:", existingCoupon);
      return;
    }

    // Create test coupon with 20% discount
    const coupon = await prisma.discountCoupon.create({
      data: {
        code: "TEST20",
        discount: 20, // 20% discount
        flatDiscount: 0,
        active: true,
      },
    });

    console.log("Test coupon created:", coupon);

    // Create another test coupon with flat discount
    const flatCoupon = await prisma.discountCoupon.create({
      data: {
        code: "SAVE5000",
        discount: 0,
        flatDiscount: 5000, // 5,000원 flat discount
        active: true,
      },
    });

    console.log("Flat discount coupon created:", flatCoupon);
  } catch (error) {
    console.error("Error creating test coupons:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCoupon();
