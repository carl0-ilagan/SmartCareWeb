import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  setDoc,
  limit,
} from "firebase/firestore"
import { db } from "./firebase"

// Add imports for logging utilities at the top of the file
import { logPatientActivity } from "./patient-utils"
import { logDoctorActivity } from "./doctor-utils"
import { sendNotification, sendPushNotification } from "./notification-utils"
import { sendEmailNotification } from "./email-service"
import { getUserDetails } from "./user-utils"

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

// Helper function to normalize date strings to prevent timezone issues
export const normalizeDate = (dateString) => {
  if (!dateString) return ""
  // Create a date object and extract year, month, day
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() is zero-based
  const day = date.getDate()

  // Format as YYYY-MM-DD to ensure consistency
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
}

// Helper function to format date for display
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Create a new appointment
export const createAppointment = async (appointmentData) => {
  try {
    // Set initial status based on who created the appointment
    let initialStatus = "pending"

    // If a doctor creates an appointment, it's automatically approved
    if (appointmentData.createdBy === appointmentData.doctorId) {
      initialStatus = "approved"
    }

    // Normalize the date to prevent timezone issues
    const normalizedDate = normalizeDate(appointmentData.date)

    // Add appointment to Firestore
    const appointmentRef = await addDoc(collection(db, "appointments"), {
      ...appointmentData,
      date: normalizedDate, // Use normalized date
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: initialStatus, // Set initial status based on creator
      notifications: {
        patient: initialStatus === "approved", // Notify patient if doctor created and auto-approved
        doctor: initialStatus === "pending", // Notify doctor if patient created and needs approval
      },
    })

    // Log the appointment creation
    if (appointmentData.createdBy === appointmentData.patientId) {
      await logPatientActivity(
        "Appointment Requested",
        `Patient requested an appointment with doctor (ID: ${appointmentData.doctorId}) for ${normalizedDate}`,
        { id: appointmentData.patientId },
      )

      // Send notifications to doctor when patient books appointment
      try {
        // Get doctor details for email
        const doctorDetails = await getUserDetails(appointmentData.doctorId)
        // Get patient details to get their profile image
        const patientDetails = await getUserDetails(appointmentData.patientId)
        const patientPhotoURL = patientDetails?.photoURL || null
        
        if (doctorDetails?.email) {
          // Send email notification to doctor when patient books appointment
          const emailSubject = `New Appointment Request - ${appointmentData.patientName}`
          const emailMessage = `Dear Dr. ${appointmentData.doctorName},\n\n` +
            `You have received a new appointment request from ${appointmentData.patientName}.\n\n` +
            `Appointment Details:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Patient: ${appointmentData.patientName}\n` +
            `Date: ${formatDateForDisplay(normalizedDate)}\n` +
            `Time: ${appointmentData.time}\n` +
            `Type: ${appointmentData.type || "Consultation"}\n` +
            `Mode: ${appointmentData.mode === "online" ? "Online (Video Call)" : "In-person Visit"}\n` +
            (appointmentData.notes ? `Reason/Notes: ${appointmentData.notes}\n` : "") +
            `Status: Pending Approval\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Please log in to Smart Care to review and approve this appointment request.\n\n` +
            `Best regards,\n` +
            `Smart Care Team`
          
          sendEmailNotification(doctorDetails.email, emailSubject, emailMessage, appointmentData.doctorId).catch(err => {
            // Only log non-timeout errors for appointments
            if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
              console.error("Error sending email notification to doctor:", err)
            }
          })
          console.log(`✅ Email notification sent to doctor: ${doctorDetails.email}`)
        } else {
          console.warn(`⚠️ Doctor email not found. Could not send email notification to doctor ID: ${appointmentData.doctorId}`)
        }

        // Send in-app notification to doctor with patient's profile image
        await sendNotification(appointmentData.doctorId, {
          title: "New Appointment Request",
          message: `${appointmentData.patientName} has requested an appointment on ${formatDateForDisplay(normalizedDate)} at ${appointmentData.time}`,
          type: "appointment", // Changed to "appointment" to match dropdown filter
          actionLink: `/doctor/appointments`,
          actionText: "View Appointment",
          imageUrl: patientPhotoURL, // Patient's profile image
          metadata: {
            appointmentId: appointmentRef.id,
            patientId: appointmentData.patientId,
            patientName: appointmentData.patientName,
            patientPhotoURL: patientPhotoURL, // Store in metadata too
            date: normalizedDate,
            time: appointmentData.time,
            appointmentType: appointmentData.type || "Consultation",
            scheduledBy: "patient",
          },
        }).catch(err => {
          console.error("Error sending in-app notification to doctor:", err)
        })
        console.log(`✅ In-app notification sent to doctor (dropdown notification)`)

        // Push notification will be sent from client-side after appointment creation
        // Store notification data for client-side processing
      } catch (notifError) {
        console.error("Error sending notifications:", notifError)
        // Don't fail the appointment creation if notifications fail
      }
    } else if (appointmentData.createdBy === appointmentData.doctorId) {
      await logDoctorActivity(
        "Appointment Created",
        `Doctor created an appointment with patient (ID: ${appointmentData.patientId}) for ${normalizedDate}`,
        { id: appointmentData.doctorId },
      )

      // Send notifications to patient when doctor creates appointment
      try {
        // Get patient details for email
        const patientDetails = await getUserDetails(appointmentData.patientId)
        // Get doctor details to get their profile image
        const doctorDetails = await getUserDetails(appointmentData.doctorId)
        const doctorPhotoURL = doctorDetails?.photoURL || null
        
        if (patientDetails?.email) {
          // Send email notification to patient when doctor schedules follow-up
          const emailSubject = `Follow-up Appointment Scheduled - Dr. ${appointmentData.doctorName}`
          const emailMessage = `Dear ${appointmentData.patientName},\n\n` +
            `Dr. ${appointmentData.doctorName}${appointmentData.specialty ? ` (${appointmentData.specialty})` : ''} has scheduled a follow-up appointment for you.\n\n` +
            `Appointment Details:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Doctor: Dr. ${appointmentData.doctorName}${appointmentData.specialty ? ` (${appointmentData.specialty})` : ''}\n` +
            `Date: ${formatDateForDisplay(normalizedDate)}\n` +
            `Time: ${appointmentData.time}\n` +
            `Type: Follow-up Appointment\n` +
            `Mode: ${appointmentData.mode === "online" ? "Online (Video Call)" : "In-person Visit"}\n` +
            (appointmentData.notes ? `Reason/Notes: ${appointmentData.notes}\n` : "") +
            `Status: Confirmed ✓\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `This appointment has been automatically confirmed. Please mark your calendar and ensure you are available at the scheduled time.\n\n` +
            `If you need to reschedule or cancel, please log in to Smart Care at least 24 hours before your appointment.\n\n` +
            `We look forward to seeing you.\n\n` +
            `Best regards,\n` +
            `Smart Care Team`
          
          sendEmailNotification(patientDetails.email, emailSubject, emailMessage, appointmentData.patientId).catch(err => {
            // Only log non-timeout errors for appointments
            if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
              console.error("Error sending email notification to patient:", err)
            }
          })
          console.log(`✅ Email notification sent to patient: ${patientDetails.email}`)
        } else {
          console.warn(`⚠️ Patient email not found. Could not send email notification to patient ID: ${appointmentData.patientId}`)
        }

        // Send in-app notification to patient with doctor's profile image
        await sendNotification(appointmentData.patientId, {
          title: "Appointment Scheduled",
          message: `Dr. ${appointmentData.doctorName} has scheduled you for a follow-up appointment on ${formatDateForDisplay(normalizedDate)} at ${appointmentData.time}. The appointment has been automatically confirmed.`,
          type: "appointment", // Use "appointment" type so it shows in dropdown filter
          actionLink: `/dashboard/appointments`,
          actionText: "View Appointment",
          imageUrl: doctorPhotoURL, // Doctor's profile image
          metadata: {
            appointmentId: appointmentRef.id,
            doctorId: appointmentData.doctorId,
            doctorName: appointmentData.doctorName,
            doctorPhotoURL: doctorPhotoURL, // Store in metadata too
            date: normalizedDate,
            time: appointmentData.time,
            status: "approved",
            scheduledBy: "doctor",
            appointmentType: "Follow-up",
          },
        }).catch(err => {
          console.error("Error sending in-app notification to patient:", err)
        })
        console.log(`✅ In-app notification sent to patient (dropdown notification)`)

        // Push notification will be sent from client-side after appointment creation
        // Store notification data for client-side processing
      } catch (notifError) {
        console.error("Error sending notifications to patient:", notifError)
        // Don't fail the appointment creation if notifications fail
      }
    }

    return appointmentRef.id
  } catch (error) {
    console.error("Error creating appointment:", error)
    throw error
  }
}

// Get appointments for a specific user (patient or doctor)
export const getUserAppointments = (userId, userRole, callback) => {
  if (!userId) {
    console.error("User ID is required")
    callback([])
    return () => {}
  }

  try {
    // Query based on user role
    const fieldToQuery = userRole === "doctor" ? "doctorId" : "patientId"

    const q = query(collection(db, "appointments"), where(fieldToQuery, "==", userId), orderBy("date", "asc"))

    return onSnapshot(
      q,
      (querySnapshot) => {
        const appointmentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Check for appointments that need to be marked as completed
        const currentTime = new Date()
        const updatedAppointments = appointmentsData.map((appointment) => {
          if (appointment.status === "approved" || appointment.status === "confirmed") {
            const appointmentDateTime = parseAppointmentDateTime(appointment.date, appointment.time)
            if (appointmentDateTime && currentTime > appointmentDateTime) {
              // This is a past appointment that should be marked as completed
              // We'll update it in Firestore and return the updated version
              updateAppointmentToCompleted(appointment.id)
              return { ...appointment, status: "completed", autoCompleted: true }
            }
          }
          return appointment
        })

        callback(updatedAppointments)
      },
      (error) => {
        console.error("Error getting appointments:", error)
        callback([])
      },
    )
  } catch (error) {
    console.error("Error setting up appointments listener:", error)
    callback([])
    return () => {}
  }
}

// Helper function to parse appointment date and time into a JavaScript Date object
export const parseAppointmentDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null

  try {
    // Parse the time string (e.g., "11:00 AM")
    const timeParts = timeStr.match(/(\d+):(\d+)\s*([AP]M)/i)
    if (!timeParts) return null

    let hours = Number.parseInt(timeParts[1], 10)
    const minutes = Number.parseInt(timeParts[2], 10)
    const ampm = timeParts[3].toUpperCase()

    // Convert to 24-hour format
    if (ampm === "PM" && hours < 12) hours += 12
    if (ampm === "AM" && hours === 12) hours = 0

    // Create a date object with the appointment date and time
    const appointmentDate = new Date(dateStr)
    appointmentDate.setHours(hours, minutes, 0, 0)

    return appointmentDate
  } catch (error) {
    console.error("Error parsing appointment date/time:", error)
    return null
  }
}

// Helper function to update an appointment to completed status in Firestore
const updateAppointmentToCompleted = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId)
    await updateDoc(appointmentRef, {
      status: "completed",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      autoCompleted: true,
    })
    console.log(`Appointment ${appointmentId} automatically marked as completed`)
    return true
  } catch (error) {
    console.error(`Error updating appointment ${appointmentId} to completed:`, error)
    return false
  }
}

// Get a specific appointment by ID
export const getAppointmentById = async (appointmentId) => {
  try {
    if (!appointmentId) {
      throw new Error("Appointment ID is required")
    }

    const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId))

    if (appointmentDoc.exists()) {
      return { id: appointmentDoc.id, ...appointmentDoc.data() }
    } else {
      throw new Error("Appointment not found")
    }
  } catch (error) {
    console.error("Error getting appointment:", error)
    throw error
  }
}

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status, note = "", cancelledBy = null) => {
  try {
    if (!appointmentId) {
      throw new Error("Appointment ID is required")
    }

    const appointmentRef = doc(db, "appointments", appointmentId)
    const appointmentDoc = await getDoc(appointmentRef)

    if (!appointmentDoc.exists()) {
      throw new Error("Appointment not found")
    }

    const appointmentData = appointmentDoc.data()
    
    // Check if this is a decline (doctor cancelling/declining a pending appointment)
    const isDecline = cancelledBy === "doctor" && appointmentData.status === "pending" && status === "cancelled"
    
    // If it's a decline, change status to "declined" instead of "cancelled"
    const finalStatus = isDecline ? "declined" : status
    
    const updateData = {
      status: finalStatus,
      updatedAt: serverTimestamp(),
    }

    // Determine who needs to be notified based on who made the change
    if (finalStatus === "declined") {
      // If declined (doctor declined pending appointment), notify patient
      updateData.notifications = {
        patient: true,
        doctor: false,
      }
    } else if (finalStatus === "cancelled") {
      // If cancelled (approved appointment cancelled), notify the other party
      updateData.notifications = {
        patient: cancelledBy === "patient" ? false : true, // Notify patient if doctor cancelled
        doctor: cancelledBy === "doctor" ? false : true, // Notify doctor if patient cancelled
      }
    } else if (finalStatus === "approved") {
      // If approved, notify patient
      updateData.notifications = {
        patient: true,
        doctor: false,
      }
    } else {
      // For other statuses, notify both parties
      updateData.notifications = {
        patient: true,
        doctor: true,
      }
    }

    // Add note if provided
    if (note) {
      updateData.note = note
    }

    // If declining, add declined timestamp
    if (finalStatus === "declined") {
      updateData.declinedAt = serverTimestamp()
      updateData.declinedBy = "doctor"
    }
    // If cancelling, add cancellation timestamp and cancelledBy
    else if (finalStatus === "cancelled") {
      updateData.cancelledAt = serverTimestamp()
      if (cancelledBy) {
        updateData.cancelledBy = cancelledBy
      }
    }

    // If approving, add approval timestamp
    if (status === "approved") {
      updateData.approvedAt = serverTimestamp()
    }

    // If completing, add completion timestamp
    if (status === "completed") {
      updateData.completedAt = serverTimestamp()
    }

    await updateDoc(appointmentRef, updateData)

    // Log the appointment status update
    const actionMap = {
      approved: "Appointment Approved",
      declined: "Appointment Declined",
      cancelled: "Appointment Cancelled",
      completed: "Appointment Completed",
      pending: "Appointment Status Changed",
      confirmed: "Appointment Confirmed",
    }

    // Log activity based on who made the change
    if (cancelledBy === "doctor") {
      const actionText = finalStatus === "declined" 
        ? "declined" 
        : finalStatus === "cancelled" 
          ? "cancelled" 
          : "updated"
      await logDoctorActivity(
        actionMap[finalStatus] || "Appointment Status Updated",
        `Doctor ${actionText} appointment status to ${finalStatus} for patient (ID: ${appointmentData.patientId})`,
        { id: appointmentData.doctorId },
      )
    } else if (cancelledBy === "patient") {
      await logPatientActivity(
        actionMap[finalStatus] || "Appointment Status Updated",
        `Patient ${finalStatus === "cancelled" ? "cancelled" : "updated"} appointment status to ${finalStatus} with doctor (ID: ${appointmentData.doctorId})`,
        { id: appointmentData.patientId },
      )
    } else {
      // Fallback to doctor logging if cancelledBy is not provided (backward compatibility)
      await logDoctorActivity(
        actionMap[finalStatus] || "Appointment Status Updated",
        `Doctor updated appointment status to ${finalStatus} for patient (ID: ${appointmentData.patientId})`,
        { id: appointmentData.doctorId },
      )
    }

    // Send notifications if appointment is approved
    if (status === "approved") {
      try {
        const patientDetails = await getUserDetails(appointmentData.patientId)
        const doctorDetails = await getUserDetails(appointmentData.doctorId)
        const doctorPhotoURL = doctorDetails?.photoURL || null

        // Send email notification to patient
        if (patientDetails?.email) {
          const emailSubject = `Appointment Approved - Dr. ${appointmentData.doctorName}`
          const emailMessage = `Dear ${appointmentData.patientName || "Patient"},\n\n` +
            `Great news! Your appointment request with Dr. ${appointmentData.doctorName}${appointmentData.specialty ? ` (${appointmentData.specialty})` : ''} has been approved and confirmed.\n\n` +
            `Appointment Details:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Doctor: Dr. ${appointmentData.doctorName}${appointmentData.specialty ? ` (${appointmentData.specialty})` : ''}\n` +
            `Date: ${formatDateForDisplay(appointmentData.date)}\n` +
            `Time: ${appointmentData.time}\n` +
            `Type: ${appointmentData.type || "Consultation"}\n` +
            `Mode: ${appointmentData.mode === "online" ? "Online (Video Call)" : "In-person Visit"}\n` +
            (note ? `Doctor's Note: ${note}\n` : "") +
            `Status: Approved ✓\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Please mark your calendar and ensure you are available at the scheduled time.\n\n` +
            (appointmentData.mode === "online" 
              ? `For online appointments, you will receive a call link before the scheduled time.\n\n`
              : `Please arrive a few minutes early for your appointment.\n\n`) +
            `If you need to reschedule or cancel, please log in to Smart Care at least 24 hours before your appointment.\n\n` +
            `We look forward to seeing you!\n\n` +
            `Best regards,\n` +
            `Smart Care Team`

          sendEmailNotification(patientDetails.email, emailSubject, emailMessage, appointmentData.patientId).catch(err => {
            // Only log non-timeout errors for appointments
            if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
              console.error("Error sending email notification to patient:", err)
            }
          })
          console.log(`✅ Email notification sent to patient: ${patientDetails.email}`)
        }

        // Send in-app notification to patient
        await sendNotification(appointmentData.patientId, {
          title: "Appointment Approved",
          message: `Your booking has been approved${note ? `. ${note}` : ''} on ${formatDateForDisplay(appointmentData.date)} at ${appointmentData.time}`,
          type: "appointment",
          actionLink: `/dashboard/appointments`,
          actionText: "View Appointment",
          imageUrl: doctorPhotoURL,
          metadata: {
            appointmentId: appointmentId,
            doctorId: appointmentData.doctorId,
            doctorName: appointmentData.doctorName,
            doctorPhotoURL: doctorPhotoURL,
            date: appointmentData.date,
            time: appointmentData.time,
            status: "approved",
            doctorNote: note,
          },
        }).catch(err => {
          console.error("Error sending in-app notification to patient:", err)
        })
        console.log(`✅ In-app notification sent to patient`)
      } catch (notifError) {
        console.error("Error sending approval notifications:", notifError)
        // Don't fail the approval if notifications fail
      }
    }

    // Send notifications if appointment is declined or cancelled
    if ((finalStatus === "declined" || finalStatus === "cancelled") && cancelledBy) {
      try {
        // Determine who to notify
        const notifyPatient = cancelledBy === "doctor"
        const notifyDoctor = cancelledBy === "patient"

        // Check if this is a decline
        const isDecline = finalStatus === "declined"

        if (notifyPatient) {
          // Doctor cancelled - notify patient
          const patientDetails = await getUserDetails(appointmentData.patientId)
          const doctorDetails = await getUserDetails(appointmentData.doctorId)
          const doctorPhotoURL = doctorDetails?.photoURL || null

          // Send email notification to patient
          if (patientDetails?.email) {
            const emailSubject = isDecline 
              ? `Appointment Request Declined - Dr. ${appointmentData.doctorName}`
              : `Appointment Cancelled - Dr. ${appointmentData.doctorName}`
            const emailMessage = `Dear ${appointmentData.patientName || "Patient"},\n\n` +
              (isDecline 
                ? `We regret to inform you that your appointment request with Dr. ${appointmentData.doctorName}${appointmentData.specialty ? ` (${appointmentData.specialty})` : ''} has been declined.\n\n`
                : `We regret to inform you that your appointment with Dr. ${appointmentData.doctorName}${appointmentData.specialty ? ` (${appointmentData.specialty})` : ''} has been cancelled.\n\n`) +
              `Appointment Details:\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `Doctor: Dr. ${appointmentData.doctorName}${appointmentData.specialty ? ` (${appointmentData.specialty})` : ''}\n` +
              `Date: ${formatDateForDisplay(appointmentData.date)}\n` +
              `Time: ${appointmentData.time}\n` +
              `Type: ${appointmentData.type || "Consultation"}\n` +
              (note ? `${isDecline ? "Decline Reason" : "Cancellation Reason"}: ${note}\n` : "") +
              `Status: ${isDecline ? "Declined" : "Cancelled"}\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `Please log in to Smart Care to ${isDecline ? "book a new appointment" : "reschedule your appointment"} if needed.\n\n` +
              `We apologize for any inconvenience.\n\n` +
              `Best regards,\n` +
              `Smart Care Team`

            sendEmailNotification(patientDetails.email, emailSubject, emailMessage, appointmentData.patientId)
              .then(() => {
                console.log(`✅ Email notification sent to patient${isDecline ? ' (DECLINED)' : ' (CANCELLED)'}: ${patientDetails.email}`)
              })
              .catch(err => {
                // Only log non-timeout errors for appointments
                if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
                  console.error(`❌ Error sending email notification to patient${isDecline ? ' (DECLINED)' : ' (CANCELLED)'}:`, err)
                }
              })
          } else {
            console.warn(`⚠️ Patient email not found. Could not send ${isDecline ? 'decline' : 'cancellation'} email notification to patient ID: ${appointmentData.patientId}`)
          }

          // Send in-app notification to patient
          // Use the isDecline variable defined above (line 532)
          await sendNotification(appointmentData.patientId, {
            title: isDecline ? "Appointment Request Declined" : "Appointment Cancelled",
            message: isDecline
              ? `Your booking was declined${note ? ` due to ${note}` : ''} on ${formatDateForDisplay(appointmentData.date)} at ${appointmentData.time}`
              : `Dr. ${appointmentData.doctorName} has cancelled your appointment on ${formatDateForDisplay(appointmentData.date)} at ${appointmentData.time}${note ? `. Reason: ${note}` : ''}`,
            type: "appointment",
            actionLink: `/dashboard/appointments`,
            actionText: "View Appointments",
            imageUrl: doctorPhotoURL,
            metadata: {
              appointmentId: appointmentId,
              doctorId: appointmentData.doctorId,
              doctorName: appointmentData.doctorName,
              doctorPhotoURL: doctorPhotoURL,
              date: appointmentData.date,
              time: appointmentData.time,
              status: finalStatus,
              cancelledBy: isDecline ? null : "doctor",
              declinedBy: isDecline ? "doctor" : null,
              isDecline: isDecline,
              cancellationReason: note,
              declineReason: note,
            },
          }).catch(err => {
            console.error("Error sending in-app notification to patient:", err)
          })
          console.log(`✅ In-app notification sent to patient`)
        }

        if (notifyDoctor) {
          // Patient cancelled - notify doctor
          const doctorDetails = await getUserDetails(appointmentData.doctorId)
          const patientDetails = await getUserDetails(appointmentData.patientId)
          const patientPhotoURL = patientDetails?.photoURL || null

          // Send email notification to doctor
          if (doctorDetails?.email) {
            const emailSubject = `Appointment Cancelled - ${appointmentData.patientName || "Patient"}`
            const emailMessage = `Dear Dr. ${appointmentData.doctorName},\n\n` +
              `${appointmentData.patientName || "A patient"} has cancelled their appointment with you.\n\n` +
              `Appointment Details:\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `Patient: ${appointmentData.patientName || "Patient"}\n` +
              `Date: ${formatDateForDisplay(appointmentData.date)}\n` +
              `Time: ${appointmentData.time}\n` +
              `Type: ${appointmentData.type || "Consultation"}\n` +
              (note ? `Cancellation Reason: ${note}\n` : "") +
              `Status: Cancelled\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `Please log in to Smart Care to view your updated schedule.\n\n` +
              `Best regards,\n` +
              `Smart Care Team`

            sendEmailNotification(doctorDetails.email, emailSubject, emailMessage, appointmentData.doctorId).catch(err => {
              // Only log non-timeout errors for appointments
              if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
                console.error("Error sending email notification to doctor:", err)
              }
            })
            console.log(`✅ Email notification sent to doctor: ${doctorDetails.email}`)
          }

          // Send in-app notification to doctor
          await sendNotification(appointmentData.doctorId, {
            title: "Appointment Cancelled",
            message: `${appointmentData.patientName || "Patient"} has cancelled their appointment on ${formatDateForDisplay(appointmentData.date)} at ${appointmentData.time}${note ? `. Reason: ${note}` : ''}`,
            type: "appointment",
            actionLink: `/doctor/appointments`,
            actionText: "View Appointments",
            imageUrl: patientPhotoURL,
            metadata: {
              appointmentId: appointmentId,
              patientId: appointmentData.patientId,
              patientName: appointmentData.patientName,
              patientPhotoURL: patientPhotoURL,
              date: appointmentData.date,
              time: appointmentData.time,
              status: "cancelled",
              cancelledBy: "patient",
              cancellationReason: note,
            },
          }).catch(err => {
            console.error("Error sending in-app notification to doctor:", err)
          })
          console.log(`✅ In-app notification sent to doctor`)
        }
      } catch (notifError) {
        console.error("Error sending cancellation notifications:", notifError)
        // Don't fail the cancellation if notifications fail
      }
    }

    return true
  } catch (error) {
    console.error("Error updating appointment status:", error)
    throw error
  }
}

