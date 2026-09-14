import { motion } from 'framer-motion'
import { ServiceTypeSettingsList } from '../../components/System/SystemForms'

export default function ServiceTypeSettings() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ServiceTypeSettingsList />
    </motion.div>
  )
}
