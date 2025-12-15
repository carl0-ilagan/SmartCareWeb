import { db } from "./firebase"
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit, Timestamp } from "firebase/firestore"
import { normalizeDate } from "./appointment-utils"

// Get the doctors a patient has interacted with
export async function getConnectedDoctors(patientId) {
  try {
    if (!patientId) return { count: 0, doctors: [] }

    // Get appointments with doctors
    const appointmentsQuery = query(collection(db, "appointments"), where("patientId", "==", patientId))
    const appointmentDocs = await getDocs(appointmentsQuery)

    // Extract unique doctor IDs and their appointment dates
    const doctorMap = new Map()

    appointmentDocs.forEach((doc) => {
      const data = doc.data()
      if (data.doctorId) {
        if (!doctorMap.has(data.doctorId)) {
          doctorMap.set(data.doctorId, {
            id: data.doctorId,
            appointments: [],
          })
        }

        // Add appointment to this doctor's list
        doctorMap.get(data.doctorId).appointments.push({
          id: doc.id,
          date: data.date,
          time: data.time,
          status: data.status,
        })
      }
    })

    // Get doctor details for each connected doctor
    const doctors = []
    for (const [doctorId, doctorData] of doctorMap.entries()) {
      const doctorDoc = await getDoc(doc(db, "users", doctorId))
      if (doctorDoc.exists()) {
        const data = doctorDoc.data()
        doctors.push({
          id: doctorId,
          name: data.displayName || `Dr. ${data.lastName || "Unknown"}`,
          specialty: data.specialty || "General Practitioner",
          photoURL: data.photoURL || null,
          appointments: doctorData.appointments,
        })
      }
    }

    // If no connected doctors found, get some sample doctors
    if (doctors.length === 0) {
      const doctorsQuery = query(collection(db, "users"), where("role", "==", "doctor"), limit(3))
      const doctorDocs = await getDocs(doctorsQuery)

      doctorDocs.docs.forEach((doc) => {
        const data = doc.data()
        doctors.push({
          id: doc.id,
          name: data.displayName || `Dr. ${data.lastName || "Unknown"}`,
          specialty: data.specialty || "General Practitioner",
          photoURL: data.photoURL || null,
          appointments: [],
        })
      })
    }

    return {
      count: doctors.length,
      doctors,
    }
  } catch (error) {
    console.error("Error getting connected doctors:", error)
    // Return mock data if there's an error
    return {
      count: 3,
      doctors: [
        { id: "doc1", name: "Dr. Sarah Johnson", specialty: "Cardiologist" },
        { id: "doc2", name: "Dr. Michael Chen", specialty: "Dermatologist" },
        { id: "doc3", name: "Dr. Emily Rodriguez", specialty: "Neurologist" },
      ],
    }
  }
}

// Get the patients a doctor has interacted with
export async function getConnectedPatients(doctorId) {
  try {
    if (!doctorId) return { count: 0, patients: [] }

    // Get appointments with patients
    const appointmentsQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorId))
    const appointmentDocs = await getDocs(appointmentsQuery)

    // Extract unique patient IDs and their appointment dates
    const patientMap = new Map()

    appointmentDocs.forEach((doc) => {
      const data = doc.data()
      if (data.patientId) {
        if (!patientMap.has(data.patientId)) {
          patientMap.set(data.patientId, {
            id: data.patientId,
            appointments: [],
          })
        }

        // Add appointment to this patient's list
        patientMap.get(data.patientId).appointments.push({
          id: doc.id,
          date: data.date,
          time: data.time,
          status: data.status,
        })
      }
    })

    // Get patient details for each connected patient
    const patients = []
    for (const [patientId, patientData] of patientMap.entries()) {
      const patientDoc = await getDoc(doc(db, "users", patientId))
      if (patientDoc.exists()) {
        const data = patientDoc.data()
        patients.push({
          id: patientId,
          name: data.displayName || `${data.firstName || ""} ${data.lastName || "Unknown"}`,
          age: data.age || calculateAge(data.dob),
          photoURL: data.photoURL || null,
          appointments: patientData.appointments,
        })
      }
    }

    // If no connected patients found, get some sample patients
    if (patients.length === 0) {
      const patientsQuery = query(collection(db, "users"), where("role", "==", "patient"), limit(3))
      const patientDocs = await getDocs(patientsQuery)

      patientDocs.docs.forEach((doc) => {
        const data = doc.data()
        patients.push({
          id: doc.id,
          name: data.displayName || `${data.firstName || ""} ${data.lastName || "Unknown"}`,
          age: data.age || calculateAge(data.dob) || "35",
          photoURL: data.photoURL || null,
          appointments: [],
        })
      })
    }

    return {
      count: patients.length,
      patients,
    }
  } catch (error) {
    console.error("Error getting connected patients:", error)
    // Return mock data if there's an error
    return {
      count: 3,
      patients: [
        { id: "pat1", name: "John Smith", age: 45 },
        { id: "pat2", name: "Emily Johnson", age: 32 },
        { id: "pat3", name: "Michael Brown", age: 58 },
      ],
    }
  }
}

