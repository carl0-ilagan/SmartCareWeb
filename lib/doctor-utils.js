import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getPatientMedicalRecordsCount } from "./record-utils"
import { logUserActivity } from "./admin-utils"

// Log doctor activities
export async function logDoctorActivity(action, details, doctor, type = "info") {
  return logUserActivity(action, details, doctor, "doctor", type)
}

// Example: Log when a doctor approves an appointment
export async function approveAppointment(appointmentId, doctorId, doctorEmail, patientId) {
  try {
    // Update the appointment in Firestore
    const appointmentRef = doc(db, "appointments", appointmentId)
    await updateDoc(appointmentRef, {
      status: "approved",
      updatedAt: serverTimestamp(),
    })

    // Log this activity
    await logDoctorActivity(
      "Appointment Approved",
      `Appointment with patient ${patientId} was approved`,
      { id: doctorId, email: doctorEmail },
      "success",
    )

    return true
  } catch (error) {
    console.error("Error approving appointment:", error)
    throw error
  }
}

// Example: Log when a doctor creates a prescription
export async function createPrescription(doctorId, doctorEmail, patientId, medications) {
  try {
    // Create the prescription in Firestore
    const prescriptionsCollection = collection(db, "prescriptions")
    const prescriptionData = {
      doctorId,
      patientId,
      medications,
      createdAt: serverTimestamp(),
      status: "active",
    }

    const prescriptionRef = await addDoc(prescriptionsCollection, prescriptionData)

    // Log this activity
    await logDoctorActivity(
      "Prescription Created",
      `New prescription created for patient ${patientId}`,
      { id: doctorId, email: doctorEmail },
      "success",
    )

    return prescriptionRef.id
  } catch (error) {
    console.error("Error creating prescription:", error)
    throw error
  }
}

// Get all patients connected to a doctor
export const getDoctorPatients = (doctorId, callback) => {
  if (!doctorId) return () => {}

  // Query appointments to find patients connected to this doctor
  const appointmentsQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorId))

  // Listen for changes to appointments
  return onSnapshot(appointmentsQuery, async (appointmentsSnapshot) => {
    try {
      // Get unique patient IDs from appointments
      const patientIds = new Set()
      appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data()
        if (appointment.patientId) {
          patientIds.add(appointment.patientId)
        }
      })

      // Query messages to find additional patients
      const messagesQuery = query(collection(db, "conversations"), where("participants", "array-contains", doctorId))
      const messagesSnapshot = await getDocs(messagesQuery)
      messagesSnapshot.forEach((doc) => {
        const conversation = doc.data()
        conversation.participants.forEach((participant) => {
          if (participant !== doctorId) {
            patientIds.add(participant)
          }
        })
      })

      // Get patient data for each patient ID
      const patients = []
      for (const patientId of patientIds) {
        const patientDoc = await getDoc(doc(db, "users", patientId))
        if (patientDoc.exists()) {
          const patientData = patientDoc.data()
          // Only include users with role "patient"
          if (patientData.role === "patient") {
            patients.push({
              id: patientId,
              ...patientData,
            })
          }
        }
      }

      // Call the callback with the patients data
      callback(patients)
    } catch (error) {
      console.error("Error getting doctor patients:", error)
      callback([])
    }
  })
}

// Get all patients connected to a doctor (alias function for compatibility)
export const getConnectedPatients = async (doctorId) => {
  if (!doctorId) return []

  try {
    // Query appointments to find patients connected to this doctor
    const appointmentsQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorId))
    const appointmentsSnapshot = await getDocs(appointmentsQuery)

    // Get unique patient IDs from appointments
    const patientIds = new Set()
    appointmentsSnapshot.forEach((doc) => {
      const appointment = doc.data()
      if (appointment.patientId) {
        patientIds.add(appointment.patientId)
      }
    })

    // Query messages to find additional patients
    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", doctorId))
    const messagesSnapshot = await getDocs(conversationsQuery)
    messagesSnapshot.forEach((doc) => {
      const conversation = doc.data()
      conversation.participants.forEach((participant) => {
        if (participant !== doctorId) {
          patientIds.add(participant)
        }
      })
    })

    // Return array of patient IDs
    return Array.from(patientIds)
  } catch (error) {
    console.error("Error getting connected patients:", error)
    return []
  }
}

// Get a specific patient by ID
export const getPatientById = async (patientId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", patientId))

    if (!userDoc.exists()) {
      // Document may have been deleted or never created; fail silently for UX and let caller filter nulls
      console.warn?.(`Patient not found: ${patientId}`)
      return null
    }

    const userData = userDoc.data()

    // Ensure the fetched user is actually a patient
    if (userData.role && userData.role !== "patient") {
      console.warn?.(`User is not a patient: ${patientId} (role=${userData.role})`)
      return null
    }

    return {
      id: patientId,
      ...userData,
    }
  } catch (error) {
    console.error("Error fetching patient:", error)
    return null
  }
}

