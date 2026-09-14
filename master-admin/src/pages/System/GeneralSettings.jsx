import { motion } from 'framer-motion'
import { GeneralSettingsForm } from '../../components/System/SystemForms'

export default function GeneralSettings() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <GeneralSettingsForm />
    </motion.div>
  )
}
