import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./router/routes";
import ToastContainer from "./components/common/ToastContainer";
import { CartProvider } from "./utils/cartFunctionality";
import { WishlistProvider } from "./utils/wishlistFunctionality";
import { AuthProvider } from "./store/authentication/authContext";
import { PrescriptionProvider } from "./utils/prescriptionContext";
import PrescriptionModal from "./components/common/PrescriptionModal";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <PrescriptionProvider modalComponent={PrescriptionModal}>
              <ToastContainer />
              <AppRoutes />
            </PrescriptionProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