// Reschedule an appointment
export const rescheduleAppointment = async (appointmentId, newDate, newTime, notes = "", rescheduledByRole = null, rescheduledById = null) => {
  try {
    if (!appointmentId || !newDate || !newTime) {
      throw new Error("Missing required parameters for rescheduling")
    }

    const appointmentRef = doc(db, "appointments", appointmentId)
    const appointmentDoc = await getDoc(appointmentRef)

    if (!appointmentDoc.exists()) {
      throw new Error("Appointment not found")
    }

    const appointmentData = appointmentDoc.data()

    // Normalize the date to prevent timezone issues
    const normalizedDate = normalizeDate(newDate)

    // Determine who rescheduled (check rescheduledById against patientId and doctorId)
    const isPatientRescheduling = rescheduledById === appointmentData.patientId
    const isDoctorRescheduling = rescheduledById === appointmentData.doctorId
    const rescheduledBy = rescheduledByRole || (isPatientRescheduling ? "patient" : "doctor")

    // Prepare update data
    const updateData = {
      date: normalizedDate,
      time: newTime,
      status: "pending", // Reset to pending when rescheduled
      updatedAt: serverTimestamp(),
      rescheduledAt: serverTimestamp(),
      rescheduledBy: rescheduledBy,
      rescheduledById: rescheduledById || (rescheduledBy === "patient" ? appointmentData.patientId : appointmentData.doctorId),
      notifications: {
        patient: true,
        doctor: true,
      },
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = notes
    }

    await updateDoc(appointmentRef, updateData)

    // Log the appointment rescheduling
    if (rescheduledBy === "patient") {
      await logPatientActivity(
        "Appointment Rescheduled",
        `Patient rescheduled appointment with doctor (ID: ${appointmentData.doctorId}) to ${normalizedDate} at ${newTime}`,
        { id: appointmentData.patientId },
      )
    } else {
      await logDoctorActivity(
        "Appointment Rescheduled",
        `Doctor rescheduled appointment with patient (ID: ${appointmentData.patientId}) to ${normalizedDate} at ${newTime}`,
        { id: appointmentData.doctorId },
      )
    }

    // Send notifications to the other party (email, in-app, and push)
    try {
      const formattedDate = formatDateForDisplay(normalizedDate)
      const oldDate = formatDateForDisplay(appointmentData.date)
      const oldTime = appointmentData.time
      const reasonText = notes ? `\nReason: ${notes}` : ""

      if (rescheduledBy === "patient") {
        // Patient rescheduled - notify doctor
        const doctorDetails = await getUserDetails(appointmentData.doctorId)
        const doctorPhotoURL = doctorDetails?.photoURL || null
        const patientDetails = await getUserDetails(appointmentData.patientId)
        const patientPhotoURL = patientDetails?.photoURL || null
        const patientName = appointmentData.patientName || patientDetails?.displayName || patientDetails?.name || "Patient"

        // Send email notification to doctor
        if (doctorDetails?.email) {
          const emailSubject = `Appointment Rescheduled by ${patientName}`
          const emailMessage = `Dear Dr. ${appointmentData.doctorName || "Doctor"},\n\n` +
            `${patientName} has rescheduled your appointment.\n\n` +
            `Original Appointment:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Date: ${oldDate}\n` +
            `Time: ${oldTime}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `New Appointment:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Date: ${formattedDate}\n` +
            `Time: ${newTime}\n` +
            `Mode: ${appointmentData.mode === "online" ? "Online (Video Call)" : "In-person Visit"}\n` +
            `${reasonText}\n` +
            `Status: Pending Approval\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Please log in to Smart Care to review and approve this rescheduled appointment.\n\n` +
            `Best regards,\n` +
            `Smart Care Team`

          sendEmailNotification(doctorDetails.email, emailSubject, emailMessage, appointmentData.doctorId).catch(err => {
            // Only log non-timeout errors
            if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
              console.error("Error sending email notification to doctor:", err)
            }
          })
          console.log(`✅ Email notification sent to doctor: ${doctorDetails.email}`)
        }

        // Send in-app notification to doctor
        await sendNotification(appointmentData.doctorId, {
          title: "Appointment Rescheduled",
          message: `${patientName} rescheduled your appointment from ${oldDate} at ${oldTime} to ${formattedDate} at ${newTime}. Please review and approve.`,
          type: "appointment",
          actionLink: `/doctor/appointments`,
          actionText: "View Appointment",
          imageUrl: patientPhotoURL,
          metadata: {
            appointmentId: appointmentId,
            patientId: appointmentData.patientId,
            patientName: patientName,
            patientPhotoURL: patientPhotoURL,
            doctorId: appointmentData.doctorId,
            date: normalizedDate,
            time: newTime,
            oldDate: appointmentData.date,
            oldTime: oldTime,
            status: "pending",
            rescheduledBy: "patient",
            notes: notes || null,
          },
        }).catch(err => {
          console.error("Error sending in-app notification to doctor:", err)
        })
        console.log(`✅ In-app notification sent to doctor`)

        // Send push notification to doctor
        await sendPushNotification("Appointment Rescheduled", {
          body: `${patientName} rescheduled your appointment to ${formattedDate} at ${newTime}`,
          tag: "appointment-rescheduled",
          icon: patientPhotoURL || "/SmartCare.png",
          badge: "/SmartCare.png",
          data: {
            url: "/doctor/appointments",
            appointmentId: appointmentId,
            patientId: appointmentData.patientId,
            patientName: patientName,
            date: normalizedDate,
            time: newTime,
            status: "pending",
            rescheduledBy: "patient",
          },
        }).catch(err => {
          console.error("Error sending push notification to doctor:", err)
        })
        console.log(`✅ Push notification sent to doctor`)
      } else {
        // Doctor rescheduled - notify patient
        const patientDetails = await getUserDetails(appointmentData.patientId)
        const patientEmail = patientDetails?.email
        const patientPhotoURL = patientDetails?.photoURL || null
        const doctorDetails = await getUserDetails(appointmentData.doctorId)
        const doctorPhotoURL = doctorDetails?.photoURL || null
        const doctorName = appointmentData.doctorName || doctorDetails?.displayName || "Doctor"
        const patientName = appointmentData.patientName || patientDetails?.displayName || patientDetails?.name || "Patient"

        // Send email notification to patient
        if (patientEmail) {
          const emailSubject = `Appointment Rescheduled by Dr. ${doctorName}`
          const emailMessage = `Dear ${patientName},\n\n` +
            `Dr. ${doctorName} has rescheduled your appointment.\n\n` +
            `Original Appointment:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Date: ${oldDate}\n` +
            `Time: ${oldTime}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `New Appointment:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Date: ${formattedDate}\n` +
            `Time: ${newTime}\n` +
            `Mode: ${appointmentData.mode === "online" ? "Online (Video Call)" : "In-person Visit"}\n` +
            `${reasonText}\n` +
            `Status: Pending Approval\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Please log in to Smart Care to confirm this rescheduled appointment.\n\n` +
            `Best regards,\n` +
            `Smart Care Team`

          sendEmailNotification(patientEmail, emailSubject, emailMessage, appointmentData.patientId).catch(err => {
            // Only log non-timeout errors
            if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
              console.error("Error sending email notification to patient:", err)
            }
          })
          console.log(`✅ Email notification sent to patient: ${patientEmail}`)
        }

        // Send in-app notification to patient
        await sendNotification(appointmentData.patientId, {
          title: "Appointment Rescheduled",
          message: `Dr. ${doctorName} rescheduled your appointment from ${oldDate} at ${oldTime} to ${formattedDate} at ${newTime}. Please review and confirm.`,
          type: "appointment",
          actionLink: `/dashboard/appointments`,
          actionText: "View Appointment",
          imageUrl: doctorPhotoURL,
          metadata: {
            appointmentId: appointmentId,
            doctorId: appointmentData.doctorId,
            doctorName: doctorName,
            doctorPhotoURL: doctorPhotoURL,
            patientId: appointmentData.patientId,
            date: normalizedDate,
            time: newTime,
            oldDate: appointmentData.date,
            oldTime: oldTime,
            status: "pending",
            rescheduledBy: "doctor",
            notes: notes || null,
          },
        }).catch(err => {
          console.error("Error sending in-app notification to patient:", err)
        })
        console.log(`✅ In-app notification sent to patient`)

        // Send push notification to patient
        await sendPushNotification("Appointment Rescheduled", {
          body: `Dr. ${doctorName} rescheduled your appointment to ${formattedDate} at ${newTime}`,
          tag: "appointment-rescheduled",
          icon: doctorPhotoURL || "/SmartCare.png",
          badge: "/SmartCare.png",
          data: {
            url: "/dashboard/appointments",
            appointmentId: appointmentId,
            doctorId: appointmentData.doctorId,
            doctorName: doctorName,
            date: normalizedDate,
            time: newTime,
            status: "pending",
            rescheduledBy: "doctor",
          },
        }).catch(err => {
          console.error("Error sending push notification to patient:", err)
        })
        console.log(`✅ Push notification sent to patient`)
      }
    } catch (notifError) {
      console.error("Error sending reschedule notifications:", notifError)
      // Don't fail the rescheduling if notifications fail
    }

    return true
  } catch (error) {
    console.error("Error rescheduling appointment:", error)
    throw error
  }
}

