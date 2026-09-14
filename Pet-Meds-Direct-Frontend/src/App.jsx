import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes/routes";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRoutes />
            <Toaster position="top-right" reverseOrder={false} />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
