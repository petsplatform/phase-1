import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Component } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebar } from '../../context/SidebarContext'

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.routeKey !== this.props.routeKey) {
      this.setState({ hasError: false, error: null })
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred on this page.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl"
            style={{ background: 'var(--primary)' }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Layout() {
  const location = useLocation()
  const { isTopbarVisible } = useSidebar()

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--card-bg) 92%, white), color-mix(in srgb, var(--bg-light) 96%, white))',
      }}
    >
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <AnimatePresence>
          {isTopbarVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="shrink-0"
            >
              <Topbar />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 xl:p-7 2xl:p-8">
          <div className="mx-auto w-full max-w-[1800px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <PageErrorBoundary routeKey={location.pathname}>
                  <Outlet />
                </PageErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