// Check and update appointment status based on date/time
export const checkAndUpdateAppointmentStatus = async (appointment) => {
  try {
    if (!appointment || !appointment.id) return false

    // Only process appointments that are approved/confirmed and not yet completed
    if (appointment.status !== "approved" && appointment.status !== "confirmed") return false

    const appointmentDateTime = parseAppointmentDateTime(appointment.date, appointment.time)
    if (!appointmentDateTime) return false

    const currentDate = new Date()

    // If current time is past the appointment time, mark as completed
    if (currentDate > appointmentDateTime) {
      const appointmentRef = doc(db, "appointments", appointment.id)

      await updateDoc(appointmentRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        autoCompleted: true, // Flag to indicate this was automatically completed
      })

      console.log(`Appointment ${appointment.id} automatically marked as completed`)
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking and updating appointment status:", error)
    return false
  }
}

// Add this function to batch check and update multiple appointments
export const batchCheckAppointmentStatus = async (appointments) => {
  if (!appointments || !appointments.length) return []

  const updatedAppointments = []
  const currentTime = new Date()

  for (const appointment of appointments) {
    // Only check appointments that are approved/confirmed
    if (appointment.status !== "approved" && appointment.status !== "confirmed") continue

    const appointmentDateTime = parseAppointmentDateTime(appointment.date, appointment.time)
    if (!appointmentDateTime) continue

    // If current time is past the appointment time, mark as completed
    if (currentTime > appointmentDateTime) {
      const wasUpdated = await updateAppointmentToCompleted(appointment.id)
      if (wasUpdated) {
        updatedAppointments.push({
          ...appointment,
          status: "completed",
          autoCompleted: true,
        })
      }
    }
  }

  return updatedAppointments
}

