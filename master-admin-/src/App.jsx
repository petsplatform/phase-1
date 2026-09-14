import { BrowserRouter } from 'react-router-dom'
import { SidebarProvider } from './context/SidebarContext'
import { ProductProvider } from './context/ProductContext'
import { DataProvider } from './context/DataContext'
import AppRoutes from './routes/AppRoutes'
import Toaster from './components/ui/Toaster'
import StoreThemeSync from './components/theme/StoreThemeSync'

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <DataProvider>
          <ProductProvider>
            <StoreThemeSync />
            <AppRoutes />
            <Toaster />
          </ProductProvider>
        </DataProvider>
      </SidebarProvider>
    </BrowserRouter>
  )
}
