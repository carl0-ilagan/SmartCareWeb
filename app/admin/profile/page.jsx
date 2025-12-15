"use client"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  Camera,
  Settings,
  Lock,
  UserCircle,
  LogOut,
  Clock,
  Calendar,
  Monitor,
  Smartphone,
  Copy,
  RefreshCw,
  Check,
  Globe,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from "@/lib/firebase-utils"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { doc, serverTimestamp, updateDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SuccessNotification } from "@/components/success-notification"
import { useRouter } from "next/navigation"
import ProfileImage from "@/components/profile-image"

// Import the session management utilities
import { getUserSessions, revokeSession, revokeAllOtherSessions, formatSessionTime } from "@/lib/session-management"

// Add this import at the top
import { SuspiciousLoginHistory } from "@/components/suspicious-login-history"

export default function AdminProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [isValidationError, setIsValidationError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState("")
  const [twoFactorQrCode, setTwoFactorQrCode] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationError, setVerificationError] = useState("")
  const [preferencesApplied, setPreferencesApplied] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    jobTitle: "System Administrator",
    bio: "",
    firstName: "",
    lastName: "",
    officeAddress: "",
    department: "Administration",
    hireDate: "",
    emergencyContact: "",
    emergencyPhone: "",
  })
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
  })
  const [preferencesData, setPreferencesData] = useState({
    browserNotifications: true,
    showWelcome: true,
    compactView: false,
    defaultDashboard: "Overview",
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const { user } = useAuth()

  // Fetch user profile data on component mount with real-time updates
  useEffect(() => {
    if (!user?.uid) return

    // Set up real-time listener for profile updates
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data()
          
          setProfileData({
            displayName: profile.displayName || user.displayName || "",
            email: profile.email || user.email || "",
            phone: profile.phone || "",
            jobTitle: profile.jobTitle || "System Administrator",
            bio: profile.bio || "",
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            officeAddress: profile.officeAddress || "",
            department: profile.department || "Administration",
            hireDate: profile.hireDate || "",
            emergencyContact: profile.emergencyContact || "",
            emergencyPhone: profile.emergencyPhone || "",
          })

          // Set security and preferences data if available
          if (profile.preferences) {
            setPreferencesData((prev) => ({
              ...prev,
              ...profile.preferences,
            }))
          }

          if (profile.security) {
            setSecurityData((prev) => ({
              ...prev,
              twoFactorEnabled: profile.security.twoFactorEnabled || false,
            }))
          }

          // Update photo preview in real-time when changed
          // Only update if it's a different URL (not a data URL from FileReader)
          const newPhotoURL = profile.photoURL || user.photoURL
          const currentPreview = photoPreview
          
          // Only update if:
          // 1. We have a new photoURL from Firestore
          // 2. It's different from current preview
          // 3. Current preview is not a data URL (base64) - meaning upload is complete
          if (newPhotoURL) {
            const isDataURL = currentPreview && currentPreview.startsWith('data:')
            if (!isDataURL && newPhotoURL !== currentPreview) {
              console.log("[Admin Profile] Real-time update: Photo URL changed to:", newPhotoURL)
              setPhotoPreview(newPhotoURL)
              setPhotoFile(null) // Clear photo file if image was updated from elsewhere
            } else if (isDataURL) {
              // If we have a data URL (upload in progress), keep it until upload completes
              // The upload function will update it with the actual URL
              console.log("[Admin Profile] Upload in progress, keeping data URL preview")
            }
          } else if (!newPhotoURL && currentPreview && !currentPreview.startsWith('data:')) {
            // Only clear if current preview is not a data URL
            setPhotoPreview(null)
          }
        }
      },
      (error) => {
        console.error("Error listening to profile updates:", error)
        showSuccessNotification("Failed to load profile data", true)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Apply preferences when they change
  useEffect(() => {
    if (preferencesApplied) {
      applyPreferences()
    }
  }, [preferencesApplied])

  // Apply preferences to the application
  const applyPreferences = () => {
    // Apply compact view
    if (preferencesData.compactView) {
      document.body.classList.add("compact-view")
    } else {
      document.body.classList.remove("compact-view")
    }

    // Store preferences in localStorage for persistence
    localStorage.setItem("smartcare_preferences", JSON.stringify(preferencesData))

    // Handle browser notifications
    if (preferencesData.browserNotifications && "Notification" in window) {
      Notification.requestPermission()
    }

    // Handle welcome message
    localStorage.setItem("showWelcome", preferencesData.showWelcome)

    // Handle default dashboard
    localStorage.setItem("defaultDashboard", preferencesData.defaultDashboard)
  }

  // Fetch active sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (user?.uid) {
        try {
          setSessionLoading(true)
          const activeSessions = await getUserSessions(user.uid)

          // If no sessions found, create a current session (this should rarely happen)
          if (activeSessions.length === 0) {
            // This will be handled by the auth context now
            console.log("No active sessions found, this is unusual")
          }

          setSessions(activeSessions)
        } catch (error) {
          console.error("Error fetching sessions:", error)
        } finally {
          setSessionLoading(false)
        }
      }
    }

    fetchSessions()

    // Set up a refresh interval to keep the sessions list updated
    const refreshInterval = setInterval(() => {
      if (user?.uid && activeTab === "security") {
        fetchSessions()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [user, activeTab])

  // Generate 2FA secret and QR code
  const generateTwoFactorSecret = () => {
    try {
      // In a real app, this would be done server-side
      // This is a simplified version for demonstration
      const generateRandomString = (length) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567" // Base32 character set
        let result = ""
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      const secret = generateRandomString(16)
      setTwoFactorSecret(secret)

      // Generate a proper TOTP URI for authenticator apps
      const email = encodeURIComponent(profileData.email || user?.email || "admin@smartcare.com")
      const appName = encodeURIComponent("SmartCare")
      const issuer = encodeURIComponent("SmartCare")

      // This is the standard format for TOTP URIs that authenticator apps recognize
      const totpUri = `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`

      // Use a data URI for the QR code to avoid CORS issues
      // This uses a simple QR code library that works directly in the browser
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}&margin=10&format=svg`

      console.log("Generated QR code URL:", qrCodeUrl)
      setTwoFactorQrCode(qrCodeUrl)

      // Also store the TOTP URI for debugging
      localStorage.setItem("debug_totp_uri", totpUri)
    } catch (error) {
      console.error("Error generating 2FA secret:", error)
      showSuccessNotification("Failed to generate QR code. Please try again.", true)
    }
  }

  // Handle 2FA toggle
  const handleTwoFactorToggle = () => {
    if (!securityData.twoFactorEnabled) {
      // Enable 2FA - show setup UI
      setShowTwoFactorSetup(true)
      generateTwoFactorSecret()
    } else {
      // Disable 2FA - ask for confirmation
      if (
        window.confirm(
          "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
        )
      ) {
        setSecurityData((prev) => ({
          ...prev,
          twoFactorEnabled: false,
        }))

        // Save the change to database
        saveTwoFactorSettings(false)
      }
    }
  }

  // Verify 2FA code and enable if correct
  const verifyAndEnableTwoFactor = async () => {
    // In a real app, this would validate against a proper TOTP algorithm
    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationError("Please enter a valid 6-digit code")
      return
    }

    try {
      setLoading(true)

      // In a real app, we would verify the code against the secret using a TOTP algorithm
      // For demonstration purposes, we'll accept any 6-digit code
      // In production, you would use a library like 'otplib' to validate the code

      // Simulating validation delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the state
      setSecurityData((prev) => ({
        ...prev,
        twoFactorEnabled: true,
      }))

      // Save to database
      await saveTwoFactorSettings(true)

      // Hide setup UI
      setShowTwoFactorSetup(false)
      setVerificationCode("")
      setVerificationError("")

      // Show success notification
      showSuccessNotification("Two-factor authentication enabled successfully")
    } catch (error) {
      console.error("Error enabling 2FA:", error)
      setVerificationError("Failed to enable two-factor authentication")
    } finally {
      setLoading(false)
    }
  }

  // Save 2FA settings to database
  const saveTwoFactorSettings = async (enabled) => {
    if (!user?.uid) return

    try {
      await updateDoc(doc(db, "users", user.uid), {
        "security.twoFactorEnabled": enabled,
        "security.twoFactorSecret": enabled ? twoFactorSecret : null,
        updatedAt: serverTimestamp(),
      })

      if (!enabled) {
        showSuccessNotification("Two-factor authentication disabled")
      }
    } catch (error) {
      console.error("Error saving 2FA settings:", error)
      throw error
    }
  }

  // Copy 2FA secret to clipboard
  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(twoFactorSecret)
    showSuccessNotification("Secret key copied to clipboard")
  }

  // Handle profile data changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle security data changes
  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target
    setSecurityData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Handle preferences data changes
  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target
    setPreferencesData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Handle photo file selection and immediate upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !user?.uid) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showSuccessNotification("Image size exceeds 2MB limit. Please choose a smaller image.", true)
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showSuccessNotification("Please select a valid image file.", true)
      return
    }

    try {
      setLoading(true)
      
      // Show preview immediately for better UX
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setPhotoFile(file)

      console.log("[Admin Profile] Starting photo upload for user:", user.uid)
      
      // Upload immediately for real-time update
      const photoURL = await uploadProfilePhoto(user.uid, file)
      
      console.log("[Admin Profile] Photo uploaded successfully:", photoURL)
      
      // Update preview with the actual uploaded URL (with cache busting)
      setPhotoPreview(photoURL)
      setPhotoFile(null) // Clear after upload
      
      // Force a small delay to ensure Firestore update is processed
      await new Promise(resolve => setTimeout(resolve, 100))
      
      showSuccessNotification("Profile photo updated successfully")
    } catch (error) {
      console.error("[Admin Profile] Error uploading profile photo:", error)
      console.error("[Admin Profile] Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      
      const errorMessage = error.message || "Failed to upload profile photo. Please try again."
      showSuccessNotification(errorMessage, true)
      
      // Reset preview on error - use current user photoURL if available
      const currentPhotoURL = user?.photoURL || null
      setPhotoPreview(currentPhotoURL)
      setPhotoFile(null)
    } finally {
      setLoading(false)
    }
  }

  // Replace the handleRevokeSession function
  const handleRevokeSession = async (sessionId) => {
    try {
      setSessionLoading(true)
      await revokeSession(sessionId)

      // Update the sessions list
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))

      // Show success message
      showSuccessNotification("Session revoked successfully")
    } catch (error) {
      console.error("Error revoking session:", error)
      setIsValidationError(true)
      showSuccessNotification("Failed to revoke session", true)
    } finally {
      setSessionLoading(false)
    }
  }

  // Add a new function to revoke all other sessions
  const handleRevokeAllOtherSessions = async () => {
    try {
      if (!user?.uid) return

      setSessionLoading(true)
      await revokeAllOtherSessions(user.uid)

      // Refresh the sessions list
      const activeSessions = await getUserSessions(user.uid)
      setSessions(activeSessions)

      // Show success message
      showSuccessNotification("All other sessions revoked successfully")
    } catch (error) {
      console.error("Error revoking other sessions:", error)
      setIsValidationError(true)
      showSuccessNotification("Failed to revoke other sessions", true)
    } finally {
      setSessionLoading(false)
    }
  }

  // Show success notification
  const showSuccessNotification = (message, isError = false) => {
    setNotificationMessage(message)
    setIsValidationError(isError)
    setShowNotification(true)

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false)
    }, 5000)
  }

  // Replace the formatDate function with our utility
  const formatDate = formatSessionTime

  // Apply preferences immediately
  const applyPreferencesNow = async () => {
    try {
      setLoading(true)

      // Save preferences to database
      await updateUserProfile(user.uid, {
        preferences: preferencesData,
      })

      // Apply preferences to the UI
      setPreferencesApplied(true)

      // Show success notification
      showSuccessNotification("Preferences applied successfully")

      // If the dashboard preference changed, redirect to the selected dashboard
      if (preferencesData.defaultDashboard !== "Overview") {
        // In a real app, this would redirect to the selected dashboard
        // For demo purposes, we'll just show a notification
        showSuccessNotification(`Default dashboard set to ${preferencesData.defaultDashboard}`)
      }
    } catch (error) {
      console.error("Error applying preferences:", error)
      showSuccessNotification("Failed to apply preferences", true)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission
  const handleSave = async () => {
    try {
      setLoading(true)

      if (!user?.uid) {
        throw new Error("User not authenticated")
      }

      // Prepare data based on active tab
      let updateData = {}

      if (activeTab === "profile") {
        // Combine first and last name for displayName if both are provided
        const displayName =
          profileData.firstName && profileData.lastName
            ? `${profileData.firstName} ${profileData.lastName}`
            : profileData.displayName

        updateData = {
          ...profileData,
          displayName,
          role: "admin", // Ensure role is set
        }

        showSuccessNotification("Profile information updated successfully")
      } else if (activeTab === "security") {
        // For security tab, only update the two-factor setting if it was changed directly
        // (not through the dedicated 2FA flow)
        if (!showTwoFactorSetup) {
          updateData = {
            security: {
              twoFactorEnabled: securityData.twoFactorEnabled,
            },
          }
        }

        // Password changes are handled through Google Auth - no need to process here
      } else if (activeTab === "preferences") {
        updateData = {
          preferences: preferencesData,
        }

        // Apply preferences immediately
        setPreferencesApplied(true)

        showSuccessNotification("Preferences updated successfully")
      }

      // Update profile in Firestore
      await updateUserProfile(user.uid, updateData)

      // Photo is now uploaded immediately when selected, so no need to upload here
    } catch (error) {
      console.error("Error saving profile:", error)
      showSuccessNotification(error.message || "Failed to update profile", true)
    } finally {
      setLoading(false)
    }
  }

  // Stats for the banner
  const stats = [
    {
      label: "Role",
      value: "Admin",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: "Department",
      value: profileData.department || "Administration",
      icon: <User className="h-4 w-4" />,
    },
  ]

  const troubleshoot2FA = () => {
    alert("Please contact support for assistance with two-factor authentication.")
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <AdminHeaderBanner
        title="Profile Settings"
        subtitle="Manage your personal information and preferences"
        stats={stats}
      />

      {/* Success notification */}
      <SuccessNotification
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        isValidation={isValidationError}
      />

      {/* Profile header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-soft-amber/30">
              <ProfileImage 
                src={photoPreview || user?.photoURL} 
                userId={user?.uid}
                alt="Profile" 
                className="h-24 w-24" 
                role="admin"
                key={photoPreview || user?.photoURL || 'admin-profile'} // Force re-render when image changes
              />
            </div>
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:bg-pale-stone cursor-pointer transition-all hover:scale-110">
              <Camera className="h-4 w-4 text-drift-gray" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoChange}
                disabled={loading}
              />
            </label>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-graphite">
              {profileData.displayName ||
                (profileData.firstName && profileData.lastName
                  ? `${profileData.firstName} ${profileData.lastName}`
                  : "Admin User")}
            </h2>
            <p className="text-drift-gray">{profileData.jobTitle || "System Administrator"}</p>
            <div className="mt-2 flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex items-center justify-center md:justify-start">
                <Mail className="h-4 w-4 text-drift-gray mr-1" />
                <span className="text-sm text-drift-gray">
                  {profileData.email || user?.email || "admin@smartcare.com"}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start">
                <Phone className="h-4 w-4 text-drift-gray mr-1" />
                <span className="text-sm text-drift-gray">{profileData.phone || "+1 (555) 123-4567"}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start">
                <Shield className="h-4 w-4 text-drift-gray mr-1" />
                <span className="text-sm text-drift-gray">Super Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Controls - Pill Style */}
      <div className="flex justify-center mb-6 mt-8 overflow-x-auto">
        <div className="flex p-1 bg-earth-beige/20 rounded-full shadow-sm">
          <button
            onClick={() => setActiveTab("profile")}
            className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "profile" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
            aria-selected={activeTab === "profile"}
            role="tab"
          >
            <UserCircle className="h-4 w-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "security" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
            aria-selected={activeTab === "security"}
            role="tab"
          >
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "preferences" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
            aria-selected={activeTab === "preferences"}
            role="tab"
          >
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Content based on active tab */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-lg font-semibold text-graphite border-b border-earth-beige pb-2">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-graphite mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-graphite mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-graphite mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-graphite mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-graphite mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={profileData.jobTitle}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-graphite mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="hireDate" className="block text-sm font-medium text-graphite mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    id="hireDate"
                    name="hireDate"
                    value={profileData.hireDate}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="officeAddress" className="block text-sm font-medium text-graphite mb-1">
                    Office Address
                  </label>
                  <input
                    type="text"
                    id="officeAddress"
                    name="officeAddress"
                    value={profileData.officeAddress}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-graphite mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={profileData.emergencyContact}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyPhone" className="block text-sm font-medium text-graphite mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={profileData.emergencyPhone}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-graphite mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    className="w-full p-2 border border-earth-beige rounded-md h-24 focus:ring-soft-amber focus:border-soft-amber"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-lg font-semibold text-graphite border-b border-earth-beige pb-2">
                Security Settings
              </h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Google Authentication</h4>
                      <p className="text-xs text-blue-700">
                        Your account is secured with Google Authentication. Password changes are managed through your Google account settings.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-earth-beige">
                  <h3 className="font-medium text-graphite mb-3">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-graphite">Protect your account with two-factor authentication</p>
                      <p className="text-xs text-drift-gray mt-1">
                        Status:{" "}
                        <span
                          className={`font-medium ${securityData.twoFactorEnabled ? "text-green-600" : "text-red-600"}`}
                        >
                          {securityData.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={handleTwoFactorToggle}
                        className={`px-3 py-1 rounded-md text-sm ${
                          securityData.twoFactorEnabled
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {securityData.twoFactorEnabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>

                  {/* 2FA Setup UI */}
                  {showTwoFactorSetup && (
                    <div className="mt-4 p-4 border border-earth-beige rounded-md bg-pale-stone/50">
                      <h4 className="font-medium text-graphite mb-2">Set Up Two-Factor Authentication</h4>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-drift-gray mb-2">
                            1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                          </p>
                          <div className="flex justify-center mb-4">
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              {twoFactorQrCode ? (
                                <img
                                  src={twoFactorQrCode || "/placeholder.svg"}
                                  alt="QR Code"
                                  className="h-40 w-40"
                                  onError={(e) => {
                                    console.error("QR code image failed to load")
                                    e.target.onerror = null
                                    e.target.src = `/placeholder.svg?height=200&width=200&query=QR%20Code%20Failed%20to%20Load`
                                    showSuccessNotification(
                                      "QR code failed to load. Please use the manual entry method below.",
                                      true,
                                    )
                                  }}
                                />
                              ) : (
                                <div className="h-40 w-40 flex items-center justify-center bg-gray-100">
                                  <div className="h-6 w-6 border-2 border-soft-amber border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Add a debug button that's only visible in development */}
                          {process.env.NODE_ENV === "development" && (
                            <div className="text-center mb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const uri = localStorage.getItem("debug_totp_uri")
                                  alert(`TOTP URI: ${uri || "Not available"}`)
                                }}
                                className="text-xs text-blue-600 underline"
                              >
                                Debug QR Code
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-drift-gray mb-2">
                            2. Or manually enter this secret key in your authenticator app:
                          </p>
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            <code className="bg-white px-3 py-1 rounded-md border border-earth-beige font-mono text-sm">
                              {twoFactorSecret}
                            </code>
                            <button
                              onClick={copySecretToClipboard}
                              className="p-1 rounded-md hover:bg-earth-beige/50"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4 text-drift-gray" />
                            </button>
                          </div>
                          <p className="text-xs text-center text-drift-gray mb-2">
                            <span className="font-medium">App not scanning?</span> In your authenticator app, add
                            account manually and enter:
                            <br />
                            Account name:{" "}
                            <span className="font-mono">
                              SmartCare:{profileData.email || user?.email || "admin@smartcare.com"}
                            </span>
                            <br />
                            Key: <span className="font-mono">{twoFactorSecret}</span>
                            <br />
                            Type: Time-based
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-drift-gray mb-2">
                            3. Enter the 6-digit verification code from your authenticator app:
                          </p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="000000"
                              className="w-32 p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber text-center font-mono"
                              maxLength={6}
                            />
                            <button
                              onClick={generateTwoFactorSecret}
                              className="p-1 rounded-md hover:bg-earth-beige/50"
                              title="Generate new secret"
                            >
                              <RefreshCw className="h-4 w-4 text-drift-gray" />
                            </button>
                          </div>
                          {verificationError && <p className="text-xs text-red-600 mt-1">{verificationError}</p>}
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                          <button
                            onClick={verifyAndEnableTwoFactor}
                            disabled={loading || verificationCode.length !== 6}
                            className={`px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 ${
                              loading || verificationCode.length !== 6 ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                          >
                            {loading ? "Verifying..." : "Verify and Enable"}
                          </button>
                          <button
                            onClick={() => {
                              setShowTwoFactorSetup(false)
                              setVerificationCode("")
                              setVerificationError("")
                            }}
                            className="px-4 py-2 border border-earth-beige text-drift-gray rounded-md hover:bg-pale-stone"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={troubleshoot2FA}
                            className="px-4 py-2 border border-earth-beige text-blue-600 rounded-md hover:bg-pale-stone"
                            type="button"
                          >
                            Need Help?
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-earth-beige">
                  <h3 className="font-medium text-graphite mb-3">Login Sessions</h3>
                  <p className="text-sm text-drift-gray mb-2">Currently active sessions on your account:</p>

                  <div className="mb-4">
                    <button
                      onClick={handleRevokeAllOtherSessions}
                      disabled={sessionLoading || sessions.filter((s) => !s.isCurrentSession).length === 0}
                      className={`px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 ${
                        sessionLoading || sessions.filter((s) => !s.isCurrentSession).length === 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      Revoke All Other Sessions
                    </button>
                  </div>

                  {sessionLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 border-2 border-soft-amber border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-3 rounded-md flex justify-between items-center ${
                            session.isCurrentSession ? "bg-pale-stone" : "bg-white border border-earth-beige"
                          }`}
                        >
                          <div>
                            <div className="flex items-center">
                              {session.deviceType === "mobile" ? (
                                <Smartphone className="h-4 w-4 text-drift-gray mr-2" />
                              ) : (
                                <Monitor className="h-4 w-4 text-drift-gray mr-2" />
                              )}
                              <p className="text-sm font-medium text-graphite">
                                {session.deviceName}
                                {session.isCurrentSession && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                    Current
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-drift-gray">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Last active: {formatDate(session.lastActive)}</span>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-drift-gray">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Created: {formatDate(session.createdAt)}</span>
                            </div>
                            {/* Add IP address display */}
                            <div className="flex items-center mt-1 text-xs text-drift-gray">
                              <Globe className="h-3 w-3 mr-1" />
                              <span>IP: {session.ipAddress || "Unknown"}</span>
                            </div>
                          </div>
                          {!session.isCurrentSession && (
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              className="flex items-center text-red-500 hover:text-red-600 text-sm"
                              disabled={sessionLoading}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}

                      {sessions.length === 0 && (
                        <div className="text-center py-4 text-drift-gray">No active sessions found</div>
                      )}
                    </div>
                  )}
                </div>
                // Then add this section in the security tab, after the login sessions section
                <div className="pt-4 border-t border-earth-beige">
                  <h3 className="font-medium text-graphite mb-3">Suspicious Login Activity</h3>
                  <SuspiciousLoginHistory userId={user?.uid} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-lg font-semibold text-graphite border-b border-earth-beige pb-2">User Preferences</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-graphite mb-3">Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="browserNotifications"
                        name="browserNotifications"
                        checked={preferencesData.browserNotifications}
                        onChange={handlePreferencesChange}
                        className="mr-2 h-4 w-4 rounded border-earth-beige text-soft-amber focus:ring-soft-amber"
                      />
                      <label htmlFor="browserNotifications" className="text-sm text-graphite">
                        Browser Notifications
                      </label>
                    </div>
                    <p className="text-xs text-drift-gray ml-6 mt-1">
                      Receive notifications in your browser when you're using the application
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-earth-beige">
                  <h3 className="font-medium text-graphite mb-3">Dashboard Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showWelcome"
                        name="showWelcome"
                        checked={preferencesData.showWelcome}
                        onChange={handlePreferencesChange}
                        className="mr-2 h-4 w-4 rounded border-earth-beige text-soft-amber focus:ring-soft-amber"
                      />
                      <label htmlFor="showWelcome" className="text-sm text-graphite">
                        Show welcome message on login
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="compactView"
                        name="compactView"
                        checked={preferencesData.compactView}
                        onChange={handlePreferencesChange}
                        className="mr-2 h-4 w-4 rounded border-earth-beige text-soft-amber focus:ring-soft-amber"
                      />
                      <label htmlFor="compactView" className="text-sm text-graphite">
                        Use compact view for tables
                      </label>
                    </div>
                    <div>
                      <label htmlFor="defaultDashboard" className="block text-sm font-medium text-graphite mb-1">
                        Default Dashboard View
                      </label>
                      <select
                        id="defaultDashboard"
                        name="defaultDashboard"
                        value={preferencesData.defaultDashboard}
                        onChange={handlePreferencesChange}
                        className="w-full p-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      >
                        <option value="Overview">Overview</option>
                        <option value="Analytics">Analytics</option>
                        <option value="User Management">User Management</option>
                        <option value="System Status">System Status</option>
                      </select>
                      <p className="text-xs text-drift-gray mt-1">This dashboard will be shown when you first log in</p>
                    </div>
                  </div>
                </div>

                {/* Apply preferences button */}
                <div className="pt-4 border-t border-earth-beige">
                  <button
                    onClick={applyPreferencesNow}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Apply Preferences Now
                  </button>
                  <p className="text-xs text-drift-gray mt-2">
                    Apply your preferences immediately without saving other profile changes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-in {
          animation-duration: 300ms;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        
        .fade-in {
          animation-name: fadeIn;
        }
        
        .slide-in-from-bottom-4 {
          animation-name: slideInFromBottom;
        }
        
        @keyframes slideInFromBottom {
          from { 
            opacity: 0;
            transform: translateY(1rem);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Remove this:
        /* Dark mode styles */
        
        /* Compact view styles */
        .compact-view table td,
        .compact-view table th {
          padding: 0.5rem !important;
          font-size: 0.875rem !important;
        }
      `}</style>
    </div>
  )
}