// Add this function to determine if an appointment is eligible for video call
export const isEligibleForVideoCall = (appointment, userRole = "patient") => {
  if (!appointment) return false

  // Only approved/confirmed appointments are eligible
  if (appointment.status !== "approved" && appointment.status !== "confirmed") return false

  // Check if it's a follow-up appointment (not an initial visit)
  const isFollowUp =
    appointment.type &&
    (appointment.type.toLowerCase().includes("follow") ||
      appointment.type.toLowerCase().includes("virtual") ||
      appointment.type.toLowerCase().includes("video") ||
      appointment.type.toLowerCase().includes("tele"))

  // Only allow video calls for follow-up appointments and only for doctors
  return isFollowUp && userRole === "doctor"
}

// Get available time slots for a doctor on a specific date
export const getAvailableTimeSlots = async (doctorId, date) => {
  try {
    if (!doctorId || !date) {
      console.error("Missing required parameters for getAvailableTimeSlots")
      return {
        available: [],
        unavailable: [],
        isFullyBooked: false,
        isDateUnavailable: false,
        unavailableDates: [],
      }
    }

    // Normalize the date to prevent timezone issues
    const normalizedDate = normalizeDate(date)

    // Check if the date is unavailable for the doctor
    let unavailableDates = []
    try {
      const unavailableDatesDoc = await getDoc(doc(db, "doctorAvailability", doctorId))
      if (unavailableDatesDoc.exists()) {
        // Get the raw unavailable dates
        const rawUnavailableDates = unavailableDatesDoc.data().unavailableDates || []

        // Normalize each date to prevent timezone issues
        unavailableDates = rawUnavailableDates.map((d) => normalizeDate(d))
      }
    } catch (error) {
      console.error("Error getting doctor availability:", error)
      // Continue with empty unavailable dates if there's an error
    }

    // Check if the normalized date is unavailable
    if (unavailableDates.includes(normalizedDate)) {
      return {
        available: [],
        unavailable: [],
        isDateUnavailable: true,
        isFullyBooked: false,
        unavailableDates,
      }
    }

    // Get booked appointments for this doctor on this date
    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId),
      where("date", "==", normalizedDate),
      where("status", "in", ["pending", "approved"]), // Only consider pending and approved appointments
    )

    const querySnapshot = await getDocs(q)
    const bookedTimeSlots = []

    querySnapshot.forEach((doc) => {
      bookedTimeSlots.push(doc.data().time)
    })

    // Filter out booked time slots
    const availableTimeSlots = allTimeSlots.filter((slot) => !bookedTimeSlots.includes(slot))

    // Create a list of unavailable slots with reasons
    const unavailableTimeSlots = bookedTimeSlots.map((slot) => ({
      time: slot,
      reason: "Already Booked",
    }))

    // Check if the day is fully booked
    const isFullyBooked = availableTimeSlots.length === 0 && bookedTimeSlots.length > 0

    return {
      available: availableTimeSlots,
      unavailable: unavailableTimeSlots,
      isFullyBooked,
      isDateUnavailable: false,
      unavailableDates,
    }
  } catch (error) {
    console.error("Error getting available time slots:", error)
    // Return empty results if there's an error
    return {
      available: [],
      unavailable: [],
      isFullyBooked: false,
      isDateUnavailable: false,
      unavailableDates: [],
    }
  }
}

