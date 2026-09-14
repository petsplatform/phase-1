import { motion } from 'framer-motion'
import ServiceRequestTable from '../../components/Services/ServiceRequestTable'
import { serviceRequests } from '../../data/dummyData'

export default function AMCServices() {
  const data = serviceRequests.filter(s => s.type === 'amc')
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ServiceRequestTable data={data} title="Priority Fulfillment Tasks" />
    </motion.div>
  )
}
