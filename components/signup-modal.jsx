import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Stethoscope, CheckCircle } from "lucide-react"
import { SignupSuccessModal } from "@/components/signup-success-modal"
import { WelcomeModal } from "@/components/welcome-modal"
import { TermsPrivacyModal } from "@/components/terms-privacy-modal"
import { useAuth } from "@/contexts/auth-context"

export function SignupModal({ isOpen, onClose, onSwitchToSignin }) {
  const [accountType, setAccountType] = useState("patient")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const router = useRouter()
  const { signup, signInWithGoogle, userRole, user } = useAuth()

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


  const handleGoogleSignUp = async () => {
    if (!termsAccepted) {
      setError("Please accept the terms and conditions to continue")
      return
    }
    setIsLoading(true)
    try {
      const result = await signInWithGoogle(accountType)
      // Only show success modal if sign-up was successful
      if (result) {
        // Check if this is a new user (status 0 = pending approval) or existing user (status 1 = approved)
        // For now, we'll check if user document exists
        // If it's a new signup, show success modal. If existing user, show welcome modal
        setIsExistingUser(true)
        setShowWelcomeModal(true)
      }
    } catch (error) {
      console.error("Google signup error:", error)
      setError(error.message || "Failed to sign up with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false)
    // Check if user is approved or pending
    if (user) {
      // If approved (existing user), redirect to dashboard
      if (userRole === "patient") {
        router.push("/dashboard")
      } else if (userRole === "doctor") {
        router.push("/doctor/dashboard")
      } else if (userRole === "admin") {
        router.push("/admin/dashboard")
      }
    } else {
      // If new user, show success modal instead
      setShowSuccessModal(true)
    }
    if (onClose) onClose()
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    // Redirect to waiting approval page for new users
    router.push("/waiting-approval")
  }

  if (!isOpen && !isVisible) return null

  const roleDescriptions = {
    patient: {
      title: "Patient",
      description: "Access virtual consultations, manage appointments, and receive personalized care from healthcare providers.",
      benefits: [
        "Book appointments with healthcare providers",
        "Access virtual consultations",
        "Manage prescriptions and medical records",
        "Receive personalized care recommendations"
      ]
    },
    doctor: {
      title: "Healthcare Provider",
      description: "Connect with patients, manage your practice, and provide virtual care through our platform.",
      benefits: [
        "Expand your practice virtually",
        "Manage appointments and patient records",
        "Provide secure video consultations",
        "Access patient medical history"
      ]
    }
  }

  return (
    <>
      {showWelcomeModal && (
        <WelcomeModal isOpen={showWelcomeModal} onClose={handleWelcomeModalClose} userType={userRole} userName={user?.displayName || ""} />
      )}
      
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${
        isVisible ? (isClosing ? "opacity-0" : "opacity-100") : "opacity-0"
      }`}>
        <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isVisible ? (isClosing ? "opacity-0" : "opacity-100") : "opacity-0"
          }`}
          onClick={() => closeWithAnimation(onClose)}
        />
      <div 
        className={`relative w-full max-w-2xl mx-auto bg-white rounded-xl shadow-2xl transition-all duration-300 transform ${
          isVisible ? (isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100") : "opacity-0 scale-95"
        } max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col`}
      >
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="text-center mb-3 sm:mb-4 md:mb-6">
            <div className="inline-block">
              <div className="flex items-center justify-center">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-soft-amber">Smart</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-graphite">Care</span>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-drift-gray mt-1 sm:mt-2">Your Health, Our Priority</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="space-y-1 sm:space-y-2 text-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-graphite">Create an Account</h1>
              <p className="text-xs sm:text-sm md:text-base text-drift-gray">Join Smart Care for better healthcare experience</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-600 border border-red-100 shadow-sm">
                {error}
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-medium text-graphite">Select Your Role</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {Object.entries(roleDescriptions).map(([type, info]) => (
                  <div key={type} className="flex-1">
                    <input
                      type="radio"
                      id={type}
                      name="accountType"
                      value={type}
                      checked={accountType === type}
                      onChange={() => setAccountType(type)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={type}
                      className={`flex cursor-pointer items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-3 md:p-4 transition-all duration-200 hover:shadow-md ${
                        accountType === type
                          ? "border-soft-amber bg-white shadow-lg"
                          : "border-earth-beige bg-white hover:border-soft-amber/50"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {type === "patient" ? (
                          <User className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 ${accountType === type ? "text-soft-amber" : "text-drift-gray"}`} />
                        ) : (
                          <Stethoscope className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 ${accountType === type ? "text-soft-amber" : "text-drift-gray"}`} />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <span className={`text-xs sm:text-sm md:text-base font-semibold truncate ${accountType === type ? "text-soft-amber" : "text-graphite"}`}>
                            {info.title}
                          </span>
                          {accountType === type && (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-soft-amber" />
                          )}
                        </div>
                        <p className="text-xs text-drift-gray mb-1 sm:mb-2 line-clamp-2">{info.description}</p>
                        <div className="space-y-0.5 sm:space-y-1">
                          {info.benefits.slice(0, 2).map((benefit, index) => (
                            <div key={index} className="flex items-start gap-1 text-xs text-drift-gray">
                              <CheckCircle className="h-3 w-3 mt-0.5 text-soft-amber flex-shrink-0" />
                              <span className="line-clamp-1">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-earth-beige bg-pale-stone/30 shadow-sm">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 sm:mt-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-earth-beige text-soft-amber focus:ring-soft-amber flex-shrink-0"
              />
              <label htmlFor="terms" className="text-xs sm:text-sm text-drift-gray leading-relaxed">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-soft-amber hover:underline font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-soft-amber hover:underline font-medium"
                >
                  Privacy Policy
                </button>
                . I understand that my account will need to be approved by administrators before I can access the platform.
              </label>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading || !termsAccepted}
              className={`w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-4 border border-earth-beige rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm font-medium text-graphite bg-white transition-all duration-200 ${
                termsAccepted
                  ? "hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" viewBox="0 0 24 24">
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
              {isLoading ? "Creating account..." : "Sign up with Google"}
            </button>

            <div className="text-center pt-2 sm:pt-3 md:pt-4 border-t border-earth-beige/30">
              <p className="text-xs sm:text-sm text-drift-gray">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchToSignin) {
                      closeWithAnimation(() => onSwitchToSignin())
                    } else {
                      closeWithAnimation(onClose)
                    }
                  }}
                  className="font-medium text-soft-amber hover:underline transition-colors duration-200"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <SignupSuccessModal isOpen={showSuccessModal} onClose={handleSuccessModalClose} userType={accountType} />
      
      {/* Terms and Privacy Modals */}
      <TermsPrivacyModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        type="terms"
      />
      <TermsPrivacyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
        type="privacy"
      />
    </div>
    </>
  )
} 