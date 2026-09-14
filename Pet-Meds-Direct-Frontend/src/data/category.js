import category1 from "../assets/Home/Categories/category1.png";
import category2 from "../assets/Home/Categories/category2.png";
import category3 from "../assets/Home/Categories/category3.png";
import category4 from "../assets/Home/Categories/category4.png";
import category5 from "../assets/Home/Categories/category5.png";
import category6 from "../assets/Home/Categories/category6.png";

export const categories = [
  {
    id: "flea-tick",
    label: "Flea & Tick Prevention",
    image: category1,
  },
  {
    id: "rx-refills",
    label: "Prescription Refills",
    image: category2,
  },
  {
    id: "hip-joint",
    label: "Hip & Joint Mobility",
    image: category3,
  },
  {
    id: "skin-allergy",
    label: "Skin & Allergy Relief",
    image: category4,
  },
  {
    id: "anxiety-calming",
    label: "Anxiety & Calming",
    image: category5,
  },
  {
    id: "ear-eye-care",
    label: "Ear & Eye Care",
    image: category6,
  },
  {
    id: "dog-food-nutrition",
    label: "Dog Food & Nutrition",
    image: category1,
  },
  {
    id: "cat-food-nutrition",
    label: "Cat Food & Nutrition",
    image: category2,
  },
  {
    id: "pet-grooming",
    label: "Pet Grooming",
    image: category3,
  },
  {
    id: "toys-play",
    label: "Toys & Play",
    image: category4,
  },
  {
    id: "health-wellness",
    label: "Health & Wellness",
    image: category5,
  },
  {
    id: "collars-leashes-accessories",
    label: "Collars, Leashes & Accessories",
    image: category6,
  },
];

// Map of URL category ID (e.g. 'flea-tick') to UI Label (e.g. 'Flea & Tick Prevention')
export const categoryMap = categories.reduce((acc, cat) => {
  acc[cat.id] = cat.label;
  return acc;
}, {});

// Helper function to find the route key (ID) for a given UI label value
export const getCategoryKey = (value) => {
  return Object.keys(categoryMap).find((key) => categoryMap[key] === value);
};

// Flat list of category names used in the product catalog filter, starting with 'All'
export const categoriesList = ["All", ...categories.map((cat) => cat.label)];
