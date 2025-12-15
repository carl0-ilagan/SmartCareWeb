import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminSigninModal } from "@/components/admin-signin-modal"
import { WelcomeModal } from "@/components/welcome-modal"
import { LogIn, CheckCircle2, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [hasLoggedIn, setHasLoggedIn] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const router = useRouter()
  const { login, signInWithGoogle, userRole, user } = useAuth()

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300) // Match this with the animation duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  const closeWithAnimation = (cb) => {
    setIsClosing(true)
    setTimeout(() => {
      // Call parent close AFTER animation without resetting isClosing to avoid flicker
      cb?.()
    }, 300)
  }


  useEffect(() => {
    if (!isOpen) return
    // This would normally check a token or session
    if (typeof window !== "undefined" && window.location.search.includes("admin=true")) {
      setShowAdminModal(true)
    }
  }, [isOpen])

  // Redirect if user is already logged in (only if not showing welcome modal and not just logged in)
  useEffect(() => {
    // Only redirect if the modal is open, user/role are set, NOT showing welcome modal, and NOT just logged in
    if (isOpen && user && userRole && !showWelcomeModal && !hasLoggedIn) {
      // This handles cases where user is already logged in (re-open modal scenario)
      if (userRole === "patient") {
        router.push("/dashboard")
      } else if (userRole === "doctor") {
        router.push("/doctor/dashboard")
      } else if (userRole === "admin") {
        router.push("/admin/dashboard")
      }
      if (onClose) onClose()
    }
  }, [isOpen, user, userRole, router, onClose, showWelcomeModal, hasLoggedIn])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    try {
      // Set flags FIRST before calling signInWithGoogle (same as login page)
      setHasLoggedIn(true)
      
      const result = await signInWithGoogle()
      console.log("Login result:", result)
      
      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Only show welcome modal if sign-in was successful
      if (result) {
        console.log("Google login successful, showing welcome modal")
        setShowWelcomeModal(true)
      }
    } catch (error) {
      // Check if it's an account not found error
      if (error.code === "account-not-found" || error.message?.includes("no account yet") || error.message?.includes("sign up first")) {
        setError("This Gmail account has no account yet. Please sign up first.")
      } else {
        setError("Failed to sign in with Google. Please try again.")
      }
      setHasLoggedIn(false) // Reset on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      // Set flags FIRST before calling login
      setHasLoggedIn(true)
      
      const result = await login(email, password, rememberMe)
      
      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Only show welcome modal if sign-in was successful
      if (result) {
        setShowWelcomeModal(true)
      }
    } catch (error) {
      setError(error.message || "Failed to sign in. Please check your credentials and try again.")
      setHasLoggedIn(false) // Reset on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleWelcomeModalClose = async () => {
    setShowWelcomeModal(false)
    
    // Wait a bit to allow the modal to close
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setHasLoggedIn(false) // Reset the flag
    
    if (userRole === "patient") {
      router.push("/dashboard")
    } else if (userRole === "doctor") {
      router.push("/doctor/dashboard")
    } else if (userRole === "admin") {
      router.push("/admin/dashboard")
    }
    if (onClose) onClose()
  }

  if (!isOpen && !isVisible) return null

  console.log("Render - showWelcomeModal:", showWelcomeModal, "userRole:", userRole, "hasLoggedIn:", hasLoggedIn)
  
  return (
    <>
      {showWelcomeModal && (
        <WelcomeModal isOpen={showWelcomeModal} onClose={handleWelcomeModalClose} userType={userRole} userName={user?.displayName || ""} />
      )}
      
      {/* Hide LoginModal when WelcomeModal is showing */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${
        showWelcomeModal ? "hidden" : isVisible ? (isClosing ? "opacity-0" : "opacity-100") : "opacity-0"
      }`}>
        <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isVisible ? (isClosing ? "opacity-0" : "opacity-100") : "opacity-0"
          }`}
          onClick={() => closeWithAnimation(onClose)}
        />
        <div 
          className={`relative w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl transition-all duration-300 transform ${
            isVisible ? (isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100") : "opacity-0 scale-95"
          }`}
        >
        <div className="p-5 sm:p-6 md:p-8">
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="space-y-1 sm:space-y-2 text-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-graphite">Welcome Back</h1>
              <p className="text-xs sm:text-sm md:text-base text-drift-gray">Sign in with your Google account</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-600 border border-red-100 shadow-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-2.5 sm:py-3 px-4 border border-earth-beige rounded-xl shadow-sm text-sm font-medium text-graphite bg-white transition-all duration-200 ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber"
              }`}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </button>

            {/* How to sign in - steps */}
            <div className="mt-5 sm:mt-6 rounded-xl border border-earth-beige bg-pale-stone/40 p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-semibold text-graphite flex items-center gap-2">
                <LogIn className="h-4 w-4 text-soft-amber" />
                How to sign in
              </h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-soft-amber text-white text-xs">1</span>
                  <span className="text-sm text-drift-gray">Click the <span className="font-medium text-graphite">“Sign in with Google”</span> button.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-soft-amber text-white text-xs">2</span>
                  <span className="text-sm text-drift-gray">Choose your Google account and grant access if prompted.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-soft-amber text-white text-xs">3</span>
                  <span className="text-sm text-drift-gray">We’ll welcome you <span className="font-medium text-graphite">then take you to your dashboard</span>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-soft-amber text-white text-xs">4</span>
                </li>
              </ol>
              <div className="mt-4 flex items-center gap-2 text-xs text-drift-gray">
                <CheckCircle2 className="h-4 w-4 text-soft-amber" />
                Secure sign-in powered by Google. We never see your password.
              </div>
            </div>

            <div className="text-center pt-3 sm:pt-4 border-t border-earth-beige/30">
              <p className="text-xs sm:text-sm text-drift-gray">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchToSignup) {
                      closeWithAnimation(() => onSwitchToSignup())
                    } else {
                      closeWithAnimation(onClose)
                    }
                  }}
                  className="font-medium text-soft-amber hover:underline transition-colors duration-200"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
} 