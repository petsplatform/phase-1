import { motion } from 'framer-motion'
import DemoTable from '../../components/Demo/DemoTable'

export default function DemoList() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DemoTable />
    </motion.div>
  )
}
