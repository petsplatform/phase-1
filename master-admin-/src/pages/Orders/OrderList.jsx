import { motion } from 'framer-motion'
import OrderTable from '../../components/Orders/OrderTable'

export default function OrderList() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <OrderTable />
    </motion.div>
  )
}