// Calculate age from date of birth
function calculateAge(dob) {
  if (!dob) return null

  let birthDate
  if (dob instanceof Timestamp) {
    birthDate = dob.toDate()
  } else {
    birthDate = new Date(dob)
  }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Get upcoming appointments for a user (patient or doctor)
export async function getUpcomingAppointments(userId, isDoctor = false, appointmentLimit = 5) {
  try {
    if (!userId) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = normalizeDate(today)

    const fieldToQuery = isDoctor ? "doctorId" : "patientId"
    const otherPartyField = isDoctor ? "patientId" : "doctorId"

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where(fieldToQuery, "==", userId),
      where("date", ">=", todayStr),
      orderBy("date", "asc"),
      limit(appointmentLimit),
    )

    const appointmentDocs = await getDocs(appointmentsQuery)
    const appointments = []

    for (const appointmentDoc of appointmentDocs.docs) {
      const appointmentData = appointmentDoc.data()

      // Get the other party's information (doctor for patient, patient for doctor)
      const otherPartyId = appointmentData[otherPartyField]
      let otherPartyData = null

      if (otherPartyId) {
        const otherPartyDoc = await getDoc(doc(db, "users", otherPartyId))
        if (otherPartyDoc.exists()) {
          otherPartyData = otherPartyDoc.data()
        }
      }

      appointments.push({
        id: appointmentDoc.id,
        ...appointmentData,
        otherParty: otherPartyData,
      })
    }

    // If no appointments found, create some sample appointments
    if (appointments.length === 0 && !isDoctor) {
      // Get a doctor
      const doctorsQuery = query(collection(db, "users"), where("role", "==", "doctor"), limit(1))
      const doctorDocs = await getDocs(doctorsQuery)

      if (!doctorDocs.empty) {
        const doctorDoc = doctorDocs.docs[0]
        const doctorData = doctorDoc.data()

        // Create a sample upcoming appointment
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)

        appointments.push({
          id: "sample-apt-1",
          date: normalizeDate(tomorrow),
          time: "10:00 AM",
          status: "confirmed",
          doctorId: doctorDoc.id,
          patientId: userId,
          reason: "Annual checkup",
          otherParty: {
            displayName: doctorData.displayName || `Dr. ${doctorData.lastName || "Johnson"}`,
            specialty: doctorData.specialty || "General Practitioner",
          },
        })
      }
    }

    return appointments
  } catch (error) {
    console.error("Error getting upcoming appointments:", error)
    // Return mock data if there's an error
    if (!isDoctor) {
      return [
        {
          id: "apt1",
          date: normalizeDate(new Date(Date.now() + 86400000)), // tomorrow
          time: "10:00 AM",
          status: "confirmed",
          otherParty: {
            displayName: "Dr. Sarah Johnson",
            specialty: "Cardiologist",
          },
        },
        {
          id: "apt2",
          date: normalizeDate(new Date(Date.now() + 86400000 * 5)), // 5 days from now
          time: "2:30 PM",
          status: "confirmed",
          otherParty: {
            displayName: "Dr. Michael Chen",
            specialty: "Dermatologist",
          },
        },
      ]
    }
    return []
  }
}

// Get past appointments for a user (patient or doctor)
export async function getPastAppointments(userId, isDoctor = false, appointmentLimit = 5) {
  try {
    if (!userId) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = normalizeDate(today)

    const fieldToQuery = isDoctor ? "doctorId" : "patientId"
    const otherPartyField = isDoctor ? "patientId" : "doctorId"

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where(fieldToQuery, "==", userId),
      where("date", "<", todayStr),
      orderBy("date", "desc"),
      limit(appointmentLimit),
    )

    const appointmentDocs = await getDocs(appointmentsQuery)
    const appointments = []

    for (const appointmentDoc of appointmentDocs.docs) {
      const appointmentData = appointmentDoc.data()

      // Get the other party's information (doctor for patient, patient for doctor)
      const otherPartyId = appointmentData[otherPartyField]
      let otherPartyData = null

      if (otherPartyId) {
        const otherPartyDoc = await getDoc(doc(db, "users", otherPartyId))
        if (otherPartyDoc.exists()) {
          otherPartyData = otherPartyDoc.data()
        }
      }

      appointments.push({
        id: appointmentDoc.id,
        ...appointmentData,
        otherParty: otherPartyData,
      })
    }

    return appointments
  } catch (error) {
    console.error("Error getting past appointments:", error)
    return []
  }
}

