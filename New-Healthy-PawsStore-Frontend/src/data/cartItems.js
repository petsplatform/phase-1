import catFood from "../assets/images/product-cat-food.png";
import chews from "../assets/images/product-chews.png";
import dogFood from "../assets/images/product-dog-food.png";
import vitamins from "../assets/images/product-vitamins.png";

export const initialCartItems = [
  {
    id: "royal-canin-maxi",
    title: "Royal Canin Maxi Adult Dog Food - 4kg",
    category: "Dog Food",
    price: 42.99,
    quantity: 1,
    image: dogFood,
  },
  {
    id: "whiskas-ocean-fish",
    title: "Whiskas Adult Cat Food Ocean Fish - 2kg",
    category: "Cat Food",
    price: 18.99,
    quantity: 2,
    image: catFood,
  },
  {
    id: "pet-multivitamin",
    title: "Pet Multivitamin Supplement - 150 Tablets",
    category: "Supplements",
    price: 15.99,
    quantity: 1,
    image: vitamins,
  },
  {
    id: "durable-rope-toy",
    title: "Durable Rope Toy for Dogs",
    category: "Toys",
    price: 7.99,
    quantity: 1,
    image: chews,
  },
];
