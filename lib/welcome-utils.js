import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

// Simple function to generate a random ID
function generateId(length = 20) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Get welcome content
export async function getWelcomeContent() {
  try {
    const welcomeDocRef = doc(db, "system", "welcome_page")
    const welcomeDoc = await getDoc(welcomeDocRef)

    if (welcomeDoc.exists()) {
      return welcomeDoc.data()
    }

    // Return default content if no document exists
    const defaultContent = {
      patient: {
        title: "Welcome to Smart Care",
        description: "Your health is our priority. Access your medical records, appointments, and more.",
        showOnLogin: true,
        imageUrl: "",
      },
      doctor: {
        title: "Welcome, Doctor",
        description: "Manage your patients, appointments, and prescriptions efficiently.",
        showOnLogin: true,
        imageUrl: "",
      },
      admin: {
        title: "Welcome, Admin",
        description: "Manage the Smart Care platform and its users.",
        showOnLogin: true,
        imageUrl: "",
      },
      lastUpdated: serverTimestamp(),
    }

    // Create the default document
    try {
      await setDoc(welcomeDocRef, defaultContent)
    } catch (error) {
      console.error("Error creating default welcome content:", error)
      // Return the default content even if we couldn't save it
      return defaultContent
    }

    return defaultContent
  } catch (error) {
    console.error("Error getting welcome content:", error)
    // Return a fallback content in case of error
    return {
      patient: {
        title: "Welcome to Smart Care",
        description: "Your health is our priority. Access your medical records, appointments, and more.",
        showOnLogin: true,
        imageUrl: "",
      },
      doctor: {
        title: "Welcome, Doctor",
        description: "Manage your patients, appointments, and prescriptions efficiently.",
        showOnLogin: true,
        imageUrl: "",
      },
      admin: {
        title: "Welcome, Admin",
        description: "Manage the Smart Care platform and its users.",
        showOnLogin: true,
        imageUrl: "",
      },
    }
  }
}

