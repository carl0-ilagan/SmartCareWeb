import { db } from "./firebase"
import { collection, query, where, getDocs, orderBy, getDoc, doc, limit, Timestamp } from "firebase/firestore"

// Helper function to get date range timestamps
export const getDateRangeTimestamps = (range) => {
  const now = new Date()
  const endDate = new Date(now)
  let startDate = new Date(now)

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0)
      break
    case "this_week":
      startDate.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
      startDate.setHours(0, 0, 0, 0)
      break
    case "this_month":
      startDate.setDate(1) // Start of month
      startDate.setHours(0, 0, 0, 0)
      break
    case "last_month":
      startDate.setMonth(now.getMonth() - 1, 1) // 1st of previous month
      startDate.setHours(0, 0, 0, 0)
      endDate.setDate(0) // Last day of previous month
      endDate.setHours(23, 59, 59, 999)
      break
    case "last_3_months":
      startDate.setMonth(now.getMonth() - 3)
      startDate.setHours(0, 0, 0, 0)
      break
    case "last_6_months":
      startDate.setMonth(now.getMonth() - 6)
      startDate.setHours(0, 0, 0, 0)
      break
    case "this_year":
      startDate.setMonth(0, 1) // January 1st
      startDate.setHours(0, 0, 0, 0)
      break
    case "all_time":
    default:
      startDate = new Date(2020, 0, 1) // Default to a reasonable "all time" start date
      startDate.setHours(0, 0, 0, 0)
      break
  }

  return {
    startTimestamp: Timestamp.fromDate(startDate),
    endTimestamp: Timestamp.fromDate(endDate),
  }
}

