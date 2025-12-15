"use server"

import { cookies } from "next/headers"
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import {
  getUserAppointments as fetchUserAppointments,
  getDoctorAppointments as fetchDoctorAppointments,
  getDoctorUnavailableDates,
  updateDoctorUnavailableDates,
  getBookedTimeSlots,
} from "@/lib/appointment-utils"
import { getUserProfile } from "@/lib/firebase-utils"
import { revalidatePath } from "next/cache"

// Helper function to verify authentication on the server
async function getAuthenticatedUser() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("session")?.value

  if (!sessionCookie) {
    return null
  }

  try {
    // Verify the session cookie and get the user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    return { uid: decodedClaims.uid, email: decodedClaims.email }
  } catch (error) {
    console.error("Error verifying session cookie:", error)
    return null
  }
}

// Get appointments for the current user
export async function getUserAppointments() {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return { success: false, error: "You must be logged in to view appointments" }
    }

    const appointments = await fetchUserAppointments(user.uid)
    return { success: true, appointments }
  } catch (error) {
    console.error("Error in getUserAppointments:", error)
    return { success: false, error: error.message }
  }
}

// Get appointments for a doctor
export async function getDoctorAppointments() {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return { success: false, error: "You must be logged in to view appointments" }
    }

    const appointments = await fetchDoctorAppointments(user.uid)
    return { success: true, appointments }
  } catch (error) {
    console.error("Error in getDoctorAppointments:", error)
    return { success: false, error: error.message }
  }
}

async function createAppointment(appointmentData) {
  try {
    const db = getFirestore()
    const appointmentsRef = collection(db, "appointments")
    const docRef = await addDoc(appointmentsRef, {
      ...appointmentData,
      createdAt: new Date().toISOString(),
    })

    return { success: true, appointmentId: docRef.id }
  } catch (error) {
    console.error("Error in createAppointment:", error)
    return { success: false, error: error.message }
  }
}

