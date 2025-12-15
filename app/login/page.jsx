"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, LogIn, Shield } from "lucide-react"
import { AdminSigninModal } from "@/components/admin-signin-modal"
import { WelcomeModal } from "@/components/welcome-modal"
import { SignupModal } from "@/components/signup-modal"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [hasLoggedIn, setHasLoggedIn] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const router = useRouter()
  const { login, signInWithGoogle, userRole, user } = useAuth()

  // Check if admin is already signed in (simulated)
  useEffect(() => {
    // This would normally check a token or session
    const checkAdminSession = () => {
      // For demo purposes, we'll show the modal if the URL has a query param
      if (window.location.search.includes("admin=true")) {
        setShowAdminModal(true)
      }
    }

    checkAdminSession()
  }, [])

  // Show welcome modal when user logs in
  useEffect(() => {
    console.log("useEffect check - user:", !!user, "userRole:", userRole, "showWelcomeModal:", showWelcomeModal, "hasLoggedIn:", hasLoggedIn)
    if (user && userRole && !showWelcomeModal && hasLoggedIn) {
      console.log("✅ User logged in, showing welcome modal")
      setShowWelcomeModal(true)
    }
  }, [user, userRole, showWelcomeModal, hasLoggedIn])

  // Redirect if user is already logged in (ONLY if not showing welcome modal and not just logged in)
  useEffect(() => {
    if (user && userRole && !showWelcomeModal && !hasLoggedIn) {
      // This handles cases where user is already logged in (page refresh scenario)
      if (userRole === "patient") {
        router.push("/dashboard")
      } else if (userRole === "doctor") {
        router.push("/doctor/dashboard")
      } else if (userRole === "admin") {
        router.push("/admin/dashboard")
      }
    }
  }, [user, userRole, router, showWelcomeModal, hasLoggedIn])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signInWithGoogle()
      // Only show welcome modal if sign-in was successful
      if (result) {
        setShowWelcomeModal(true)
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      
      // Check if it's an account not found error
      if (error.code === "account-not-found" || error.message?.includes("no account yet") || error.message?.includes("sign up first")) {
        setError("This Gmail account has no account yet. Please sign up first.")
      } else {
        setError("Failed to sign in with Google. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false)
    setHasLoggedIn(false) // Reset the flag
    // Redirect to appropriate dashboard
    if (userRole === "patient") {
      router.push("/dashboard")
    } else if (userRole === "doctor") {
      router.push("/doctor/dashboard")
    } else if (userRole === "admin") {
      router.push("/admin/dashboard")
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // Set flags FIRST before calling signInWithGoogle
      console.log("Setting hasLoggedIn to true BEFORE Google login")
      setHasLoggedIn(true)
      
      const result = await signInWithGoogle()
      
      // Device approval functionality removed - proceed directly with login
      
      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show welcome modal if sign-in was successful
      if (result) {
        console.log("Google login successful, showing welcome modal")
        setShowWelcomeModal(true)
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      setHasLoggedIn(false) // Reset on error
      
      // Check if it's an account not found error
      if (error.code === "account-not-found" || error.message?.includes("no account yet") || error.message?.includes("sign up first")) {
        setError("This Gmail account has no account yet. Please sign up first.")
      } else {
        setError("Failed to sign in with Google. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-pale-stone via-white to-pale-stone">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-soft-amber/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-soft-amber/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-soft-amber/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-soft-amber/60 animate-orbit"></span>
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/70 animate-orbitSlow"></span>
      </div>
      {/* Admin already signed in modal */}
      <AdminSigninModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />

      {/* Welcome modal - Show when user has just logged in */}
      {showWelcomeModal && (
        <WelcomeModal 
          isOpen={showWelcomeModal} 
          onClose={handleWelcomeModalClose} 
          userType={userRole} 
          userName={user?.displayName || ""} 
        />
      )}

      {/* Signup modal */}
      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} onSwitchToSignin={() => setShowSignupModal(false)} />

      <div className="flex flex-col md:flex-row flex-1 relative z-10">
        {/* Back to welcome */}
        <div className="absolute left-4 top-4">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full border-2 border-soft-amber text-soft-amber font-semibold transition-all duration-300 hover:bg-soft-amber hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        </div>
        {/* Left side - Login form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <div className="flex items-center justify-center">
                  <span className="text-3xl font-bold text-soft-amber">Smart</span>
                  <span className="text-3xl font-bold text-graphite">Care</span>
                </div>
                <p className="text-drift-gray mt-2">Your Health, Our Priority</p>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-lg ring-4 ring-soft-amber/10 animate-glow p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-graphite mb-6">Sign In</h1>

              {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}

              <div className="mb-6 text-center">
                <p className="text-drift-gray">Sign in with your Google account to access Smart Care</p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-earth-beige rounded-md shadow-sm text-sm font-medium text-graphite bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber disabled:opacity-70"
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
              <div className="mt-6 rounded-xl border border-earth-beige bg-pale-stone/40 p-4 sm:p-5">
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

              <div className="mt-6 text-center">
                <p className="text-sm text-drift-gray">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setShowSignupModal(true)} className="text-soft-amber hover:underline">
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Animation */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-b from-soft-amber/10 via-transparent to-soft-amber/10">
          <div className="h-full flex items-center justify-center p-8">
            <div className="relative w-full max-w-2xl h-[32rem] lg:h-[36rem]">
              {/* Large glowing gradient orb */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-soft-amber/30 via-white to-orange-200/30 blur-2xl animate-spin-slow"></div>
              {/* Outer soft ring */}
              <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white/30 to-soft-amber/20 blur-xl"></div>
              {/* Core circle with shimmer ring */}
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-xl ring-8 ring-soft-amber/10 overflow-hidden animate-glow">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-soft-amber/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-yellow-50 via-white to-amber-50 flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-soft-amber">
                    <rect x="6" y="10" width="12" height="8" rx="2" fill="#FBBF24"/>
                    <rect x="9" y="6" width="6" height="6" rx="3" fill="#FDE68A"/>
                  </svg>
                </div>
              </div>

              {/* Orbiting particles */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-soft-amber/80 orbit" style={{ height: '10px', width: '10px', ['--r']: '150px', animationDuration: '10s' }}></span>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/80 orbit" style={{ height: '8px', width: '8px', ['--r']: '190px', animationDuration: '14s' }}></span>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/90 orbit reverse" style={{ height: '6px', width: '6px', ['--r']: '120px', animationDuration: '8s' }}></span>
              {/* Additional accent particles */}
              <div className="absolute -top-2 right-24 h-3 w-3 rounded-full bg-soft-amber/40 animate-float-soft"></div>
              <div className="absolute bottom-6 left-20 h-2.5 w-2.5 rounded-full bg-orange-300/40 animate-float-soft-delayed"></div>

              {/* Floating glass cards */}
              <div className="absolute -left-4 top-8 w-48 rounded-2xl bg-white/60 backdrop-blur-sm border border-soft-amber/20 shadow-md p-4 animate-float-soft rotate-[-2deg]">
                <div className="h-2 w-24 rounded-full bg-soft-amber/30 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-earth-beige/60"></div>
                  <div className="h-2 rounded-full bg-earth-beige/40 w-3/4"></div>
                </div>
              </div>
              <div className="absolute right-2 bottom-14 w-52 rounded-2xl bg-white/60 backdrop-blur-sm border border-soft-amber/20 shadow-md p-4 animate-float-soft-delayed rotate-[2deg]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-full bg-soft-amber/30"></div>
                  <div className="h-2 w-20 rounded-full bg-earth-beige/60"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-earth-beige/50"></div>
                  <div className="h-2 rounded-full bg-earth-beige/30 w-2/3"></div>
                </div>
              </div>
              <div className="absolute left-10 bottom-28 w-40 rounded-2xl bg-white/60 backdrop-blur-sm border border-soft-amber/20 shadow-md p-4 animate-float-soft" style={{ animationDuration: '6s' }}>
                <div className="h-2 w-16 rounded-full bg-soft-amber/30 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-earth-beige/60"></div>
                  <div className="h-2 rounded-full bg-earth-beige/40 w-2/3"></div>
                </div>
              </div>

              {/* Title and caption */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 text-center">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-graphite via-soft-amber to-graphite">Welcome Back!</h2>
                <p className="text-drift-gray mt-2">Sign in to manage your care with ease.</p>
              </div>
            </div>
          </div>
          <style jsx global>{`
            @keyframes float-slow {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes float-slow-delay {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes float-slow-delay-more {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
            .animate-float-slow-delay { animation: float-slow-delay 4s ease-in-out infinite 1s; }
            .animate-float-slow-delay-more { animation: float-slow-delay-more 4s ease-in-out infinite 2s; }
            @keyframes wave {
              0% { transform: rotate(0deg); }
              10% { transform: rotate(14deg); }
              20% { transform: rotate(-8deg); }
              30% { transform: rotate(14deg); }
              40% { transform: rotate(-4deg); }
              50% { transform: rotate(10deg); }
              60% { transform: rotate(0deg); }
              100% { transform: rotate(0deg); }
            }
            .animate-wave { animation: wave 2s infinite; display: inline-block; }
            /* Moved from bottom to avoid nested styled-jsx */
            @keyframes glowPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.18); }
              50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.08); }
            }
            .animate-glow { animation: glowPulse 2.4s ease-in-out infinite; }
            @keyframes orbit {
              0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
              100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
            }
            .animate-orbit { animation: orbit 9s linear infinite; }
            .animate-orbitSlow { animation: orbit 12s linear infinite; }

            /* New smooth animations */
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .animate-shimmer { animation: shimmer 3s linear infinite; }
            @keyframes spin-slow {
              0% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(180deg) scale(1.02); }
              100% { transform: rotate(360deg) scale(1); }
            }
            .animate-spin-slow { animation: spin-slow 20s linear infinite; }
            @keyframes float-soft {
              0%, 100% { transform: translateY(0) }
              50% { transform: translateY(-6px) }
            }
            .animate-float-soft { animation: float-soft 4.5s ease-in-out infinite; }
            .animate-float-soft-delayed { animation: float-soft 5.2s ease-in-out infinite 0.6s; }

            /* Variable-radius orbits and reverse */
            .orbit { animation: orbitVar 12s linear infinite; height: 8px; width: 8px; }
            .orbit.reverse { animation-name: orbitVarRev; }
            @keyframes orbitVar {
              0% { transform: rotate(0deg) translateX(var(--r, 140px)) rotate(0deg); }
              100% { transform: rotate(360deg) translateX(var(--r, 140px)) rotate(-360deg); }
            }
            @keyframes orbitVarRev {
              0% { transform: rotate(360deg) translateX(var(--r, 140px)) rotate(-360deg); }
              100% { transform: rotate(0deg) translateX(var(--r, 140px)) rotate(0deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  )
}
