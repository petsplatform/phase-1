import catFood from "../assets/images/product-cat-food.png";
import chews from "../assets/images/product-chews.png";
import dogFood from "../assets/images/product-dog-food.png";
import drops from "../assets/images/product-drops.png";
import vitamins from "../assets/images/product-vitamins.png";

export const products = [
  {
    title: "Royal Canin Maxi Adult Dog Food - 4kg",
    price: "$42.99",
    oldPrice: "$49.99",
    discount: "-15%",
    rating: "4.8 (128)",
    image: dogFood,
  },
  {
    title: "Whiskas Adult Cat Food Ocean Fish - 2kg",
    price: "$18.99",
    oldPrice: "$22.99",
    discount: "-17%",
    rating: "4.7 (96)",
    image: catFood,
  },
  {
    title: "Pet Multivitamin Supplement - 150 Tablets",
    price: "$15.99",
    oldPrice: "$19.99",
    discount: "-20%",
    rating: "4.9 (73)",
    image: vitamins,
  },
  {
    title: "Tick & Flea Drops for Dogs - 10ml",
    price: "$12.99",
    oldPrice: "$16.99",
    discount: "-22%",
    rating: "4.6 (61)",
    image: drops,
  },
  {
    title: "Dental Chews for Dogs - 500g",
    price: "$9.99",
    oldPrice: "$12.99",
    discount: "-18%",
    rating: "4.7 (54)",
    image: chews,
  },
];