async function cancelAppointment(appointmentId, reason) {
  try {
    const db = getFirestore()
    const appointmentRef = doc(db, "appointments", appointmentId)

    // Get the current appointment data to check permissions
    const appointmentSnap = await getDoc(appointmentRef)

    if (!appointmentSnap.exists()) {
      return { success: false, error: "Appointment not found" }
    }

    const appointmentData = appointmentSnap.data()

    // Check if the user is authorized to cancel this appointment
    // Removed user authentication check as it's handled in the action

    await updateDoc(appointmentRef, {
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error in cancelAppointment:", error)
    return { success: false, error: error.message }
  }
}

async function approveAppointment(appointmentId, doctorNote) {
  try {
    const db = getFirestore()
    const appointmentRef = doc(db, "appointments", appointmentId)

    await updateDoc(appointmentRef, {
      status: "approved",
      doctorNote: doctorNote,
      approvedAt: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error in approveAppointment:", error)
    return { success: false, error: error.message }
  }
}

async function completeAppointment(appointmentId, summaryData) {
  try {
    const db = getFirestore()
    const appointmentRef = doc(db, "appointments", appointmentId)

    // Get the current appointment data to check permissions
    const appointmentSnap = await getDoc(appointmentRef)

    if (!appointmentSnap.exists()) {
      return { success: false, error: "Appointment not found" }
    }

    const appointmentData = appointmentSnap.data()

    // Only doctors can complete appointments
    // Removed user authentication check as it's handled in the action

    await updateDoc(appointmentRef, {
      status: "completed",
      summary: summaryData,
      completedAt: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error in completeAppointment:", error)
    return { success: false, error: error.message }
  }
}

async function updateAppointment(appointmentId, updateData) {
  try {
    const db = getFirestore()
    const appointmentRef = doc(db, "appointments", appointmentId)

    // Get the current appointment data to check permissions
    const appointmentSnap = await getDoc(appointmentRef)

    if (!appointmentSnap.exists()) {
      return { success: false, error: "Appointment not found" }
    }

    const appointmentData = appointmentSnap.data()

    // Check if the user is authorized to update this appointment
    // (either the patient or the doctor)
    // Removed user authentication check as it's handled in the action

    await updateDoc(appointmentRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error in updateAppointment:", error)
    return { success: false, error: error.message }
  }
}

// Book a new appointment (patient side)
export async function bookAppointment(formData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("You must be logged in to book an appointment")

    const patientProfile = await getUserProfile(currentUser.uid)

    const appointmentData = {
      patientId: currentUser.uid,
      patientName: patientProfile.displayName || "Unknown Patient",
      doctorId: formData.get("doctorId"),
      doctorName: formData.get("doctorName"),
      specialty: formData.get("specialty"),
      date: formData.get("date"),
      time: formData.get("time"),
      type: formData.get("type"),
      notes: formData.get("notes"),
      status: "pending",
    }

    const result = await createAppointment(appointmentData)
    revalidatePath("/dashboard/appointments")
    return { success: true, appointment: result }
  } catch (error) {
    console.error("Error booking appointment:", error)
    return { success: false, error: error.message }
  }
}

// Schedule an appointment (doctor side)
export async function scheduleAppointment(formData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("You must be logged in to schedule an appointment")

    const doctorProfile = await getUserProfile(currentUser.uid)

    const appointmentData = {
      doctorId: currentUser.uid,
      doctorName: doctorProfile.displayName || "Unknown Doctor",
      specialty: doctorProfile.specialty || "",
      patientId: formData.get("patientId"),
      patientName: formData.get("patientName"),
      date: formData.get("date"),
      time: formData.get("time"),
      type: formData.get("type"),
      notes: formData.get("notes"),
      status: "approved", // Doctor-scheduled appointments are auto-approved
    }

    const result = await createAppointment(appointmentData)
    revalidatePath("/doctor/appointments")
    return { success: true, appointment: result }
  } catch (error) {
    console.error("Error scheduling appointment:", error)
    return { success: false, error: error.message }
  }
}

// Create a new appointment
// export async function createAppointment(appointmentData) {
//   try {
//     const user = await getAuthenticatedUser()

//     if (!user) {
//       return { success: false, error: "You must be logged in to create an appointment" }
//     }

//     // Add the user ID to the appointment data
//     appointmentData.patientId = user.uid

//     const db = getFirestore()
//     const appointmentsRef = collection(db, 'appointments')
//     const docRef = await addDoc(appointmentsRef, {
//       ...appointmentData,
//       createdAt: new Date().toISOString()
//     })

//     return { success: true, appointmentId: docRef.id }
//   } catch (error) {
//     console.error('Error in createAppointment:', error)
//     return { success: false, error: error.message }
//   }
// }

// // Get appointments for the current user (works for both patient and doctor)
// export async function getUserAppointments() {
//   try {
//     const currentUser = auth.currentUser
//     if (!currentUser) throw new Error("You must be logged in to view appointments")

//     const userProfile = await getUserProfile(currentUser.uid)

//     if (userProfile.role === "patient") {
//       const appointments = await getPatientAppointments(currentUser.uid)
//       return { success: true, appointments, role: "patient" }
//     } else if (userProfile.role === "doctor") {
//       const appointments = await getDoctorAppointments(currentUser.uid)
//       return { success: true, appointments, role: "doctor" }
//     } else {
//       throw new Error("Invalid user role")
//     }
//   } catch (error) {
//     console.error("Error getting user appointments:", error)
//     return { success: false, error: error.message }
//   }
// }

// Cancel an appointment
export async function cancelUserAppointment(formData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("You must be logged in to cancel an appointment")

    const appointmentId = formData.get("appointmentId")
    const reason = formData.get("reason")

    const result = await cancelAppointment(appointmentId, reason)

    const userProfile = await getUserProfile(currentUser.uid)
    if (userProfile.role === "patient") {
      revalidatePath("/dashboard/appointments")
    } else {
      revalidatePath("/doctor/appointments")
    }

    return { success: true, appointment: result }
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return { success: false, error: error.message }
  }
}

// Approve an appointment (doctor only)
export async function approveUserAppointment(formData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("You must be logged in to approve an appointment")

    const userProfile = await getUserProfile(currentUser.uid)
    if (userProfile.role !== "doctor") throw new Error("Only doctors can approve appointments")

    const appointmentId = formData.get("appointmentId")
    const doctorNote = formData.get("doctorNote")

    const result = await approveAppointment(appointmentId, doctorNote)
    revalidatePath("/doctor/appointments")
    return { success: true, appointment: result }
  } catch (error) {
    console.error("Error approving appointment:", error)
    return { success: false, error: error.message }
  }
}

// Complete an appointment and add summary (doctor only)
export async function completeUserAppointment(formData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("You must be logged in to complete an appointment")

    const userProfile = await getUserProfile(currentUser.uid)
    if (userProfile.role !== "doctor") throw new Error("Only doctors can complete appointments")

    const appointmentId = formData.get("appointmentId")
    const summary = {
      diagnosis: formData.get("diagnosis"),
      recommendations: formData.get("recommendations"),
      prescriptions: formData
        .get("prescriptions")
        .split("\n")
        .filter((p) => p.trim()),
      followUp: formData.get("followUp"),
      notes: formData.get("notes"),
    }

    const result = await completeAppointment(appointmentId, summary)
    revalidatePath("/doctor/appointments")
    return { success: true, appointment: result }
  } catch (error) {
    console.error("Error completing appointment:", error)
    return { success: false, error: error.message }
  }
}

// Reschedule an appointment
export async function rescheduleUserAppointment(formData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("You must be logged in to reschedule an appointment")

    const appointmentId = formData.get("appointmentId")
    const date = formData.get("date")
    const time = formData.get("time")

    const updateData = {
      date,
      time,
      status: "pending", // Reset to pending if patient reschedules
      updatedAt: new Date().toISOString(),
    }

    // If doctor is rescheduling, keep as approved
    const userProfile = await getUserProfile(currentUser.uid)
    if (userProfile.role === "doctor") {
      updateData.status = "approved"
    }

    const result = await updateAppointment(appointmentId, updateData)

    if (userProfile.role === "patient") {
      revalidatePath("/dashboard/appointments")
    } else {
      revalidatePath("/doctor/appointments")
    }

    return { success: true, appointment: result }
  } catch (error) {
    console.error("Error rescheduling appointment:", error)
    return { success: false, error: error.message }
  }
}

// Get doctor's unavailable dates
export async function getDoctorAvailability(doctorId) {
  try {
    const unavailableDates = await getDoctorUnavailableDates(doctorId)
    return { success: true, unavailableDates }
  } catch (error) {
    console.error("Error getting doctor availability:", error)
    return { success: false, error: error.message }
  }
}

// Update doctor's unavailable dates (doctor only)
export async function updateDoctorAvailability(formData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("You must be logged in to update availability")

    const userProfile = await getUserProfile(currentUser.uid)
    if (userProfile.role !== "doctor") throw new Error("Only doctors can update availability")

    const unavailableDatesJson = formData.get("unavailableDates")
    const unavailableDates = JSON.parse(unavailableDatesJson)

    const result = await updateDoctorUnavailableDates(currentUser.uid, unavailableDates)
    return { success: true, unavailableDates: result }
  } catch (error) {
    console.error("Error updating doctor availability:", error)
    return { success: false, error: error.message }
  }
}

