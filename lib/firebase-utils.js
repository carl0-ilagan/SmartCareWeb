import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { updateProfile } from "firebase/auth"
import { db, storage, auth } from "./firebase"

// Add imports for logging utilities at the top of the file
import { logPatientActivity } from "./patient-utils"
import { logDoctorActivity } from "./doctor-utils"
import { logAdminActivity } from "./activity-logs"

// Get user profile data from Firestore
export async function getUserProfile(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()

      // If there's no photoURL in Firestore but the user is authenticated,
      // try to get it from the auth object
      if (!userData.photoURL && auth.currentUser && auth.currentUser.uid === userId) {
        userData.photoURL = auth.currentUser.photoURL
      }

      return userData
    }
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }
}

// Update user profile in Firestore
export async function updateUserProfile(userId, profileData) {
  try {
    // Get the current user data to determine role
    const userDoc = await getDoc(doc(db, "users", userId))
    const userData = userDoc.exists() ? userDoc.data() : { role: "patient" }

    // Update the user document
    await updateDoc(doc(db, "users", userId), {
      ...profileData,
      updatedAt: serverTimestamp(),
    })

    // If display name is being updated, also update in Auth
    if (profileData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
      })
    }

    // Log the profile update based on user role
    if (userData.role === "patient") {
      await logPatientActivity("Profile Updated", `Patient updated their profile information`, {
        id: userId,
        email: userData.email || auth.currentUser?.email,
      })
    } else if (userData.role === "doctor") {
      await logDoctorActivity("Profile Updated", `Doctor updated their profile information`, {
        id: userId,
        email: userData.email || auth.currentUser?.email,
      })
    }

    return true
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Convert file to base64 (helper function)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Upload profile photo and update user profile
export async function uploadProfilePhoto(userId, file) {
  try {
    // Get the current user data to determine role
    const userDoc = await getDoc(doc(db, "users", userId))
    const userData = userDoc.exists() ? userDoc.data() : { role: "patient" }

    let photoURL

    // For admin, use base64 to avoid CORS issues with Firebase Storage
    if (userData.role === "admin") {
      // Check file size (limit to 1MB to stay within Firestore document size limits)
      if (file.size > 1024 * 1024) {
        throw new Error("File size exceeds 1MB limit. Please choose a smaller image.")
      }

      // Convert file to base64
      photoURL = await fileToBase64(file)
      
      console.log("[uploadProfilePhoto] Admin photo converted to base64")
    } else {
      // For patient and doctor, use Firebase Storage
      // Create a reference to the file location
      const storageRef = ref(storage, `profile_photos/${userId}`)

      // Upload the file
      await uploadBytes(storageRef, file)

      // Get the download URL with cache busting parameter
      photoURL = (await getDownloadURL(storageRef)) + `?t=${Date.now()}`
    }

    // Update the user document with the photo URL (base64 for admin, URL for others)
    await updateDoc(doc(db, "users", userId), {
      photoURL,
      updatedAt: serverTimestamp(),
    })

    // Update the auth profile (only for non-base64 URLs)
    if (auth.currentUser && !photoURL.startsWith('data:')) {
      await updateProfile(auth.currentUser, { photoURL })
    }

    // Log the profile photo update based on user role
    if (userData.role === "patient") {
      await logPatientActivity("Profile Photo Updated", `Patient updated their profile photo`, {
        id: userId,
        email: userData.email || auth.currentUser?.email,
      })
    } else if (userData.role === "doctor") {
      await logDoctorActivity("Profile Photo Updated", `Doctor updated their profile photo`, {
        id: userId,
        email: userData.email || auth.currentUser?.email,
      })
    } else if (userData.role === "admin") {
      await logAdminActivity("Profile Photo Updated", `Admin updated their profile photo`, {
        id: userId,
        email: userData.email || auth.currentUser?.email,
      })
    }

    console.log(`[uploadProfilePhoto] Successfully uploaded profile photo for ${userData.role}`)
    return photoURL
  } catch (error) {
    console.error("Error uploading profile photo:", error)
    throw error
  }
}

// Update last login timestamp
export async function updateLastLogin(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      lastLogin: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating last login:", error)
    // Don't throw - this is a non-critical operation
  }
}

// Initialize or update patient profile data
export async function initializePatientProfile(userId, data = {}) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Update existing profile with any new data
      return await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Create new profile
      return await setDoc(userRef, {
        uid: userId,
        role: "patient",
        displayName: data.displayName || "",
        email: data.email || "",
        phone: data.phone || "",
        dob: data.dob || "",
        gender: data.gender || "",
        address: data.address || "",
        emergencyContact: data.emergencyContact || "",
        emergencyPhone: data.emergencyPhone || "",
        bloodType: data.bloodType || "",
        allergies: data.allergies || "",
        medicalConditions: data.medicalConditions || "",
        currentMedications: data.currentMedications || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error("Error initializing patient profile:", error)
    throw error
  }
}

// Initialize or update doctor profile data
export async function initializeDoctorProfile(userId, data = {}) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Update existing profile with any new data
      return await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Create new profile
      return await setDoc(userRef, {
        uid: userId,
        role: "doctor",
        displayName: data.displayName || "",
        email: data.email || "",
        phone: data.phone || "",
        specialty: data.specialty || "",
        licenseNumber: data.licenseNumber || "",
        education: data.education || "",
        experience: data.experience || "",
        languages: data.languages || "",
        bio: data.bio || "",
        officeAddress: data.officeAddress || "",
        officeHours: data.officeHours || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error("Error initializing doctor profile:", error)
    throw error
  }
}

// Get user by ID
export async function getUserById(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

// Get user counts by role
export async function getUserCountsByRole() {
  try {
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(usersRef)

    const roleCounts = {
      "super admin": 0,
      admin: 0,
      doctor: 0,
      patient: 0,
    }

    snapshot.forEach((doc) => {
      const userData = doc.data()
      const role = userData.role?.toLowerCase() || "patient"
      roleCounts[role] = (roleCounts[role] || 0) + 1
    })

    return roleCounts
  } catch (error) {
    console.error("Error getting user counts by role:", error)
    throw error
  }
}
