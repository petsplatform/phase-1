require("dotenv").config();

const productService = require("../src/services/productService");
const { prisma } = require("../src/config/db");

async function main() {
  const products = await productService.listProducts({});
  console.log(`Admin product service OK. Returned ${products.length} product(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
