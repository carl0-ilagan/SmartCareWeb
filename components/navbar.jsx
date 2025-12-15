"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { Logo } from "@/components/logo"
import { useRouter } from "next/navigation"
import { SignupModal } from "@/components/signup-modal"

export function Navbar({ onSidebarOpen, onSignIn, scrollToSection }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const isMobile = useMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()
  const currentPathname = router.pathname || ''

  // Handle navigation click with smooth scroll
  const handleNavClick = (e, sectionId) => {
    e.preventDefault()
    if (scrollToSection) {
      scrollToSection(sectionId)
    }
    setMobileMenuOpen(false)
  }

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200 ${
          isScrolled ? "bg-white/95 shadow-md backdrop-blur-md" : "bg-white/90 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between relative">
            {/* Logo left */}
            <div className="flex items-center flex-shrink-0">
              <Logo href="/" />
            </div>

            {/* Desktop Center Nav */}
            {!isMobile && (
              <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-8">
                <button
                  onClick={(e) => handleNavClick(e, 'home')}
                  className="text-sm font-medium transition-colors text-drift-gray hover:text-soft-amber"
                >
                  Home
                </button>
                <button
                  onClick={(e) => handleNavClick(e, 'features')}
                  className="text-sm font-medium transition-colors text-drift-gray hover:text-soft-amber"
                >
                  Features
                </button>
                <button
                  onClick={(e) => handleNavClick(e, 'how-it-works')}
                  className="text-sm font-medium transition-colors text-drift-gray hover:text-soft-amber"
                >
                  How It Works
                </button>
                <button
                  onClick={(e) => handleNavClick(e, 'testimonials')}
                  className="text-sm font-medium transition-colors text-drift-gray hover:text-soft-amber"
                >
                  Testimonials
                </button>
                <button
                  onClick={(e) => handleNavClick(e, 'for-doctors')}
                  className="text-sm font-medium transition-colors text-drift-gray hover:text-soft-amber"
                >
                  For Doctors
                </button>
                <button
                  onClick={(e) => handleNavClick(e, 'contact')}
                  className="text-sm font-medium transition-colors text-drift-gray hover:text-soft-amber"
                >
                  Contact
                </button>
              </nav>
            )}

            {/* Desktop Auth Buttons Right */}
            {!isMobile && (
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  onClick={onSignIn}
                  className="inline-flex h-9 sm:h-10 items-center justify-center rounded-lg border border-earth-beige bg-white px-3 sm:px-4 text-xs sm:text-sm font-medium text-graphite transition-colors hover:bg-pale-stone shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="inline-flex h-9 sm:h-10 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Right */}
            {isMobile && (
              <div className="ml-auto flex items-center">
                <button
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md p-2 text-drift-gray hover:bg-pale-stone hover:text-amber-600 focus:outline-none"
                  aria-label="Open menu"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                {/* Dropdown */}
                <div
                  ref={dropdownRef}
                  className={`fixed left-0 right-0 top-16 bg-white shadow-lg transition-all duration-300 z-50 overflow-y-auto max-h-[calc(100vh-4rem)] ${
                    mobileMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
                  }`}
                >
                  <nav className="flex flex-col py-2 w-full">
                    <button
                      onClick={(e) => handleNavClick(e, 'home')}
                      className="px-4 py-3 text-sm font-medium transition-colors text-left text-drift-gray hover:bg-pale-stone hover:text-amber-600"
                    >
                      Home
                    </button>
                    <button
                      onClick={(e) => handleNavClick(e, 'features')}
                      className="px-4 py-3 text-sm font-medium transition-colors text-left text-drift-gray hover:bg-pale-stone hover:text-amber-600"
                    >
                      Features
                    </button>
                    <button
                      onClick={(e) => handleNavClick(e, 'how-it-works')}
                      className="px-4 py-3 text-sm font-medium transition-colors text-left text-drift-gray hover:bg-pale-stone hover:text-amber-600"
                    >
                      How It Works
                    </button>
                    <button
                      onClick={(e) => handleNavClick(e, 'testimonials')}
                      className="px-4 py-3 text-sm font-medium transition-colors text-left text-drift-gray hover:bg-pale-stone hover:text-amber-600"
                    >
                      Testimonials
                    </button>
                    <button
                      onClick={(e) => handleNavClick(e, 'for-doctors')}
                      className="px-4 py-3 text-sm font-medium transition-colors text-left text-drift-gray hover:bg-pale-stone hover:text-amber-600"
                    >
                      For Doctors
                    </button>
                    <button
                      onClick={(e) => handleNavClick(e, 'contact')}
                      className="px-4 py-3 text-sm font-medium transition-colors text-left text-drift-gray hover:bg-pale-stone hover:text-amber-600"
                    >
                      Contact
                    </button>
                    <div className="border-t border-earth-beige my-2" />
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        onSignIn()
                      }}
                      className="mx-4 mb-2 mt-1 flex h-10 items-center justify-center rounded-md border border-earth-beige bg-white px-4 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setShowSignupModal(true)
                      }}
                      className="mx-4 mb-3 flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-amber-500 to-amber-400 px-4 text-sm font-medium text-white transition-colors hover:from-amber-600 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      Sign Up
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />
      {/* Animation for dropdown */}
      <style jsx>{`
        .dropdown-enter {
          opacity: 0;
          transform: scale(0.95);
        }
        .dropdown-enter-active {
          opacity: 1;
          transform: scale(1);
          transition: opacity 0.3s, transform 0.3s;
        }
        .dropdown-exit {
          opacity: 1;
          transform: scale(1);
        }
        .dropdown-exit-active {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.3s, transform 0.3s;
        }
      `}</style>
    </>
  )
}