// Get available time slots for a doctor on a specific date
export async function getAvailableTimeSlots(formData) {
  try {
    const doctorId = formData.get("doctorId")
    const date = formData.get("date")

    // All possible time slots
    const allTimeSlots = [
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
    ]

    // Get booked slots
    const bookedSlots = await getBookedTimeSlots(doctorId, date)

    // Filter out booked slots
    const availableSlots = allTimeSlots.filter((slot) => !bookedSlots.includes(slot))

    return { success: true, availableSlots }
  } catch (error) {
    console.error("Error getting available time slots:", error)
    return { success: false, error: error.message }
  }
}

// Update an appointment
// export async function updateAppointment(appointmentId, updateData) {
//   try {
//     const user = await getAuthenticatedUser()

//     if (!user) {
//       return { success: false, error: "You must be logged in to update an appointment" }
//     }

//     const db = getFirestore()
//     const appointmentRef = doc(db, 'appointments', appointmentId)

//     // Get the current appointment data to check permissions
//     const appointmentSnap = await getDoc(appointmentRef)

//     if (!appointmentSnap.exists()) {
//       return { success: false, error: "Appointment not found" }
//     }

//     const appointmentData = appointmentSnap.data()

//     // Check if the user is authorized to update this appointment
//     // (either the patient or the doctor)
//     if (appointmentData.patientId !== user.uid && appointmentData.doctorId !== user.uid) {
//       return { success: false, error: "You are not authorized to update this appointment" }
//     }

