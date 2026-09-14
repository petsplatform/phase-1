import Routes from './Routes';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Routes />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
