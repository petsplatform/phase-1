import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes/Routes";
import { AuthProvider } from "./utils/AuthContext";
import { NotificationProvider } from "./utils/NotificationContext";

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
