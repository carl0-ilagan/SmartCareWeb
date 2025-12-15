"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, ChevronLeft, ChevronRight, Clock, SettingsIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { LogoutConfirmation } from "@/components/logout-confirmation"
import ProfileImage from "@/components/profile-image"

// Import icons
import {
  LayoutDashboard,
  UsersIcon,
  UserCog,
  CalendarIcon,
  FileText,
  Settings,
  MessageSquare,
  Shield,
  Activity,
  LogOut,
  TrendingUp,
  User,
  Globe2,
} from "lucide-react"

export default function AdminSidebar({ isOpen = true, onClose, isMobile = false, collapsed = false, onCollapse }) {
  const pathname = usePathname()
  const { user, userProfile, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  // Update the navItems to use smaller icons
  // Replace the navItems definition with this updated version
  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      href: "/admin/dashboard",
    },
    {
      title: "Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      href: "/admin/analytics",
    },
    {
      title: "Patients",
      icon: <UsersIcon className="h-4 w-4" />,
      href: "/admin/patients",
    },
    {
      title: "Doctors",
      icon: <UserCog className="h-4 w-4" />,
      href: "/admin/doctors",
    },
    {
      title: "Pending Accounts",
      icon: <UserCog className="h-4 w-4" />,
      href: "/admin/pending-accounts",
    },
    {
      title: "Appointments",
      icon: <CalendarIcon className="h-4 w-4" />,
      href: "/admin/appointments",
    },
    {
      title: "Reports",
      icon: <FileText className="h-4 w-4" />,
      href: "/admin/reports",
    },
    {
      title: "Feedback",
      icon: <MessageSquare className="h-4 w-4" />,
      href: "/admin/feedback",
    },
    {
      title: "Logs",
      icon: <Activity className="h-4 w-4" />,
      href: "/admin/logs",
    },
    {
      title: "Roles",
      icon: <Shield className="h-4 w-4" />,
      href: "/admin/roles",
    },
    {
      title: "Brand Settings",
      icon: <Globe2 className="h-4 w-4" />,
      href: "/admin/welcome-editor",
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: "/admin/settings",
    },
  ]

  // Check if the current path matches the nav item
  const isActive = (href) => {
    return pathname === href
  }

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    if (onCollapse) {
      onCollapse(newCollapsedState)
    }
  }

  // Update local state when prop changes
  useEffect(() => {
    setIsCollapsed(collapsed)
  }, [collapsed])

  // Handle logout click
  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  // Confirm logout
  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    if (isMobile) {
      onClose()
    }
  }

  // Handle escape key press to close sidebar on mobile
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMobile && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isMobile, isOpen, onClose])

  // Prevent scrolling when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isMobile, isOpen])

  // Update the sidebar class to be fixed and non-scrollable
  // Replace the sidebarClass with this updated version
  const sidebarClass = `
    fixed inset-y-0 left-0 z-40
    transition-all duration-300 ease-in-out
    ${isMobile ? "z-50" : "z-30"}
    ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
    ${isCollapsed ? "w-16" : "w-60"}
    flex flex-col border-r border-earth-beige/60
    bg-gradient-to-b from-amber-50 via-white to-cream
    shadow-[8px_0_24px_-12px_rgba(0,0,0,0.15)]
    backdrop-blur-sm
  `

  // Backdrop with enhanced animation
  const backdropClass = `
    fixed inset-0 bg-black z-40
    transition-opacity duration-300 ease-in-out
    ${isMobile && isOpen ? "opacity-50" : "opacity-0 pointer-events-none"}
  `

  // Get user details
  const displayName = userProfile?.displayName || user?.displayName || "Admin User"
  const email = userProfile?.email || user?.email || "admin@smartcare.com"
  const photoURL = userProfile?.photoURL || user?.photoURL || null
  const role = "Administrator"
  const lastLogin = new Date().toLocaleDateString()

  return (
    <>
      {/* Backdrop with smooth fade animation */}
      {isMobile && <div className={backdropClass} onClick={onClose} />}

      <aside className={sidebarClass}>
        {/* Update the sidebar header to be more compact
        // Replace the sidebar header with this updated version */}
        {!isCollapsed && (
          <div className="h-14 flex items-center justify-between px-3 border-b border-earth-beige/70 bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Control Panel
              </span>
            </div>
            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-amber-50 transition-colors duration-200"
              >
                <X className="h-4 w-4 text-graphite" />
              </button>
            )}
          </div>
        )}

        {/* Update the user info section to be more compact
        // Replace the user info section with this updated version */}
        {!isCollapsed && (
          <div className="p-3 border-b border-earth-beige/70 bg-white/60">
            <div
              className="flex items-center cursor-pointer hover:bg-amber-50/80 p-1.5 rounded-lg transition-colors duration-200"
              onClick={() => setShowUserDetails(!showUserDetails)}
            >
              <div className="h-8 w-8 rounded-full bg-soft-amber/20 flex items-center justify-center text-soft-amber mr-2 overflow-hidden">
                <ProfileImage
                  userId={user?.uid}
                  src={photoURL}
                  alt="Admin"
                  className="h-8 w-8"
                  role="admin"
                  size="sm"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs text-graphite">{displayName}</p>
                <p className="text-[11px] text-drift-gray truncate max-w-[140px]">{email}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-600">Online</span>
                </div>
              </div>
              <div className="text-drift-gray">
                <ChevronRight
                  className={`h-3 w-3 transition-transform duration-200 ${showUserDetails ? "rotate-90" : ""}`}
                />
              </div>
            </div>

            {/* Expanded user details */}
            <div
              className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${
                showUserDetails ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="bg-pale-stone/30 rounded-lg p-2 text-xs space-y-1">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-soft-amber mr-1" />
                  <span className="text-drift-gray text-xs">Role: </span>
                  <span className="ml-1 text-graphite font-medium text-xs">{role}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 text-soft-amber mr-1" />
                  <span className="text-drift-gray text-xs">Last login: </span>
                  <span className="ml-1 text-graphite font-medium text-xs">{lastLogin}</span>
                </div>
                <Link href="/admin/profile" className="flex items-center text-soft-amber hover:underline mt-1 text-xs">
                  <SettingsIcon className="h-2.5 w-2.5 mr-1" />
                  <span>Manage profile</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Update the navigation section to be fixed instead of scrollable
        // and make the design more minimalist

        // Replace the Navigation section with this updated version */}
        {/* Navigation */}
        <nav
          className={`p-2 ${isCollapsed ? "h-auto" : "h-auto"} ${
            isMobile ? "max-h-[calc(100vh-200px)] overflow-y-auto pr-1" : ""
          }`}
        >
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.title} className="relative">
                <Link
                  href={item.href}
                  className={`group relative flex items-center px-2 py-2 rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-100"
                      : "text-drift-gray hover:bg-amber-50/60 hover:text-amber-700 border border-transparent"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ transformOrigin: "left center" }}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full transition-all duration-200 ${
                      isActive(item.href) ? "bg-amber-500" : "bg-transparent group-hover:bg-amber-300"
                    }`}
                  />
                  <span
                    className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : "pl-1"} group-hover:translate-x-1 transition-transform duration-200 active:scale-[0.98]`}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                  </span>
                </Link>

                {/* Tooltip for collapsed sidebar */}
                {isCollapsed && hoveredItem === item.title && (
                  <div
                    className="absolute left-full top-0 ml-2 px-2 py-1 bg-white rounded-md shadow-md text-sm text-graphite whitespace-nowrap z-50 border border-earth-beige"
                    style={{
                      animation: "fadeIn 0.2s ease-in-out forwards",
                    }}
                  >
                    {item.title}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse/Expand Button */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute bottom-20 -right-3 bg-white rounded-full p-1 shadow-md border border-earth-beige transition-transform duration-200 hover:scale-110"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-drift-gray" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-drift-gray" />
            )}
          </button>
        )}

        {/* Update the logout button to be more compact
        // Replace the logout button section with this updated version */}
        <div className="mt-auto p-3 border-t border-earth-beige">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-md text-drift-gray hover:bg-pale-stone transition-colors duration-200 ${
              isCollapsed ? "justify-center w-full px-2 py-2" : "w-full px-2 py-1.5"
            }`}
            title={isCollapsed ? "Logout" : ""}
            onMouseEnter={() => setHoveredItem("Logout")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2 text-sm">Logout</span>}

            {/* Tooltip for collapsed sidebar */}
            {isCollapsed && hoveredItem === "Logout" && (
              <div
                className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-white rounded-md shadow-md text-sm text-graphite whitespace-nowrap z-50 border border-earth-beige"
                style={{
                  animation: "fadeIn 0.2s ease-in-out forwards",
                }}
              >
                Logout
              </div>
            )}
          </button>

          {!isCollapsed && (
            <div className="mt-3 text-[10px] text-drift-gray/80 flex items-center justify-between">
              <span className="uppercase tracking-wide">SmartCare</span>
              <span className="text-amber-700 font-semibold">v2.0</span>
            </div>
          )}
        </div>
      </aside>

      {/* Add the fadeIn animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  )
}
