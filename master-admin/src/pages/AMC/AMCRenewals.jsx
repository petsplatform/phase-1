import { motion } from 'framer-motion'
import RenewalTable from '../../components/AMC/RenewalTable'

export default function AMCRenewals() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <RenewalTable />
    </motion.div>
  )
}