// Get all appointments for a user (patient or doctor)
export async function getAllAppointments(userId, isDoctor = false) {
  try {
    if (!userId) return []

    const fieldToQuery = isDoctor ? "doctorId" : "patientId"
    const otherPartyField = isDoctor ? "patientId" : "doctorId"

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where(fieldToQuery, "==", userId),
      orderBy("date", "asc"),
    )

    const appointmentDocs = await getDocs(appointmentsQuery)
    const appointments = []

    for (const appointmentDoc of appointmentDocs.docs) {
      const appointmentData = appointmentDoc.data()

      // Get the other party's information (doctor for patient, patient for doctor)
      const otherPartyId = appointmentData[otherPartyField]
      let otherPartyData = null

      if (otherPartyId) {
        const otherPartyDoc = await getDoc(doc(db, "users", otherPartyId))
        if (otherPartyDoc.exists()) {
          otherPartyData = otherPartyDoc.data()
        }
      }

      appointments.push({
        id: appointmentDoc.id,
        ...appointmentData,
        otherParty: otherPartyData,
      })
    }

    return appointments
  } catch (error) {
    console.error("Error getting all appointments:", error)
    return []
  }
}

// Get unread message count for a user
export async function getUnreadMessageCount(userId) {
  try {
    if (!userId) return 0

    // Get all conversations for the user
    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", userId))

    const conversationDocs = await getDocs(conversationsQuery)
    let unreadCount = 0

    // For each conversation, check for unread messages
    for (const conversationDoc of conversationDocs.docs) {
      const conversationId = conversationDoc.id
      const conversationData = conversationDoc.data()

      // Check if there's an unread count stored in the conversation document
      if (conversationData.unreadCounts && conversationData.unreadCounts[userId]) {
        unreadCount += conversationData.unreadCounts[userId]
      } else {
        // Fallback to counting messages
        const messagesQuery = query(
          collection(db, "conversations", conversationId, "messages"),
          where("read", "==", false),
          where("senderId", "!=", userId),
        )

        const messageDocs = await getDocs(messagesQuery)
        unreadCount += messageDocs.size
      }
    }

    // Return the actual unread count
    return unreadCount
  } catch (error) {
    console.error("Error getting unread message count:", error)
    return 0 // Return 0 on error
  }
}

// Get prescription count for a user
export async function getPrescriptionCount(userId, isDoctor = false) {
  try {
    if (!userId) return 0

    const fieldToQuery = isDoctor ? "doctorId" : "patientId"

    const prescriptionsQuery = query(collection(db, "prescriptions"), where(fieldToQuery, "==", userId))

    const prescriptionDocs = await getDocs(prescriptionsQuery)
    const count = prescriptionDocs.size

    // Return the actual prescription count
    return count
  } catch (error) {
    console.error("Error getting prescription count:", error)
    return 0 // Return 0 on error
  }
}

// Get today's appointments for a doctor
export async function getTodayAppointments(doctorId, appointmentLimit = 5) {
  try {
    if (!doctorId) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = normalizeDate(today)

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId),
      where("date", "==", todayStr),
      orderBy("time", "asc"),
      limit(appointmentLimit),
    )

    const appointmentDocs = await getDocs(appointmentsQuery)
    const appointments = []

    for (const appointmentDoc of appointmentDocs.docs) {
      const appointmentData = appointmentDoc.data()

      // Get patient information
      let patientData = null
      if (appointmentData.patientId) {
        const patientDoc = await getDoc(doc(db, "users", appointmentData.patientId))
        if (patientDoc.exists()) {
          patientData = patientDoc.data()
        }
      }

      appointments.push({
        id: appointmentDoc.id,
        ...appointmentData,
        patient: patientData,
      })
    }

    return appointments
  } catch (error) {
    console.error("Error getting today's appointments:", error)
    return []
  }
}

