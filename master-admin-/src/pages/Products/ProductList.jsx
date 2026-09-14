import { motion } from 'framer-motion'
import ProductTable from '../../components/Products/ProductTable'

export default function ProductList() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ProductTable />
    </motion.div>
  )
}
