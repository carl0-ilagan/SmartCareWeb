"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: Email, 2: Verification, 3: New Password, 4: Success
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEmailSubmit = (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate API call to send verification code
    setTimeout(() => {
      setIsLoading(false)
      setStep(2)
    }, 1500)
  }

  const handleVerificationSubmit = (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Check if verification code is complete
    if (verificationCode.some((digit) => digit === "")) {
      setError("Please enter the complete verification code")
      setIsLoading(false)
      return
    }

    // Simulate API call to verify code
    setTimeout(() => {
      setIsLoading(false)
      setStep(3)
    }, 1500)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    setError("")

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    // Simulate API call to reset password
    setTimeout(() => {
      setIsLoading(false)
      setStep(4)
    }, 1500)
  }

  const handleVerificationCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return

    const newVerificationCode = [...verificationCode]
    newVerificationCode[index] = value

    setVerificationCode(newVerificationCode)

    // Auto-focus next input if current input is filled
    if (value && index < 5) {
      const nextInput = document.getElementById(`verification-code-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleVerificationCodeKeyDown = (index, e) => {
    // Move focus to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`verification-code-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const digits = pastedData.replace(/\D/g, "").split("").slice(0, 6)

    if (digits.length) {
      const newVerificationCode = [...verificationCode]
      digits.forEach((digit, index) => {
        if (index < 6) newVerificationCode[index] = digit
      })
      setVerificationCode(newVerificationCode)

      // Focus the next empty input or the last input if all are filled
      const nextEmptyIndex = newVerificationCode.findIndex((digit) => !digit)
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
      const nextInput = document.getElementById(`verification-code-${focusIndex}`)
      if (nextInput) nextInput.focus()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-pale-stone">
      <div className="flex flex-1 items-center justify-center p-8">
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

          <div className="bg-white rounded-lg shadow-md p-8">
            {step === 1 && (
              <>
                <div className="flex items-center mb-6">
                  <Link href="/login" className="mr-4 text-drift-gray hover:text-soft-amber">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <h1 className="text-2xl font-bold text-graphite">Forgot Password</h1>
                </div>

                <p className="text-drift-gray mb-6">
                  Enter your email address and we'll send you a verification code to reset your password.
                </p>

                {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}

                <form onSubmit={handleEmailSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-graphite mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-drift-gray" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:border-soft-amber"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-soft-amber hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber disabled:opacity-70"
                      >
                        {isLoading ? "Sending..." : "Send Verification Code"}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-drift-gray">
                    Remember your password?{" "}
                    <Link href="/login" className="text-soft-amber hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center mb-6">
                  <button onClick={() => setStep(1)} className="mr-4 text-drift-gray hover:text-soft-amber">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-2xl font-bold text-graphite">Verification Code</h1>
                </div>

                <p className="text-drift-gray mb-6">
                  We've sent a verification code to <span className="font-medium">{email}</span>. Please enter the code
                  below.
                </p>

                {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}

                <form onSubmit={handleVerificationSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="verification-code" className="block text-sm font-medium text-graphite mb-1">
                        Verification Code
                      </label>
                      <div className="flex justify-between gap-2" onPaste={handlePaste}>
                        {verificationCode.map((digit, index) => (
                          <input
                            key={index}
                            id={`verification-code-${index}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                            onKeyDown={(e) => handleVerificationCodeKeyDown(index, e)}
                            className="w-full aspect-square text-center text-lg border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:border-soft-amber"
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-soft-amber hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber disabled:opacity-70"
                      >
                        {isLoading ? "Verifying..." : "Verify Code"}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-drift-gray">
                    Didn't receive the code?{" "}
                    <button
                      onClick={() => {
                        setIsLoading(true)
                        setTimeout(() => {
                          setIsLoading(false)
                        }, 1500)
                      }}
                      className="text-soft-amber hover:underline"
                      disabled={isLoading}
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-center mb-6">
                  <button onClick={() => setStep(2)} className="mr-4 text-drift-gray hover:text-soft-amber">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-2xl font-bold text-graphite">Reset Password</h1>
                </div>

                <p className="text-drift-gray mb-6">Create a new password for your account.</p>

                {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}

                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-graphite mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-drift-gray" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-10 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:border-soft-amber"
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-drift-gray" />
                          ) : (
                            <Eye className="h-5 w-5 text-drift-gray" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-drift-gray">Password must be at least 8 characters long.</p>
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-graphite mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-drift-gray" />
                        </div>
                        <input
                          id="confirm-password"
                          name="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-10 pr-10 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:border-soft-amber"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-drift-gray" />
                          ) : (
                            <Eye className="h-5 w-5 text-drift-gray" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-soft-amber hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber disabled:opacity-70"
                      >
                        {isLoading ? "Resetting..." : "Reset Password"}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}

            {step === 4 && (
              <div className="text-center py-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-graphite mb-2">Password Reset Successful</h2>
                <p className="text-drift-gray mb-6">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-soft-amber hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
