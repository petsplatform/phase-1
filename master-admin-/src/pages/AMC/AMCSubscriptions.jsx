import { motion } from 'framer-motion'
import SubscriptionTable from '../../components/AMC/SubscriptionTable'

export default function AMCSubscriptions() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <SubscriptionTable />
    </motion.div>
  )
}
