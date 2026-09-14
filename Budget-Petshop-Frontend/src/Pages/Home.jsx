import Herosection from "../Components/Home/Herosection";
import CategorySection from "../Components/Home/CategorySection";
import ProductSection from "../Components/Home/ProductSection";
import PetCareSection from "../Components/Home/PetCareSection";
import NewArrivalSection from "../Components/Home/NewArrivalSection";
import FaqSection from "../Components/Home/FaqSection";

function Home({ onAddToCart, wishlistIds = [], onToggleWishlist }) {
  return (
    <main className="bg-background text-on-background">
      <Herosection />
      <CategorySection />
      <ProductSection
        onAddToCart={onAddToCart}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
      />
      <PetCareSection />
      <NewArrivalSection />
      <FaqSection />
    </main>
  );
}

export default Home;
