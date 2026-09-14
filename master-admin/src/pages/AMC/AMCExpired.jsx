import { motion } from 'framer-motion'
import { ExpiredTable } from '../../components/AMC/RenewalTable'

export default function AMCExpired() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ExpiredTable />
    </motion.div>
  )
}
