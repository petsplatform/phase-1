import { motion } from 'framer-motion'
import { InquiryTable } from '../../components/Configurations/ConfigurationTables'

export default function Inquiries() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <InquiryTable />
    </motion.div>
  )
}
