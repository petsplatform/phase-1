import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import ProductForm from '../../components/Products/ProductForm'
import { useProducts } from '../../context/ProductContext'

export default function AddProduct() {
  const navigate = useNavigate()
  const { addProduct } = useProducts()

  const handleCreate = async (newProduct) => {
    await addProduct(newProduct)
    navigate('/products/list')
  }

  return (
    <div className="mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/products/list')}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Create New Product</h1>
          <p className="text-xs sm:text-sm text-gray-500">Set up a new product for your store</p>
        </div>
      </div>

      <ProductForm onSubmit={handleCreate} />
    </div>
  )
}