// Update welcome content
export async function updateWelcomeContent(content) {
  try {
    // Make sure we're not trying to save File objects
    const sanitizedContent = JSON.parse(JSON.stringify(content))

    const welcomeDocRef = doc(db, "system", "welcome_page")

    await setDoc(
      welcomeDocRef,
      {
        ...sanitizedContent,
        lastUpdated: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true, message: "Welcome content updated successfully" }
  } catch (error) {
    console.error("Error updating welcome content:", error)

    // Check for permission errors
    if (error.code === "permission-denied") {
      return {
        success: false,
        message:
          "Permission denied. You don't have access to update welcome content. Please make sure you're logged in as an admin.",
      }
    }

    return {
      success: false,
      message: "Failed to update welcome content. Please try again later.",
    }
  }
}

// Upload welcome image as base64
export async function uploadWelcomeImage(file, userType) {
  try {
    if (!file) throw new Error("No file provided")

    // Check file size (limit to 1MB to stay within Firestore document size limits)
    if (file.size > 1024 * 1024) {
      throw new Error("File size exceeds 1MB limit. Please choose a smaller image.")
    }

    // Convert file to base64
    const base64String = await fileToBase64(file)

    // Return the base64 string
    return base64String
  } catch (error) {
    console.error("Error uploading welcome image:", error)
    throw error
  }
}

// Delete welcome image
export async function deleteWelcomeImage(imageUrl) {
  // Since we're using base64, we don't need to delete anything from storage
  // Just return true to indicate success
  return true
}

// Get landing page content
export async function getLandingPageContent() {
  try {
    const landingDocRef = doc(db, "system", "landing_page")
    const landingDoc = await getDoc(landingDocRef)

    // Return default content if no document exists
    const defaultContent = {
      branding: {
        name: "Smart Care",
        tagline: "Your Health, One Click Away",
        description:
          "Connecting patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
        logoUrl: "",
        faviconUrl: "/SmartCare.png?v=2",
        contact: {
          address: "123 Healthcare Avenue, Medical District, CA 90210",
          phone: "+1 (555) 123-4567",
          email: "contact@smartcare.com",
          mapUrl: "",
        },
        footer: {
          description:
            "Smart Care connects patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
          note: "All rights reserved.",
          socials: {
            facebook: "",
            twitter: "",
            instagram: "",
          },
        },
      },
      hero: {
        title: "Your Health, One Click Away",
        description:
          "Smart Care connects you with healthcare professionals for virtual consultations, prescription management, and personalized care from the comfort of your home.",
        imageUrl: "/placeholder.svg?height=400&width=600",
      },
      features: [
        {
          icon: "MessageSquare",
          title: "Virtual Consultations",
          description: "Connect with healthcare professionals from the comfort of your home via secure video calls.",
        },
        {
          icon: "Calendar",
          title: "Easy Scheduling",
          description: "Book appointments with just a few clicks and receive instant confirmations.",
        },
        {
          icon: "Clock",
          title: "24/7 Support",
          description: "Access medical advice anytime with our round-the-clock healthcare support.",
        },
        {
          icon: "CheckCircle",
          title: "Secure & Private",
          description: "Your health information is protected with industry-leading security measures.",
        },
      ],
      howItWorks: {
        title: "How It Works",
        description:
          "Getting started with Smart Care is simple. Follow these steps to access quality healthcare from anywhere.",
      },
      testimonials: {
        title: "What Our Users Say",
        description: "Hear from patients and healthcare providers who have experienced the benefits of Smart Care.",
      },
      cta: {
        title: "Ready to Transform Your Healthcare Experience?",
        description: "Join thousands of satisfied users who have made Smart Care their go-to healthcare solution.",
      },
      forDoctors: {
        title: "For Healthcare Providers",
        description:
          "Smart Care offers a streamlined platform for healthcare providers to connect with patients, manage appointments, and provide virtual care.",
        imageUrl: "/placeholder.svg?height=400&width=600",
        benefits: [
          "Expand your practice beyond geographical limitations",
          "Reduce administrative burden with our intuitive platform",
          "Access patient records securely from anywhere",
          "Flexible scheduling to fit your availability",
        ],
      },
      lastUpdated: serverTimestamp(),
    }

    if (landingDoc.exists()) {
      const data = landingDoc.data()
      return {
        ...defaultContent,
        ...data,
        branding: {
          ...defaultContent.branding,
          ...(data.branding || {}),
          contact: {
            ...defaultContent.branding.contact,
            ...(data.branding?.contact || {}),
          },
          footer: {
            ...defaultContent.branding.footer,
            ...(data.branding?.footer || {}),
            socials: {
              ...defaultContent.branding.footer.socials,
              ...(data.branding?.footer?.socials || {}),
            },
          },
        },
      }
    }

    // Create the default document
    try {
      await setDoc(landingDocRef, defaultContent)
    } catch (error) {
      console.error("Error creating default landing page content:", error)
      // Return the default content even if we couldn't save it
      return defaultContent
    }

    return defaultContent
  } catch (error) {
    console.error("Error getting landing page content:", error)
    // Return a fallback content in case of error
    return defaultContent
  }
}

// Update landing page content
export async function updateLandingPageContent(content) {
  try {
    // Make sure we're not trying to save File objects
    const sanitizedContent = JSON.parse(JSON.stringify(content))

    const landingDocRef = doc(db, "system", "landing_page")

    await setDoc(
      landingDocRef,
      {
        ...sanitizedContent,
        lastUpdated: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true, message: "Landing page content updated successfully" }
  } catch (error) {
    console.error("Error updating landing page content:", error)

    // Check for permission errors
    if (error.code === "permission-denied") {
      return {
        success: false,
        message:
          "Permission denied. You don't have access to update landing page content. Please make sure you're logged in as an admin.",
      }
    }

    return {
      success: false,
      message: "Failed to update landing page content. Please try again later.",
    }
  }
}

// Upload landing page image as base64
export async function uploadLandingPageImage(file, section) {
  try {
    if (!file) throw new Error("No file provided")

    // Check file size (limit to 1MB to stay within Firestore document size limits)
    if (file.size > 1024 * 1024) {
      throw new Error("File size exceeds 1MB limit. Please choose a smaller image.")
    }

    // Convert file to base64
    const base64String = await fileToBase64(file)

    // Return the base64 string
    return base64String
  } catch (error) {
    console.error("Error uploading landing page image:", error)
    throw error
  }
}

// Get logo content
export async function getLogoContent() {
  try {
    const logoDocRef = doc(db, "system", "logo_settings")
    const logoDoc = await getDoc(logoDocRef)

    if (logoDoc.exists()) {
      return logoDoc.data()
    }

    // Return default content if no document exists
    const defaultContent = {
      text: "SmartCare",
      color: "#F2B95E", // soft-amber color
      fontSize: "text-xl",
      fontWeight: "font-bold",
      imageUrl: "", // Add imageUrl field
      imageHeight: 32, // px height for logo image
      lastUpdated: serverTimestamp(),
    }

    // Create the default document
    try {
      await setDoc(logoDocRef, defaultContent)
    } catch (error) {
      console.error("Error creating default logo content:", error)
      // Return the default content even if we couldn't save it
      return defaultContent
    }

    return defaultContent
  } catch (error) {
    console.error("Error getting logo content:", error)
    // Return a fallback content in case of error
    return {
      text: "SmartCare",
      color: "#F2B95E", // soft-amber color
      fontSize: "text-xl",
      fontWeight: "font-bold",
      imageUrl: "", // Add imageUrl field
      imageHeight: 32,
    }
  }
}

// Update logo content
export async function updateLogoContent(content) {
  try {
    // Make sure we're not trying to save File objects
    const sanitizedContent = JSON.parse(JSON.stringify(content))

    const logoDocRef = doc(db, "system", "logo_settings")

    await setDoc(
      logoDocRef,
      {
        ...sanitizedContent,
        lastUpdated: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true, message: "Logo updated successfully" }
  } catch (error) {
    console.error("Error updating logo content:", error)

    // Check for permission errors
    if (error.code === "permission-denied") {
      return {
        success: false,
        message:
          "Permission denied. You don't have access to update logo settings. Please make sure you're logged in as an admin.",
      }
    }

    return {
      success: false,
      message: "Failed to update logo settings. Please try again later.",
    }
  }
}

// Add a new function to upload logo image
export async function uploadLogoImage(file) {
  try {
    if (!file) throw new Error("No file provided")

    // Check file size (limit to 500KB to stay within Firestore document size limits)
    if (file.size > 500 * 1024) {
      throw new Error("File size exceeds 500KB limit. Please choose a smaller image.")
    }

    // Convert file to base64
    const base64String = await fileToBase64(file)

    // Return the base64 string
    return base64String
  } catch (error) {
    console.error("Error uploading logo image:", error)
    throw error
  }
}

// Add a function to delete logo image
export async function deleteLogoImage() {
  // Since we're using base64, we don't need to delete anything from storage
  // Just return true to indicate success
  return true
}
