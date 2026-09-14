import { motion } from 'framer-motion'
import { AMCSettingsForm } from '../../components/System/SystemForms'

export default function AMCSettings() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <AMCSettingsForm />
    </motion.div>
  )
}
