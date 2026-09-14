import { motion } from 'framer-motion'
import HomePortal from '../../components/Home/HomePortal'

export default function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <HomePortal />
    </motion.div>
  )
}
