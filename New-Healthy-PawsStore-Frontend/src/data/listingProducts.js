import catFood from "../assets/images/product-cat-food.png";
import chews from "../assets/images/product-chews.png";
import dogFood from "../assets/images/product-dog-food.png";
import drops from "../assets/images/product-drops.png";
import vitamins from "../assets/images/product-vitamins.png";

export const listingProducts = [
  {
    id: 1,
    title: "Royal Canin Maxi Adult Dog Food - 4kg",
    price: 42.99,
    oldPrice: 49.99,
    discount: "-15%",
    rating: 4.8,
    reviews: 128,
    image: dogFood,
  },
  {
    id: 2,
    title: "Whiskas Adult Dog Food Ocean Fish - 2kg",
    price: 18.99,
    oldPrice: 22.99,
    discount: "-17%",
    rating: 4.7,
    reviews: 96,
    image: catFood,
  },
  {
    id: 3,
    title: "Pet Multivitamin Supplement - 150 Tablets",
    price: 15.99,
    oldPrice: 19.99,
    discount: "-20%",
    rating: 4.9,
    reviews: 73,
    image: vitamins,
  },
  {
    id: 4,
    title: "Tick & Flea Drops for Dogs - 10ml",
    price: 12.99,
    oldPrice: 16.99,
    discount: "-18%",
    rating: 4.6,
    reviews: 61,
    image: drops,
  },
  {
    id: 5,
    title: "Dental Chews For Dogs - 500g",
    price: 9.99,
    oldPrice: 12.99,
    discount: "-18%",
    rating: 4.7,
    reviews: 54,
    image: chews,
  },
  {
    id: 6,
    title: "Drools Chicken & Egg Adult - 3kg",
    price: 17.49,
    oldPrice: 20.49,
    discount: "-15%",
    rating: 4.8,
    reviews: 88,
    image: dogFood,
  },
  {
    id: 7,
    title: "Pedigree Adult Dry Dog Food - 3kg",
    price: 16.99,
    oldPrice: 20.49,
    discount: "-16%",
    rating: 4.6,
    reviews: 45,
    image: catFood,
  },
  {
    id: 8,
    title: "SmartHeart Power Pack Adult - 3kg",
    price: 17.99,
    oldPrice: 21.99,
    discount: "-19%",
    rating: 4.7,
    reviews: 38,
    image: vitamins,
  },
];

export const filterCategories = [
  { id: "all", name: "All Dog Food", count: 128 },
  { id: "dry", name: "Dry Dog Food", count: 64 },
  { id: "wet", name: "Wet Dog Food", count: 24 },
  { id: "grain-free", name: "Grain Free", count: 18 },
  { id: "puppy", name: "Puppy Food", count: 12 },
  { id: "senior", name: "Senior Dog Food", count: 10 },
];

export const filterBrands = [
  { id: "royal-canin", name: "Royal Canin", count: 20 },
  { id: "pedigree", name: "Pedigree", count: 18 },
  { id: "drools", name: "Drools", count: 16 },
  { id: "himalaya", name: "Himalaya", count: 14 },
  { id: "purepet", name: "Purepet", count: 12 },
];

export const filterSizes = [
  { id: "size-1", name: "1kg & Below", count: 28 },
  { id: "size-2", name: "1kg - 5kg", count: 46 },
  { id: "size-3", name: "5kg - 10kg", count: 30 },
  { id: "size-4", name: "10kg & Above", count: 24 },
];