// Set doctor availability
export const setDoctorAvailability = async (doctorId, unavailableDates) => {
  try {
    if (!doctorId) {
      throw new Error("Doctor ID is required")
    }

    // Normalize each date to prevent timezone issues
    const normalizedDates = unavailableDates.map((date) => normalizeDate(date))

    const availabilityRef = doc(db, "doctorAvailability", doctorId)

    await updateDoc(availabilityRef, {
      unavailableDates: normalizedDates,
      updatedAt: serverTimestamp(),
    }).catch(async (error) => {
      // If document doesn't exist, create it
      if (error.code === "not-found") {
        await setDoc(availabilityRef, {
          doctorId,
          unavailableDates: normalizedDates,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } else {
        throw error
      }
    })

    // Log the availability update
    await logDoctorActivity(
      "Availability Updated",
      `Doctor updated their availability schedule (${normalizedDates.length} unavailable dates)`,
      { id: doctorId },
    )

    return true
  } catch (error) {
    console.error("Error setting doctor availability:", error)
    throw error
  }
}

// Get doctor availability
export const getDoctorAvailability = async (doctorId) => {
  try {
    if (!doctorId) {
      throw new Error("Doctor ID is required")
    }

    const availabilityDoc = await getDoc(doc(db, "doctorAvailability", doctorId))

    if (availabilityDoc.exists()) {
      return availabilityDoc.data().unavailableDates || []
    } else {
      return []
    }
  } catch (error) {
    console.error("Error getting doctor availability:", error)
    return [] // Return empty array on error
  }
}

// Get all doctors with their availability
export const getAllDoctors = async () => {
  try {
    // First, get all users with role "doctor"
    const q = query(collection(db, "users"), where("role", "==", "doctor"))
    const querySnapshot = await getDocs(q)
    const doctors = []

    // Process each doctor
    for (const docSnapshot of querySnapshot.docs) {
      const doctorData = docSnapshot.data()
      let availability = []

      // Try to get doctor's availability
      try {
        const unavailableDatesDoc = await getDoc(doc(db, "doctorAvailability", docSnapshot.id))
        if (unavailableDatesDoc.exists()) {
          availability = unavailableDatesDoc.data().unavailableDates || []
        }
      } catch (error) {
        console.error(`Error getting availability for doctor ${docSnapshot.id}:`, error)
        // Continue with empty availability
      }

      doctors.push({
        id: docSnapshot.id,
        name: doctorData.displayName || "Unknown Doctor",
        specialty: doctorData.specialty || "General Practitioner",
        photoURL: doctorData.photoURL || null,
        unavailableDates: availability,
      })
    }

    return doctors
  } catch (error) {
    console.error("Error getting all doctors:", error)
    return [] // Return empty array on error
  }
}

// Mark appointment notifications as read
export const markAppointmentNotificationsAsRead = async (appointmentId, userRole) => {
  try {
    if (!appointmentId || !userRole) {
      throw new Error("Appointment ID and user role are required")
    }

    const appointmentRef = doc(db, "appointments", appointmentId)
    const appointmentDoc = await getDoc(appointmentRef)

    if (!appointmentDoc.exists()) {
      throw new Error("Appointment not found")
    }

    const notifications = appointmentDoc.data().notifications || {}

    // Update only the notification for the current user role
    notifications[userRole] = false

    await updateDoc(appointmentRef, {
      notifications,
    })

    return true
  } catch (error) {
    console.error("Error marking appointment notifications as read:", error)
    throw error
  }
}

// Get appointment counts by status for a user
export const getAppointmentCounts = async (userId, userRole) => {
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
      completed: 0,
      cancelled: 0,
      total: 0,
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    querySnapshot.forEach((doc) => {
      const appointment = doc.data()
      counts.total++

      // Count by status
      if (appointment.status) {
        counts[appointment.status]++
      }

      // Count upcoming (approved appointments with future dates)
      if (appointment.status === "approved") {
        const appointmentDate = new Date(appointment.date)
        if (appointmentDate >= today) {
          counts.upcoming++
        }
      }
    })

    return counts
  } catch (error) {
    console.error("Error getting appointment counts:", error)
    return {
      upcoming: 0,
      pending: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    } // Return empty counts on error
  }
}

// Get all available patients for doctor to message
export const getAvailablePatients = async (doctorId = null) => {
  try {
    // First get all patients
    const q = query(collection(db, "users"), where("role", "==", "patient"), limit(50))

    const querySnapshot = await getDocs(q)
    const allPatients = []

    querySnapshot.forEach((doc) => {
      allPatients.push({ id: doc.id, ...doc.data() })
    })

    // If doctorId is provided, filter to only show patients with completed appointments with this doctor
    if (doctorId) {
      try {
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("doctorId", "==", doctorId),
          where("status", "==", "completed"),
          limit(100) // Get up to 100 completed appointments
        )

        const appointmentsSnapshot = await getDocs(appointmentsQuery)
        const patientIdsWithCompletedAppointments = new Set()
        
        appointmentsSnapshot.forEach((appointmentDoc) => {
          const appointmentData = appointmentDoc.data()
          if (appointmentData.patientId) {
            patientIdsWithCompletedAppointments.add(appointmentData.patientId)
          }
        })

        // Filter patients to only those with completed appointments
        const filteredPatients = allPatients.filter(patient => 
          patientIdsWithCompletedAppointments.has(patient.id)
        )

        return filteredPatients
      } catch (appointmentsError) {
        console.error("Error filtering patients by completed appointments:", appointmentsError)
        // Return all patients if filtering fails
        return allPatients
      }
    }

    // If no doctorId, return all patients (for admin or other use cases)
    return allPatients
  } catch (error) {
    console.error("Error getting available patients:", error)
    return [] // Return empty array on error
  }
}

