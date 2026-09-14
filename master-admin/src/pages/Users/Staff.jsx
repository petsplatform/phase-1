import { motion } from 'framer-motion'
import StaffTable from '../../components/Users/StaffTable'
import { staff } from '../../data/dummyData'

export default function Staff() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <StaffTable staff={staff} />
    </motion.div>
  )
}
