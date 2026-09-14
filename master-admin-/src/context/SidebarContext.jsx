import { createContext, useContext, useEffect, useState } from 'react'

const SidebarContext = createContext(null)
const DESKTOP_BREAKPOINT = 1024

export function SidebarProvider({ children }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isTopbarVisible, setIsTopbarVisible] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= DESKTOP_BREAKPOINT
  )
  const [openMenus, setOpenMenus] = useState({})

  const toggleSidebar = () => setIsSidebarVisible((prev) => !prev)
  const toggleTopbar = () => setIsTopbarVisible((prev) => !prev)
  const toggleCollapse = () => setIsCollapsed((prev) => !prev)
  const toggleMobile = () => setIsMobileOpen((prev) => !prev)

  const toggleMenu = (menuKey) => {
    setOpenMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }))
  }

  useEffect(() => {
    const syncViewport = () => {
      const nextIsDesktop = window.innerWidth >= DESKTOP_BREAKPOINT
      setIsDesktop(nextIsDesktop)
      setIsMobileOpen(false)
      setIsSidebarVisible(true)
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  return (
    <SidebarContext.Provider value={{ 
      isSidebarVisible, toggleSidebar,
      isTopbarVisible, toggleTopbar,
      isCollapsed, toggleCollapse, 
      isMobileOpen, setIsMobileOpen, toggleMobile,
      isDesktop,
      openMenus, toggleMenu 
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