// Check if a doctor is connected to a patient
export const isDoctorConnectedToPatient = async (doctorId, patientId) => {
  if (!doctorId || !patientId) return false

  try {
    // Check appointments
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId),
      where("patientId", "==", patientId),
      limit(1),
    )
    const appointmentsSnapshot = await getDocs(appointmentsQuery)
    if (!appointmentsSnapshot.empty) {
      return true
    }

    // Check messages
    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", doctorId))
    const conversationsSnapshot = await getDocs(conversationsQuery)
    for (const doc of conversationsSnapshot.docs) {
      const conversation = doc.data()
      if (conversation.participants.includes(patientId)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking doctor-patient connection:", error)
    return false
  }
}

// Get interaction counts between a doctor and patient
export const getPatientInteractions = async (doctorId, patientId) => {
  if (!doctorId || !patientId) {
    return {
      appointments: 0,
      messages: 0,
      records: 0,
      lastInteraction: null,
    }
  }

  try {
    // Get appointment count
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId),
      where("patientId", "==", patientId),
    )
    const appointmentsSnapshot = await getDocs(appointmentsQuery)
    const appointmentCount = appointmentsSnapshot.size

    // Get latest appointment date
    let latestAppointmentDate = null
    appointmentsSnapshot.forEach((doc) => {
      const appointment = doc.data()
      const appointmentDate = new Date(appointment.date)
      if (!latestAppointmentDate || appointmentDate > latestAppointmentDate) {
        latestAppointmentDate = appointmentDate
      }
    })

    // Get conversation
    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", doctorId))
    const conversationsSnapshot = await getDocs(conversationsQuery)

    // Find conversation with this patient
    let conversationId = null
    conversationsSnapshot.forEach((doc) => {
      const conversation = doc.data()
      if (conversation.participants.includes(patientId)) {
        conversationId = doc.id
      }
    })

    // Get message count and latest message date
    let messageCount = 0
    let latestMessageDate = null

    if (conversationId) {
      const messagesQuery = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("timestamp", "desc"),
        limit(100),
      )
      const messagesSnapshot = await getDocs(messagesQuery)
      messageCount = messagesSnapshot.size

      if (!messagesSnapshot.empty) {
        const latestMessage = messagesSnapshot.docs[0].data()
        latestMessageDate = latestMessage.timestamp?.toDate() || null
      }
    }

    // Get total medical records count for this patient
    const recordCount = await getPatientMedicalRecordsCount(patientId)

    // Get shared records count
    const sharedRecordsQuery = query(
      collection(db, "medicalRecords"),
      where("patientId", "==", patientId),
      where("sharedWith", "array-contains", doctorId),
    )
    const sharedRecordsSnapshot = await getDocs(sharedRecordsQuery)
    const sharedRecordCount = sharedRecordsSnapshot.size

    // Get latest record date
    let latestRecordDate = null
    sharedRecordsSnapshot.forEach((doc) => {
      const record = doc.data()
      const recordDate = record.uploadedDate?.toDate() || null
      if (recordDate && (!latestRecordDate || recordDate > latestRecordDate)) {
        latestRecordDate = recordDate
      }
    })

    // Determine the most recent interaction date
    const dates = [latestAppointmentDate, latestMessageDate, latestRecordDate].filter(Boolean)
    const lastInteraction = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null

    return {
      appointments: appointmentCount,
      messages: messageCount,
      records: recordCount,
      sharedRecords: sharedRecordCount,
      lastInteraction,
    }
  } catch (error) {
    console.error("Error getting patient interactions:", error)
    return {
      appointments: 0,
      messages: 0,
      records: 0,
      lastInteraction: null,
    }
  }
}

