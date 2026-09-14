require("dotenv").config();

const { prisma } = require("../src/config/db");
const customerPanelService = require("../src/services/customerPanelService");

async function main() {
  const customer = await prisma.customer.findFirst();
  if (!customer) {
    console.log("No customers found. Skipped cart/wishlist verification.");
    return;
  }

  const originalCart = await customerPanelService.getCart(customer);
  const originalWishlist = await customerPanelService.getWishlist(customer);

  await customerPanelService.syncCart(customer, [
    { id: "verify-cart-item", productId: "verify-product", name: "Verify Cart Item", price: 1, quantity: 2 },
  ]);
  await customerPanelService.syncWishlist(customer, [
    { id: "verify-wishlist-item", productId: "verify-product", slug: "verify-product", name: "Verify Wishlist Item" },
  ]);

  const cart = await customerPanelService.getCart(customer);
  const wishlist = await customerPanelService.getWishlist(customer);

  await customerPanelService.syncCart(customer, originalCart);
  await customerPanelService.syncWishlist(customer, originalWishlist);

  if (cart[0]?.id !== "verify-cart-item" || wishlist[0]?.id !== "verify-wishlist-item") {
    throw new Error("Customer cart/wishlist verification failed");
  }

  console.log("Customer cart/wishlist service OK.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
