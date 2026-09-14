import catFood from "../assets/images/product-cat-food.png";
import dogFood from "../assets/images/product-dog-food.png";
import drops from "../assets/images/product-drops.png";
import vitamins from "../assets/images/product-vitamins.png";

export const wishlistProducts = [
  {
    id: "royal-canin-maxi",
    title: "Royal Canin Maxi Adult Dog Food - 4kg",
    category: "Dog Food",
    price: 42.99,
    oldPrice: 49.99,
    rating: 4.8,
    reviews: 128,
    image: dogFood,
  },
  {
    id: "whiskas-ocean-fish",
    title: "Whiskas Adult Cat Food Ocean Fish - 2kg",
    category: "Cat Food",
    price: 18.99,
    oldPrice: 22.99,
    rating: 4.7,
    reviews: 96,
    image: catFood,
  },
  {
    id: "pet-multivitamin",
    title: "Pet Multivitamin Supplement - 150 Tablets",
    category: "Supplements",
    price: 15.99,
    oldPrice: 19.99,
    rating: 4.7,
    reviews: 96,
    image: vitamins,
  },
  {
    id: "tick-flea-drops",
    title: "Tick & Flea Drops for Dogs - 10ml",
    category: "Health Care",
    price: 12.99,
    oldPrice: 16.99,
    rating: 4.6,
    reviews: 61,
    image: drops,
  },
];