//     await updateDoc(appointmentRef, {
//       ...updateData,
//       updatedAt: new Date().toISOString()
//     })

//     return { success: true }
//   } catch (error) {
//     console.error('Error in updateAppointment:', error)
//     return { success: false, error: error.message }
//   }
// }

// // Cancel an appointment
// export async function cancelAppointment(appointmentId, reason) {
//   try {
//     const user = await getAuthenticatedUser()

//     if (!user) {
//       return { success: false, error: "You must be logged in to cancel an appointment" }
//     }

//     const db = getFirestore()
//     const appointmentRef = doc(db, 'appointments', appointmentId)

//     // Get the current appointment data to check permissions
//     const appointmentSnap = await getDoc(appointmentRef)

//     if (!appointmentSnap.exists()) {
//       return { success: false, error: "Appointment not found" }
//     }

//     const appointmentData = appointmentSnap.data()

//     // Check if the user is authorized to cancel this appointment
//     if (appointmentData.patientId !== user.uid && appointmentData.doctorId !== user.uid) {
//       return { success: false, error: "You are not authorized to cancel this appointment" }
//     }

//     await updateDoc(appointmentRef, {
//       status: 'cancelled',
//       cancellationReason: reason,
//       cancelledBy: user.uid,
//       cancelledAt: new Date().toISOString()
//     })

//     return { success: true }
//   } catch (error) {
//     console.error('Error in cancelAppointment:', error)
//     return { success: false, error: error.message }
//   }
// }

// // Complete an appointment with summary
// export async function completeAppointment(appointmentId, summaryData) {
//   try {
//     const user = await getAuthenticatedUser()

//     if (!user) {
//       return { success: false, error: "You must be logged in to complete an appointment" }
//     }

//     const db = getFirestore()
//     const appointmentRef = doc(db, 'appointments', appointmentId)

//     // Get the current appointment data to check permissions
//     const appointmentSnap = await getDoc(appointmentRef)

//     if (!appointmentSnap.exists()) {
//       return { success: false, error: "Appointment not found" }
//     }

//     const appointmentData = appointmentSnap.data()

//     // Only doctors can complete appointments
//     if (appointmentData.doctorId !== user.uid) {
//       return { success: false, error: "Only the assigned doctor can complete this appointment" }
//     }

//     await updateDoc(appointmentRef, {
//       status: 'completed',
//       summary: summaryData,
//       completedAt: new Date().toISOString()
//     })

//     return { success: true }
//   } catch (error) {
//     console.error('Error in completeAppointment:', error)
//     return { success: false, error: error.message }
//   }
// }
