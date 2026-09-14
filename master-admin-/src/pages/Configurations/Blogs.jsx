import { motion } from 'framer-motion'
import { BlogTable } from '../../components/Configurations/ConfigurationTables'

export default function Blogs() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <BlogTable />
    </motion.div>
  )
}
