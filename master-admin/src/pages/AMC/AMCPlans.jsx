import { motion } from 'framer-motion'
import AMCPlansGrid from '../../components/AMC/AMCPlansGrid'

export default function AMCPlans() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <AMCPlansGrid />
    </motion.div>
  )
}
