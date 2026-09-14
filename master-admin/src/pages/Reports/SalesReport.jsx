import { motion } from 'framer-motion'
import { SalesReportView } from '../../components/Reports/ReportViews'

export default function SalesReport() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <SalesReportView />
    </motion.div>
  )
}
