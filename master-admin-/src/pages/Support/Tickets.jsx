import { motion } from 'framer-motion'
import SupportTicketTable from '../../components/Support/SupportTicketTable'
import SupportSummary from '../../components/Dashboard/SupportSummary'

export default function Tickets() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <SupportSummary />
      <SupportTicketTable />
    </motion.div>
  )
}