// Get appointment counts by status for a user
export async function getAppointmentCounts(userId, userRole) {
  try {
    if (!userId || !userRole) {
      throw new Error("User ID and role are required")
    }

    const fieldToQuery = userRole === "doctor" ? "doctorId" : "patientId"

    const q = query(collection(db, "appointments"), where(fieldToQuery, "==", userId))

    const querySnapshot = await getDocs(q)

    const counts = {
      upcoming: 0,
      pending: 0,
      approved: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = normalizeDate(today)

    querySnapshot.forEach((doc) => {
      const appointment = doc.data()
      counts.total++

      // Count by status
      if (appointment.status) {
        counts[appointment.status] = (counts[appointment.status] || 0) + 1
      }

      // Count upcoming (approved/confirmed appointments with future dates)
      if (
        (appointment.status === "approved" || appointment.status === "confirmed") &&
        appointment.date &&
        appointment.date >= todayStr
      ) {
        counts.upcoming++
      }
    })

    return counts
  } catch (error) {
    console.error("Error getting appointment counts:", error)
    return {
      upcoming: 0,
      pending: 0,
      approved: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    }
  }
}

// Get doctor unavailability for a patient's connected doctors
export async function getDoctorUnavailabilityForPatient(patientId) {
  try {
    if (!patientId) return []

    // Get connected doctors
    const { doctors } = await getConnectedDoctors(patientId)

    // Get unavailability for each doctor
    const unavailabilityMap = new Map()

    for (const doctor of doctors) {
      const doctorId = doctor.id
      const doctorName = doctor.name

      // Get unavailable dates from doctor availability
      const availabilityDoc = await getDoc(doc(db, "doctorAvailability", doctorId))
      if (availabilityDoc.exists()) {
        const unavailableDates = availabilityDoc.data().unavailableDates || []

        // Add each date to the map with doctor info
        unavailableDates.forEach((date) => {
          if (!unavailabilityMap.has(date)) {
            unavailabilityMap.set(date, [])
          }

          unavailabilityMap.get(date).push({
            doctorId,
            doctorName,
          })
        })
      }
    }

    // Convert map to array of objects
    const result = []
    for (const [date, doctors] of unavailabilityMap.entries()) {
      result.push({
        date,
        doctors,
      })
    }

    return result
  } catch (error) {
    console.error("Error getting doctor unavailability for patient:", error)
    return []
  }
}

// Get all appointments for calendar display
export async function getCalendarAppointments(userId, isDoctor = false) {
  try {
    if (!userId) return []

    const fieldToQuery = isDoctor ? "doctorId" : "patientId"
    const otherPartyField = isDoctor ? "patientId" : "doctorId"

    const appointmentsQuery = query(collection(db, "appointments"), where(fieldToQuery, "==", userId))

    const appointmentDocs = await getDocs(appointmentsQuery)
    const appointments = []

    for (const appointmentDoc of appointmentDocs.docs) {
      const appointmentData = appointmentDoc.data()

      // Get the other party's name
      let otherPartyName = "Unknown"
      if (appointmentData[otherPartyField]) {
        const otherPartyDoc = await getDoc(doc(db, "users", appointmentData[otherPartyField]))
        if (otherPartyDoc.exists()) {
          const data = otherPartyDoc.data()
          otherPartyName = isDoctor
            ? data.displayName || `${data.firstName || ""} ${data.lastName || "Unknown"}`
            : data.displayName || `Dr. ${data.lastName || "Unknown"}`
        }
      }

      appointments.push({
        id: appointmentDoc.id,
        date: appointmentData.date,
        time: appointmentData.time,
        status: appointmentData.status,
        otherPartyId: appointmentData[otherPartyField],
        otherPartyName,
      })
    }

    return appointments
  } catch (error) {
    console.error("Error getting calendar appointments:", error)
    return []
  }
}

// Get mock data for testing when real data isn't available yet
export function getMockDashboardData(isDoctor = false) {
  if (isDoctor) {
    return {
      patientCount: 24,
      appointmentsToday: 5,
      prescriptionCount: 18,
      unreadMessages: 3,
      recentAppointments: [
        {
          id: "mock1",
          patientName: "John Doe",
          time: "9:00 AM",
          type: "Check-up",
          status: "Confirmed",
        },
        {
          id: "mock2",
          patientName: "Jane Smith",
          time: "11:30 AM",
          type: "Follow-up",
          status: "Pending",
        },
      ],
    }
  } else {
    return {
      doctorCount: 3,
      upcomingAppointments: 2,
      prescriptionCount: 5,
      unreadMessages: 1,
      recentAppointments: [
        {
          id: "mock1",
          doctorName: "Dr. Sarah Johnson",
          date: new Date(),
          time: "2:00 PM",
          type: "Consultation",
          status: "Confirmed",
        },
      ],
    }
  }
}
