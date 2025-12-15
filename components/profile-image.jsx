"use client"

import { useState, useEffect } from "react"
import { User, UserCog, UserRound } from "lucide-react"
import { getUserProfile } from "@/lib/firebase-utils"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * A reusable profile image component that fetches and displays user profile images
 *
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID to fetch profile data for
 * @param {string} props.src - Optional direct image source URL (overrides userId lookup)
 * @param {string} props.alt - Image alt text
 * @param {string} props.className - Additional CSS classes for the container
 * @param {string} props.imgClassName - Additional CSS classes for the image
 * @param {string} props.role - User role (admin, doctor, patient) for role-specific icons
 * @param {string} props.size - Predefined size (sm, md, lg)
 * @param {string} props.fallback - Fallback text (usually initials) when no image is available
 */
export default function ProfileImage({
  userId,
  src,
  alt = "Profile",
  className = "",
  imgClassName = "h-full w-full object-cover",
  role = "patient",
  size = "md",
  fallback,
}) {
  const [imgError, setImgError] = useState(false)
  const [loading, setLoading] = useState(!!userId)
  const [profileData, setProfileData] = useState(null)

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  // Determine the size class
  const sizeClass = sizeClasses[size] || sizeClasses.md

  // Fetch user profile data if userId is provided with real-time updates
  useEffect(() => {
    if (!userId) return

    // Set up real-time listener for profile updates
    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data()
          setProfileData({
            photoURL: userData.photoURL || null,
            displayName: userData.displayName || userData.name || null,
            role: userData.role || role,
          })
          // Reset imgError when new data is received
          setImgError(false)
          setLoading(false)
        } else {
          // Document doesn't exist, try one-time fetch as fallback
          getUserProfile(userId)
            .then((userData) => {
              if (userData) {
                setProfileData({
                  photoURL: userData.photoURL || null,
                  displayName: userData.displayName || userData.name || null,
                  role: userData.role || role,
                })
              } else {
                setProfileData(null)
              }
            })
            .catch((error) => {
              console.error("Error fetching user profile:", error)
              setProfileData(null)
            })
            .finally(() => {
              setLoading(false)
            })
        }
      },
      (error) => {
        console.error("Error listening to profile updates:", error)
        // Fallback to one-time fetch on error
        getUserProfile(userId)
          .then((userData) => {
            if (userData) {
              setProfileData({
                photoURL: userData.photoURL || null,
                displayName: userData.displayName || userData.name || null,
                role: userData.role || role,
              })
            } else {
              setProfileData(null)
            }
          })
          .catch((err) => {
            console.error("Error fetching user profile:", err)
            setProfileData(null)
          })
          .finally(() => {
            setLoading(false)
          })
      }
    )

    return () => unsubscribe()
  }, [userId, role])

  // Reset imgError when src changes
  useEffect(() => {
    if (src) {
      setImgError(false)
    }
  }, [src])

  // Handle image load error
  const handleError = () => {
    console.log(`Profile image failed to load: ${src || (profileData && profileData.photoURL)}`)
    setImgError(true)
  }

  // Get the appropriate icon based on role
  const getRoleIcon = () => {
    const userRole = profileData?.role || role

    switch (userRole) {
      case "admin":
        return <UserCog className="h-1/2 w-1/2 text-soft-amber" />
      case "doctor":
        return <UserRound className="h-1/2 w-1/2 text-soft-amber" />
      default:
        return <User className="h-1/2 w-1/2 text-drift-gray" />
    }
  }

  // Get initials from name or use provided fallback
  const getInitials = () => {
    if (fallback) return fallback

    if (profileData?.displayName) {
      const nameParts = profileData.displayName.split(" ")
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return profileData.displayName[0].toUpperCase()
    }

    return role === "doctor" ? "D" : role === "admin" ? "A" : "P"
  }

  // Determine the image source
  const imageSrc = src || (profileData && profileData.photoURL)

  return (
    <div
      className={`rounded-full bg-pale-stone overflow-hidden flex items-center justify-center ${sizeClass} ${className}`}
    >
      {/* Show image if available (for all roles including admin) */}
      {imageSrc && !imgError ? (
        // Image available - show for all roles
        <img
          src={imageSrc}
          alt={alt || profileData?.displayName || "Profile"}
          className={imgClassName}
          onError={handleError}
          key={imageSrc} // Force re-render when image changes
        />
      ) : loading ? (
        // Loading state while fetching profile data if src is not available
        <div className="animate-pulse bg-earth-beige h-full w-full"></div>
      ) : fallback || (profileData && profileData.displayName) ? (
        // Show initials if no image and fallback/display name available
        <div className="flex items-center justify-center h-full w-full bg-soft-amber/20 text-soft-amber font-medium">
          {getInitials()}
        </div>
      ) : (
        // Fallback to role icon when no image, fallback, or display name
        getRoleIcon()
      )}
    </div>
  )
}
