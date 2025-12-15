"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  User,
  FileArchive,
  MessageCircle,
  Search,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { LogoutConfirmation } from "@/components/logout-confirmation"
import { useAuth } from "@/contexts/auth-context"
import { NotificationBell } from "./notification-bell"
import ProfileImage from "./profile-image"
import { Logo } from "@/components/logo"
import { DoctorSearch } from "./doctor-search"
import { AppointmentModal } from "@/components/appointment-modal"

export function DashboardNav() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null)
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)
  const { user, userProfile, logout } = useAuth()

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu, showNotifications])

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
    { href: "/dashboard/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/dashboard/records", label: "Records", icon: FileArchive },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  ]

  const userMenuLinks = [
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/feedback", label: "Feedback & Support", icon: MessageCircle },
  ]

  const handleLogout = async (force = false) => {
    try {
      const result = await logout(force)
      // If logout was prevented (PWA mode), show a message
      if (result?.prevented) {
        console.log("Logout prevented - running as PWA")
        // You can add a toast notification here if needed
        setShowLogoutConfirmation(false)
      } else {
        setShowLogoutConfirmation(false)
      }
    } catch (error) {
      console.error("Logout error:", error)
      setShowLogoutConfirmation(false)
    }
  }

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch)
  }

  const handleRequestBookFromSearch = (doctor) => {
    // doctor from search has id and displayName
    setSelectedDoctorForBooking(doctor ? { id: doctor.id, name: doctor.displayName } : null)
    setIsAppointmentModalOpen(true)
  }

  // Get profile photo URL from userProfile or user
  const profilePhotoURL = userProfile?.photoURL || user?.photoURL || null

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-pale-stone bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center md:w-1/4">
            <Logo href="/dashboard" showBadge={true} badgeText="Patient" />
          </div>

          {!isMobile && (
            <nav className="hidden md:flex md:w-1/2 md:justify-center">
              <div className="flex space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-pale-stone text-soft-amber"
                          : "text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                      }`}
                    >
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </nav>
          )}

          <div className="flex items-center justify-end space-x-4 md:w-1/4">
            {/* Desktop Search Bar */}
          {!isMobile && <DoctorSearch />}

            {/* Mobile Search Icon */}
            {isMobile && (
              <button
                onClick={toggleMobileSearch}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pale-stone text-drift-gray hover:text-soft-amber"
                aria-label="Search doctors"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="relative user-menu-container" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center rounded-full text-drift-gray hover:text-soft-amber"
                >
                  <ProfileImage src={profilePhotoURL} alt="Profile" className="h-8 w-8" role="patient" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-pale-stone bg-white shadow-lg">
                    <div className="p-2">
                      <div className="border-b border-pale-stone pb-2 mb-2">
                        <p className="px-3 py-1 text-sm font-medium text-graphite">
                          {userProfile?.displayName || user?.displayName || "User"}
                        </p>
                        <p className="px-3 py-1 text-xs text-drift-gray">
                          {userProfile?.email || user?.email || "user@example.com"}
                        </p>
                      </div>
                      {userMenuLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center rounded-md px-3 py-2 text-sm text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          setShowLogoutConfirmation(true)
                        }}
                        className="flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {isMobile && showMobileSearch && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-start justify-center pt-20"
          onClick={toggleMobileSearch}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <DoctorSearch isOverlay={true} onClose={toggleMobileSearch} onRequestBook={handleRequestBookFromSearch} />
          </div>
        </div>
      )}

      {/* Global Appointment Modal for handling bookings from mobile overlay */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        userRole="patient"
        selectedDoctor={selectedDoctorForBooking}
      />

      <LogoutConfirmation
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
      />
    </>
  )
}