// Get top rated doctors based on feedback with date range
export const getTopRatedDoctors = async (limitCount = 5, dateRange = "all_time") => {
  try {
    console.log(`Fetching top rated doctors for range: ${dateRange}...`)
    const { startTimestamp, endTimestamp } = getDateRangeTimestamps(dateRange)

    // First, get all doctors
    const usersRef = collection(db, "users")
    const doctorsQuery = query(usersRef, where("role", "==", "doctor"))
    const doctorsSnapshot = await getDocs(doctorsQuery)

    if (doctorsSnapshot.empty) {
      console.log("No doctors found")
      return []
    }

    const doctors = doctorsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Found ${doctors.length} doctors`)

    // Then, get all feedback for each doctor within the date range
    const feedbackRef = collection(db, "feedback")

    // Process each doctor to get their average rating
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        let doctorFeedbackQuery

        if (dateRange === "all_time") {
          doctorFeedbackQuery = query(feedbackRef, where("targetId", "==", doctor.id), where("type", "==", "doctor"))
        } else {
          doctorFeedbackQuery = query(
            feedbackRef,
            where("targetId", "==", doctor.id),
            where("type", "==", "doctor"),
            where("createdAt", ">=", startTimestamp),
            where("createdAt", "<=", endTimestamp),
          )
        }

        const feedbackSnapshot = await getDocs(doctorFeedbackQuery)

        if (feedbackSnapshot.empty) {
          return { ...doctor, averageRating: 0, feedbackCount: 0 }
        }

        const feedbacks = feedbackSnapshot.docs.map((doc) => doc.data())
        const totalRating = feedbacks.reduce((sum, feedback) => sum + (feedback.rating || 0), 0)
        const averageRating = totalRating / feedbacks.length

        return {
          ...doctor,
          averageRating: Number.parseFloat(averageRating.toFixed(1)),
          feedbackCount: feedbacks.length,
        }
      }),
    )

    // Sort by average rating and limit
    const result = doctorsWithRatings
      .filter((doctor) => doctor.feedbackCount > 0) // Only include doctors with feedback
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limitCount)

    console.log(`Returning ${result.length} top rated doctors for range: ${dateRange}`)
    return result
  } catch (error) {
    console.error("Error getting top rated doctors:", error)
    return []
  }
}

// Get most active patients with date range
export const getMostActivePatients = async (limitCount = 5, dateRange = "all_time") => {
  try {
    console.log(`Fetching most active patients for range: ${dateRange}...`)
    const { startTimestamp, endTimestamp } = getDateRangeTimestamps(dateRange)

    // Get activity logs for patients within date range
    const logsRef = collection(db, "activityLogs")
    let logsQuery

    if (dateRange === "all_time") {
      logsQuery = query(
        logsRef,
        where("userRole", "==", "patient"),
        orderBy("timestamp", "desc"),
        limit(500), // Limit to recent logs for performance
      )
    } else {
      logsQuery = query(
        logsRef,
        where("userRole", "==", "patient"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc"),
        limit(500),
      )
    }

    const logsSnapshot = await getDocs(logsQuery)

    if (logsSnapshot.empty) {
      console.log(`No activity logs found for range: ${dateRange}, creating mock data`)
      // If no logs exist, get patients and create mock data
      const usersRef = collection(db, "users")
      const patientsQuery = query(usersRef, where("role", "==", "patient"), limit(limitCount))
      const patientsSnapshot = await getDocs(patientsQuery)

      if (patientsSnapshot.empty) {
        return []
      }

      const patients = patientsSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          userId: doc.id,
          displayName: data.displayName || data.email || "Unknown Patient",
          email: data.email || "unknown@example.com",
          photoURL: data.photoURL || null,
          count: Math.floor(Math.random() * 50) + 10, // Random activity count between 10-60
          lastActivity: Timestamp.fromDate(new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))), // Random date in last week
        }
      })

      return patients.sort((a, b) => b.count - a.count)
    }

    // Count activities per patient
    const patientActivities = {}
    logsSnapshot.docs.forEach((doc) => {
      const log = doc.data()
      if (!patientActivities[log.userId]) {
        patientActivities[log.userId] = {
          userId: log.userId,
          userEmail: log.userEmail,
          userName: log.userName || "Unknown",
          count: 0,
          lastActivity: log.timestamp,
        }
      }
      patientActivities[log.userId].count++
    })

    // Convert to array, sort by count, and limit
    const sortedPatients = Object.values(patientActivities)
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount)

    // Get additional patient info
    const result = await Promise.all(
      sortedPatients.map(async (patient) => {
        try {
          const userDoc = await getDoc(doc(db, "users", patient.userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            return {
              ...patient,
              photoURL: userData.photoURL || null,
              displayName: userData.displayName || patient.userName || userData.email || "Unknown Patient",
              email: userData.email || patient.userEmail || "unknown@example.com",
            }
          }
          return patient
        } catch (e) {
          console.error(`Error getting user data for ${patient.userId}:`, e)
          return patient
        }
      }),
    )

    console.log(`Returning ${result.length} most active patients for range: ${dateRange}`)
    return result
  } catch (error) {
    console.error("Error getting most active patients:", error)
    return []
  }
}

// Get most active doctors with date range
export const getMostActiveDoctors = async (limitCount = 5, dateRange = "all_time") => {
  try {
    console.log(`Fetching most active doctors for range: ${dateRange}...`)
    const { startTimestamp, endTimestamp } = getDateRangeTimestamps(dateRange)

    // Get activity logs for doctors within date range
    const logsRef = collection(db, "activityLogs")
    let logsQuery

    if (dateRange === "all_time") {
      logsQuery = query(logsRef, where("userRole", "==", "doctor"), orderBy("timestamp", "desc"), limit(500))
    } else {
      logsQuery = query(
        logsRef,
        where("userRole", "==", "doctor"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc"),
        limit(500),
      )
    }

    const logsSnapshot = await getDocs(logsQuery)

    if (logsSnapshot.empty) {
      console.log(`No activity logs found for doctors in range: ${dateRange}, creating mock data`)
      // If no logs exist, get doctors and create mock data
      const usersRef = collection(db, "users")
      const doctorsQuery = query(usersRef, where("role", "==", "doctor"), limit(limitCount))
      const doctorsSnapshot = await getDocs(doctorsQuery)

      if (doctorsSnapshot.empty) {
        return []
      }

      const doctors = doctorsSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          userId: doc.id,
          displayName: data.displayName || data.email || "Unknown Doctor",
          email: data.email || "unknown@example.com",
          photoURL: data.photoURL || null,
          specialty: data.specialty || "General",
          count: Math.floor(Math.random() * 70) + 30, // Random activity count between 30-100
          lastActivity: Timestamp.fromDate(new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000))), // Random date in last 3 days
        }
      })

      return doctors.sort((a, b) => b.count - a.count)
    }

    // Count activities per doctor
    const doctorActivities = {}
    logsSnapshot.docs.forEach((doc) => {
      const log = doc.data()
      if (!doctorActivities[log.userId]) {
        doctorActivities[log.userId] = {
          userId: log.userId,
          userEmail: log.userEmail,
          userName: log.userName || "Unknown",
          count: 0,
          lastActivity: log.timestamp,
        }
      }
      doctorActivities[log.userId].count++
    })

    // Convert to array, sort by count, and limit
    const sortedDoctors = Object.values(doctorActivities)
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount)

    // Get additional doctor info
    const result = await Promise.all(
      sortedDoctors.map(async (doctor) => {
        try {
          const userDoc = await getDoc(doc(db, "users", doctor.userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            return {
              ...doctor,
              photoURL: userData.photoURL || null,
              displayName: userData.displayName || doctor.userName || userData.email || "Unknown Doctor",
              email: userData.email || doctor.userEmail || "unknown@example.com",
              specialty: userData.specialty || "General",
            }
          }
          return doctor
        } catch (e) {
          console.error(`Error getting user data for ${doctor.userId}:`, e)
          return doctor
        }
      }),
    )

    console.log(`Returning ${result.length} most active doctors for range: ${dateRange}`)
    return result
  } catch (error) {
    console.error("Error getting most active doctors:", error)
    return []
  }
}

// Get feedback category distribution with date range
export const getFeedbackCategoryDistribution = async (dateRange = "all_time") => {
  try {
    console.log(`Fetching feedback category distribution for range: ${dateRange}...`)
    const { startTimestamp, endTimestamp } = getDateRangeTimestamps(dateRange)

    const feedbackRef = collection(db, "feedback")
    let feedbackQuery

    if (dateRange === "all_time") {
      feedbackQuery = query(feedbackRef)
    } else {
      feedbackQuery = query(
        feedbackRef,
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
      )
    }

    const feedbackSnapshot = await getDocs(feedbackQuery)

    if (feedbackSnapshot.empty) {
      console.log(`No feedback found for range: ${dateRange}, creating mock data`)
      // Return mock data if no feedback exists
      return [
        { name: "Service Quality", count: 45, averageRating: 4.2, totalRating: 189 },
        { name: "Doctor Expertise", count: 38, averageRating: 4.7, totalRating: 178.6 },
        { name: "Communication", count: 32, averageRating: 3.9, totalRating: 124.8 },
        { name: "Appointment Process", count: 28, averageRating: 4.1, totalRating: 114.8 },
        { name: "App Experience", count: 22, averageRating: 4.3, totalRating: 94.6 },
      ]
    }

    // Count feedback by category
    const categories = {}
    feedbackSnapshot.docs.forEach((doc) => {
      const feedback = doc.data()
      const category = feedback.category || "General"

      if (!categories[category]) {
        categories[category] = {
          name: category,
          count: 0,
          averageRating: 0,
          totalRating: 0,
        }
      }

      categories[category].count++
      categories[category].totalRating += feedback.rating || 0
    })

    // Calculate average ratings and convert to array
    const result = Object.values(categories)
      .map((category) => ({
        ...category,
        averageRating: category.count > 0 ? Number.parseFloat((category.totalRating / category.count).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    console.log(`Returning ${result.length} feedback categories for range: ${dateRange}`)
    return result
  } catch (error) {
    console.error("Error getting feedback category distribution:", error)
    return []
  }
}

// Get feedback trends over time with dynamic date range
export const getFeedbackTrends = async (dateRange = "last_6_months") => {
  try {
    console.log(`Fetching feedback trends for range: ${dateRange}...`)

    // Determine number of periods to show based on date range
    let periodCount = 6 // Default to 6 months
    let periodType = "month" // Default to months

    switch (dateRange) {
      case "this_week":
      case "last_week":
        periodCount = 7
        periodType = "day"
        break
      case "this_month":
      case "last_month":
        periodCount = 30
        periodType = "day"
        break
      case "last_3_months":
        periodCount = 3
        periodType = "month"
        break
      case "this_year":
        periodCount = 12
        periodType = "month"
        break
      case "all_time":
        periodCount = 24 // Show up to 2 years for all time
        periodType = "month"
        break
      default:
        periodCount = 6
        periodType = "month"
    }

    const { startTimestamp, endTimestamp } = getDateRangeTimestamps(dateRange)

    // Initialize period data
    const periodData = {}

    if (periodType === "month") {
      // Initialize monthly data
      for (let i = 0; i < periodCount; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
        periodData[monthYear] = {
          period: monthYear,
          count: 0,
          totalRating: 0,
          averageRating: 0,
        }
      }
    } else if (periodType === "day") {
      // Initialize daily data
      for (let i = 0; i < periodCount; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayMonthYear = `${date.getDate()}/${date.getMonth() + 1}`
        periodData[dayMonthYear] = {
          period: dayMonthYear,
          count: 0,
          totalRating: 0,
          averageRating: 0,
        }
      }
    }

    // Get feedback data
    const feedbackRef = collection(db, "feedback")
    let feedbackQuery

    if (dateRange === "all_time") {
      feedbackQuery = query(feedbackRef, orderBy("createdAt", "desc"))
    } else {
      feedbackQuery = query(
        feedbackRef,
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
        orderBy("createdAt", "desc"),
      )
    }

    const feedbackSnapshot = await getDocs(feedbackQuery)

    if (feedbackSnapshot.empty) {
      console.log(`No feedback found for trends in range: ${dateRange}, creating mock data`)
      // Generate mock data if no feedback exists
      Object.keys(periodData).forEach((key) => {
        const count = Math.floor(Math.random() * 30) + 10 // Random count between 10-40
        const totalRating = (Math.random() * 1.5 + 3.5) * count // Random average between 3.5-5.0

        periodData[key].count = count
        periodData[key].totalRating = totalRating
        periodData[key].averageRating = Number.parseFloat((totalRating / count).toFixed(1))
      })
    } else {
      // Process feedback data
      feedbackSnapshot.docs.forEach((doc) => {
        const feedback = doc.data()
        if (feedback.createdAt) {
          const feedbackDate = feedback.createdAt.toDate ? feedback.createdAt.toDate() : new Date(feedback.createdAt)

          let periodKey
          if (periodType === "month") {
            periodKey = `${feedbackDate.getMonth() + 1}/${feedbackDate.getFullYear()}`
          } else if (periodType === "day") {
            periodKey = `${feedbackDate.getDate()}/${feedbackDate.getMonth() + 1}`
          }

          if (periodData[periodKey]) {
            periodData[periodKey].count++
            periodData[periodKey].totalRating += feedback.rating || 0
          }
        }
      })

      // Calculate average ratings
      Object.keys(periodData).forEach((key) => {
        const data = periodData[key]
        if (data.count > 0) {
          data.averageRating = Number.parseFloat((data.totalRating / data.count).toFixed(1))
        }
      })
    }

    // Convert to array and sort by date
    let result
    if (periodType === "month") {
      result = Object.values(periodData).sort((a, b) => {
        const [aMonth, aYear] = a.period.split("/")
        const [bMonth, bYear] = b.period.split("/")

        if (aYear !== bYear) {
          return aYear - bYear
        }
        return aMonth - bMonth
      })
    } else if (periodType === "day") {
      result = Object.values(periodData).sort((a, b) => {
        const [aDay, aMonth] = a.period.split("/")
        const [bDay, bMonth] = b.period.split("/")

        if (aMonth !== bMonth) {
          return aMonth - bMonth
        }
        return aDay - bDay
      })
    }

    console.log(`Returning feedback trends with ${result.length} periods for range: ${dateRange}`)
    return result
  } catch (error) {
    console.error("Error getting feedback trends:", error)
    return []
  }
}
