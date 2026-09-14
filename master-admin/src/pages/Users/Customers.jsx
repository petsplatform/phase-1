import { motion } from 'framer-motion'
import CustomerList from '../../components/Users/CustomerList'

export default function Customers() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CustomerList />
    </motion.div>
  )
}
