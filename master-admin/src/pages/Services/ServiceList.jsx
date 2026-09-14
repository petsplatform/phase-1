import { motion } from 'framer-motion'
import ServiceRequestTable from '../../components/Services/ServiceRequestTable'
import { serviceRequests } from '../../data/dummyData'

export default function ServiceList() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ServiceRequestTable data={serviceRequests} title="All Fulfillment Tasks" />
    </motion.div>
  )
}