// Get newly connected patients for a doctor (within the last week)
export const getNewlyConnectedPatients = async (doctorId) => {
  if (!doctorId) return { count: 0, patients: [] }

  try {
    // Get all connected patients
    const patientIds = await getConnectedPatients(doctorId)

    // Get one week ago date
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get all appointments for this doctor
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId),
      orderBy("createdAt", "desc"),
    )
    const appointmentsSnapshot = await getDocs(appointmentsQuery)

    // Track first appointment date for each patient
    const patientFirstAppointment = new Map()

    appointmentsSnapshot.forEach((doc) => {
      const appointment = doc.data()
      const patientId = appointment.patientId
      const createdAt = appointment.createdAt?.toDate() || new Date(appointment.date)

      if (
        patientId &&
        (!patientFirstAppointment.has(patientId) || createdAt < patientFirstAppointment.get(patientId))
      ) {
        patientFirstAppointment.set(patientId, createdAt)
      }
    })

    // Filter patients who connected within the last week
    const newPatientIds = []
    for (const [patientId, firstAppointmentDate] of patientFirstAppointment.entries()) {
      if (firstAppointmentDate >= oneWeekAgo) {
        newPatientIds.push(patientId)
      }
    }

    // Get patient details
    const newPatients = []
    for (const patientId of newPatientIds) {
      const patientData = await getPatientById(patientId)
      if (patientData) {
        newPatients.push(patientData)
      }
    }

    return {
      count: newPatients.length,
      patients: newPatients,
    }
  } catch (error) {
    console.error("Error getting newly connected patients:", error)
    return { count: 0, patients: [] }
  }
}

// Get follow-up appointments for a doctor
export const getFollowUpAppointments = async (doctorId) => {
  if (!doctorId) return { count: 0, appointments: [] }

  try {
    // Get future appointments
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId),
      where("date", ">=", todayStr),
      where("type", "==", "follow-up"),
    )

    const appointmentsSnapshot = await getDocs(appointmentsQuery)

    // Process appointments
    const appointments = []
    appointmentsSnapshot.forEach((doc) => {
      const appointment = doc.data()
      appointments.push({
        id: doc.id,
        ...appointment,
      })
    })

    return {
      count: appointments.length,
      appointments,
    }
  } catch (error) {
    console.error("Error getting follow-up appointments:", error)
    return { count: 0, appointments: [] }
  }
}

// Get patient record statistics for a doctor
export const getPatientRecordStats = async (doctorId) => {
  if (!doctorId) return { total: 0, shared: 0, recent: 0 }

  try {
    // Get all patients connected to this doctor
    const patientIds = await getConnectedPatients(doctorId)

    // Get records shared with this doctor
    const sharedRecordsQuery = query(collection(db, "medicalRecords"), where("sharedWith", "array-contains", doctorId))
    const sharedRecordsSnapshot = await getDocs(sharedRecordsQuery)
    const sharedRecords = sharedRecordsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get records uploaded in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentRecords = sharedRecords.filter((record) => {
      const uploadDate = record.uploadedDate?.toDate() || new Date()
      return uploadDate >= thirtyDaysAgo
    })

    // Get total records for connected patients
    let totalRecords = 0
    for (const patientId of patientIds) {
      const recordsQuery = query(collection(db, "medicalRecords"), where("patientId", "==", patientId))
      const recordsSnapshot = await getDocs(recordsQuery)
      totalRecords += recordsSnapshot.size
    }

    return {
      total: totalRecords,
      shared: sharedRecords.length,
      recent: recentRecords.length,
    }
  } catch (error) {
    console.error("Error getting patient record stats:", error)
    return { total: 0, shared: 0, recent: 0 }
  }
}

// Safely fetch doctor profile data for patient view
export async function getPublicDoctorProfile(doctorId) {
  try {
    const doctorDoc = await getDoc(doc(db, "users", doctorId))

    if (!doctorDoc.exists()) {
      return null
    }

    const doctorData = doctorDoc.data()

    // Verify this is a doctor account
    if (doctorData.role !== "doctor") {
      return null
    }

    // Helper function to ensure a field is an array
    const ensureArray = (field) => {
      if (!field) return []
      if (Array.isArray(field)) return field
      return [field].filter(Boolean) // Convert to array and filter out null/undefined
    }

    // Return only the public fields that patients should see
    return {
      id: doctorDoc.id,
      displayName: doctorData.displayName || `Dr. ${doctorData.lastName || "Unknown"}`,
      firstName: doctorData.firstName || "",
      lastName: doctorData.lastName || "",
      specialty: doctorData.specialty || "General Practitioner",
      experience: doctorData.experience || "5+ years",
      education: ensureArray(doctorData.education || ["Medical University"]),
      certifications: ensureArray(doctorData.certifications || ["Board Certified"]),
      languages: ensureArray(doctorData.languages || ["English"]),
      bio: doctorData.bio || "Experienced healthcare professional dedicated to providing quality patient care.",
      address: doctorData.address || "123 Medical Center, Healthcare City",
      phone: doctorData.phone || "+1 (555) 123-4567",
      email: doctorData.email || "doctor@example.com",
      photoURL: doctorData.photoURL || null,
      isOnline: doctorData.isOnline || false,
    }
  } catch (error) {
    console.error("Error fetching doctor profile:", error)
    throw error
  }
}
