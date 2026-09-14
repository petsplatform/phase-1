import { motion } from 'framer-motion'
import ServiceRequestTable from '../../components/Services/ServiceRequestTable'
import { serviceRequests } from '../../data/dummyData'

export default function PaidServices() {
  const data = serviceRequests.filter(s => s.type === 'paid')
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ServiceRequestTable data={data} title="Paid Order Tasks" />
    </motion.div>
  )
}
