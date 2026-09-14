import { motion } from 'framer-motion'
import CategoryTable from '../../components/Products/CategoryTable'

export default function Categories() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <CategoryTable />
    </motion.div>
  )
}
