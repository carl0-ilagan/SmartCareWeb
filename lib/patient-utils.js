import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"
import { logUserActivity } from "./admin-utils"

// Log patient activities
export async function logPatientActivity(action, details, patient) {
  return logUserActivity(action, details, patient, "patient")
}

// Example: Log when a patient books an appointment
export async function bookAppointment(patientId, patientEmail, doctorId, appointmentDate) {
  try {
    // Create the appointment in Firestore
    const appointmentsCollection = collection(db, "appointments")
    const appointmentData = {
      patientId,
      doctorId,
      date: appointmentDate,
      status: "pending",
      createdAt: serverTimestamp(),
    }

    const appointmentRef = await addDoc(appointmentsCollection, appointmentData)

    // Log this activity
    await logPatientActivity(
      "Appointment Booked",
      `Appointment scheduled with doctor ${doctorId} for ${new Date(appointmentDate).toLocaleString()}`,
      { id: patientId, email: patientEmail },
    )

    return appointmentRef.id
  } catch (error) {
    console.error("Error booking appointment:", error)
    throw error
  }
}