// Check if an appointment has a summary
export const hasSummary = (appointment) => {
  if (!appointment || !appointment.summary) return false

  const { summary } = appointment
  return !!(
    summary.diagnosis ||
    summary.recommendations ||
    summary.followUp
  )
}

// Update appointment summary
export const updateAppointmentSummary = async (appointmentId, summaryData) => {
  try {
    if (!appointmentId) {
      throw new Error("Appointment ID is required")
    }

    const appointmentRef = doc(db, "appointments", appointmentId)
    const appointmentDoc = await getDoc(appointmentRef)

    if (!appointmentDoc.exists()) {
      throw new Error("Appointment not found")
    }

    const appointmentData = appointmentDoc.data()

    // Update the appointment with the summary data
    await updateDoc(appointmentRef, {
      summary: summaryData,
      updatedAt: serverTimestamp(),
    })

    // Log the summary addition
    await logDoctorActivity(
      "Appointment Summary Added",
      `Doctor added summary to appointment with patient (ID: ${appointmentData.patientId})`,
      { id: appointmentData.doctorId },
    )

    // Send notification to patient (in-app and push, no email)
    try {
      const doctorDetails = await getUserDetails(appointmentData.doctorId)
      const doctorPhotoURL = doctorDetails?.photoURL || null
      const formattedDate = formatDateForDisplay(appointmentData.date)

      // Send in-app notification to patient
      await sendNotification(appointmentData.patientId, {
        title: "Appointment Summary Available",
        message: `Your appointment summary with Dr. ${appointmentData.doctorName} from ${formattedDate} is now available.`,
        type: "appointment",
        actionLink: `/dashboard/appointments`,
        actionText: "View Summary",
        imageUrl: doctorPhotoURL,
        metadata: {
          appointmentId: appointmentId,
          doctorId: appointmentData.doctorId,
          doctorName: appointmentData.doctorName,
          doctorPhotoURL: doctorPhotoURL,
          patientId: appointmentData.patientId,
          patientName: appointmentData.patientName,
          date: appointmentData.date,
          time: appointmentData.time,
          status: "completed",
          hasSummary: true,
        },
      }).catch(err => {
        console.error("Error sending in-app notification to patient:", err)
      })
      console.log(`✅ In-app notification sent to patient`)

      // Send push notification to patient
      await sendPushNotification("Appointment Summary Available", {
        body: `Your appointment summary with Dr. ${appointmentData.doctorName} from ${formattedDate} is now available.`,
        tag: "appointment-summary",
        icon: doctorPhotoURL || "/SmartCare.png",
        badge: "/SmartCare.png",
        data: {
          url: "/dashboard/appointments",
          appointmentId: appointmentId,
          doctorId: appointmentData.doctorId,
          doctorName: appointmentData.doctorName,
          date: appointmentData.date,
          time: appointmentData.time,
        },
      }).catch(err => {
        console.error("Error sending push notification to patient:", err)
      })
      console.log(`✅ Push notification sent to patient`)
    } catch (notifError) {
      console.error("Error sending summary notifications:", notifError)
      // Don't fail the summary update if notifications fail
    }

    return true
  } catch (error) {
    console.error("Error updating appointment summary:", error)
    throw error
  }
}
