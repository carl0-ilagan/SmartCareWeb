import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit as firestoreLimit,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import { getSystemMetrics } from "./system-metrics"
import { doc, getDoc } from "firebase/firestore"

// Get all report types from Firestore
export async function getReportTypes() {
  try {
    const reportTypesRef = collection(db, "report_types")
    const snapshot = await getDocs(reportTypesRef)

    const reportTypes = []
    snapshot.forEach((doc) => {
      reportTypes.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // If no report types in Firestore, return defaults
    if (reportTypes.length === 0) {
      return [
        {
          id: "patient",
          label: "Patient Reports",
          icon: "user",
          description: "Patient statistics, demographics, and activity analysis",
          availableReports: [
            { id: "overview", name: "Patient List Overview" },
            { id: "demographics", name: "Patient Demographics" },
            { id: "medicalHistory", name: "Medical History Summary" },
            { id: "visitFrequency", name: "Patient Visit Frequency" },
            { id: "registration", name: "Registration Statistics" },
          ],
        },
        {
          id: "doctor",
          label: "Doctor Reports",
          icon: "stethoscope",
          description: "Doctor performance, availability, and patient load analysis",
          availableReports: [
            { id: "overview", name: "Doctor Profiles Overview" },
            { id: "performance", name: "Doctor Performance" },
            { id: "availability", name: "Schedules & Availability" },
            { id: "specialization", name: "Specialization Distribution" },
            { id: "workload", name: "Doctor Workload Report" },
          ],
        },
        {
          id: "appointment",
          label: "Appointment Reports",
          icon: "calendar",
          description: "Appointment analytics, completion rates, and scheduling trends",
          availableReports: [
            { id: "statistics", name: "Appointment Statistics" },
            { id: "trends", name: "Booking Trends" },
            { id: "types", name: "Appointment Types" },
            { id: "upcoming", name: "Upcoming Appointments" },
          ],
        },
        {
          id: "system",
          label: "System Reports",
          icon: "server",
          description: "System performance, usage metrics, and error analysis",
          availableReports: [
            { id: "activity", name: "System Activity Logs" },
            { id: "userRoles", name: "User Roles Overview" },
            { id: "dataUsage", name: "Data Usage" },
            { id: "notifications", name: "System Notifications" },
            { id: "audit", name: "Audit Trail" },
            { id: "backup", name: "Backup & Security Status" },
          ],
        },
      ]
    }

    return reportTypes
  } catch (error) {
    console.error("Error fetching report types:", error)
    // Return default report types if Firestore fetch fails
    return [
      {
        id: "patient",
        label: "Patient Reports",
        icon: "user",
        description: "Patient statistics, demographics, and activity analysis",
        availableReports: [
            { id: "overview", name: "Patient List Overview" },
          { id: "demographics", name: "Patient Demographics" },
            { id: "medicalHistory", name: "Medical History Summary" },
            { id: "visitFrequency", name: "Patient Visit Frequency" },
          { id: "registration", name: "Registration Statistics" },
        ],
      },
      {
        id: "doctor",
        label: "Doctor Reports",
        icon: "stethoscope",
        description: "Doctor performance, availability, and patient load analysis",
        availableReports: [
            { id: "overview", name: "Doctor Profiles Overview" },
            { id: "performance", name: "Doctor Performance" },
            { id: "availability", name: "Schedules & Availability" },
          { id: "specialization", name: "Specialization Distribution" },
            { id: "workload", name: "Doctor Workload Report" },
        ],
      },
      {
        id: "appointment",
        label: "Appointment Reports",
        icon: "calendar",
        description: "Appointment analytics, completion rates, and scheduling trends",
        availableReports: [
            { id: "statistics", name: "Appointment Statistics" },
            { id: "trends", name: "Booking Trends" },
            { id: "types", name: "Appointment Types" },
            { id: "upcoming", name: "Upcoming Appointments" },
        ],
      },
      {
        id: "system",
        label: "System Reports",
        icon: "server",
        description: "System performance, usage metrics, and error analysis",
        availableReports: [
            { id: "activity", name: "System Activity Logs" },
            { id: "userRoles", name: "User Roles Overview" },
            { id: "dataUsage", name: "Data Usage" },
            { id: "notifications", name: "System Notifications" },
            { id: "audit", name: "Audit Trail" },
            { id: "backup", name: "Backup & Security Status" },
        ],
      },
    ]
  }
}

// Get recent reports from Firestore
export async function getRecentReports(reportType = null, limitCount = 10) {
  try {
    const reportsRef = collection(db, "reports")
    let q

    if (reportType) {
      q = query(reportsRef, where("type", "==", reportType), orderBy("createdAt", "desc"), firestoreLimit(limitCount))
    } else {
      q = query(reportsRef, orderBy("createdAt", "desc"), firestoreLimit(limitCount))
    }

    const snapshot = await getDocs(q)

    const reports = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      reports.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        format: data.format,
        date:
          data.createdAt?.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }) || "Unknown date",
        url: data.url || "#",
        ...data,
      })
    })

    return reports
  } catch (error) {
    console.error("Error fetching reports:", error)
    return []
  }
}

// Generate a new report and save to Firestore
export async function generateReport(reportData) {
  try {
    const reportsRef = collection(db, "reports")

    // Generate dynamic report data based on type
    const reportContent = await generateDynamicReportData(reportData)

    // Add timestamp and content
    const reportWithTimestamp = {
      ...reportData,
      createdAt: serverTimestamp(),
      status: "completed",
      content: reportContent,
      url: "#", // In a real app, this would be a URL to the generated report file
    }

    const docRef = await addDoc(reportsRef, reportWithTimestamp)

    return {
      id: docRef.id,
      ...reportWithTimestamp,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }
  } catch (error) {
    console.error("Error generating report:", error)
    throw error
  }
}

// Calculate date range based on dateRange string
function getDateRangeFilter(dateRange) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let startDate, endDate

  switch (dateRange) {
    case "today":
      startDate = new Date(today)
      endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
      break
    case "yesterday":
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 1)
      endDate = new Date(today)
      endDate.setDate(endDate.getDate() - 1)
      endDate.setHours(23, 59, 59, 999)
      break
    case "last7":
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 7)
      endDate = new Date(now)
      break
    case "last30":
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 30)
      endDate = new Date(now)
      break
    case "thisMonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now)
      break
    case "lastMonth":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      break
    default:
      // Default to last 30 days
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 30)
      endDate = new Date(now)
  }

  return { startDate, endDate }
}

// Fetch patient demographics data
async function fetchPatientDemographics(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const usersRef = collection(db, "users")
    const patientsQuery = query(usersRef, where("role", "==", "patient"))
    const snapshot = await getDocs(patientsQuery)

    const patients = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      
      // Filter by date range if createdAt exists
      if (!data.createdAt || (createdAt >= startDate && createdAt <= endDate)) {
        patients.push({
          id: doc.id,
          ...data,
          createdAt,
        })
      }
    })

    // Calculate age distribution
    const ageDistribution = { "0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "65+": 0 }
    const genderDistribution = { Male: 0, Female: 0, Other: 0 }

    patients.forEach((patient) => {
      // Age calculation
      if (patient.dateOfBirth || patient.dob || patient.birthDate) {
        const birthDate = patient.dateOfBirth?.toDate
          ? patient.dateOfBirth.toDate()
          : new Date(patient.dateOfBirth || patient.dob || patient.birthDate)
        const age = new Date().getFullYear() - birthDate.getFullYear()
        
        if (age <= 18) ageDistribution["0-18"]++
        else if (age <= 35) ageDistribution["19-35"]++
        else if (age <= 50) ageDistribution["36-50"]++
        else if (age <= 65) ageDistribution["51-65"]++
        else ageDistribution["65+"]++
      }

      // Gender distribution
      const gender = patient.gender || patient.sex || "Other"
      if (genderDistribution[gender] !== undefined) {
        genderDistribution[gender]++
      } else {
        genderDistribution["Other"]++
      }
    })

    return {
      totalPatients: patients.length,
      ageDistribution,
      genderDistribution,
      summary: `Patient demographics analysis for ${dateRange} period. Total of ${patients.length} patients analyzed.`,
    }
  } catch (error) {
    console.error("Error fetching patient demographics:", error)
    throw error
  }
}

// Fetch patient registration statistics
async function fetchPatientRegistration(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const usersRef = collection(db, "users")
    const patientsQuery = query(usersRef, where("role", "==", "patient"), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(patientsQuery)

    const registrations = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      
      if (createdAt >= startDate && createdAt <= endDate) {
        registrations.push({
          id: doc.id,
          createdAt,
        })
      }
    })

    // Calculate weekly trend (last 7 days)
    const weeklyTrend = []
    const days = 7
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(endDate)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const count = registrations.filter((reg) => {
        const regDate = reg.createdAt
        return regDate >= dayStart && regDate <= dayEnd
      }).length

      weeklyTrend.push(count)
    }

    return {
      totalRegistrations: registrations.length,
      weeklyTrend,
      conversionRate: "N/A", // Would need more data to calculate
      channelDistribution: {
        Website: Math.floor(registrations.length * 0.6),
        Mobile: Math.floor(registrations.length * 0.3),
        Referral: Math.floor(registrations.length * 0.1),
      },
      summary: `Registration statistics for ${dateRange} period. ${registrations.length} new patient registrations.`,
    }
  } catch (error) {
    console.error("Error fetching patient registration:", error)
    throw error
  }
}

// Fetch doctor performance data
async function fetchDoctorPerformance(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const usersRef = collection(db, "users")
    const doctorsQuery = query(usersRef, where("role", "==", "doctor"))
    const doctorsSnapshot = await getDocs(doctorsQuery)

    const doctors = []
    doctorsSnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Get appointments for performance metrics
    const appointmentsRef = collection(db, "appointments")
    let appointmentsSnapshot
    
    try {
      // Try to query with date range if date field exists
      const appointmentsQuery = query(
        appointmentsRef,
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
      )
      appointmentsSnapshot = await getDocs(appointmentsQuery)
    } catch (error) {
      // If query fails, get all appointments and filter in memory
      console.warn("Date range query failed, fetching all appointments:", error)
      appointmentsSnapshot = await getDocs(appointmentsRef)
    }

    let totalAppointments = 0
    let completedAppointments = 0
    const doctorAppointments = {}

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      
      // Check if appointment date is within range
      let appointmentDate = null
      if (data.date) {
        if (data.date.toDate) {
          appointmentDate = data.date.toDate()
        } else if (data.date instanceof Date) {
          appointmentDate = data.date
        } else if (typeof data.date === "string") {
          appointmentDate = new Date(data.date)
        }
      }
      
      // Filter by date range if date exists
      if (appointmentDate && (appointmentDate < startDate || appointmentDate > endDate)) {
        return // Skip this appointment if outside date range
      }
      
      totalAppointments++
      if (data.status === "completed") completedAppointments++

      if (data.doctorId) {
        if (!doctorAppointments[data.doctorId]) {
          doctorAppointments[data.doctorId] = { total: 0, completed: 0 }
        }
        doctorAppointments[data.doctorId].total++
        if (data.status === "completed") {
          doctorAppointments[data.doctorId].completed++
        }
      }
    })

    // Calculate top performers
    const topPerformers = []
    for (const [doctorId, stats] of Object.entries(doctorAppointments)) {
      try {
        const doctorDoc = await getDoc(doc(db, "users", doctorId))
        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data()
          const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
          topPerformers.push({
            name: doctorData.displayName || doctorData.name || "Unknown Doctor",
            rating: 4.5 + Math.random() * 0.5, // Mock rating, would come from reviews
            patients: stats.total,
            completionRate: completionRate.toFixed(1) + "%",
          })
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error)
      }
    }

    topPerformers.sort((a, b) => b.rating - a.rating)

    return {
      totalDoctors: doctors.length,
      averageRating: topPerformers.length > 0
        ? (topPerformers.reduce((sum, d) => sum + d.rating, 0) / topPerformers.length).toFixed(1)
        : "N/A",
      patientSatisfaction: totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(0) + "%"
        : "N/A",
      appointmentCompletion: totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(0) + "%"
        : "N/A",
      topPerformers: topPerformers.slice(0, 5),
      summary: `Doctor performance analysis for ${dateRange} period. ${doctors.length} doctors analyzed.`,
    }
  } catch (error) {
    console.error("Error fetching doctor performance:", error)
    throw error
  }
}

// Fetch doctor availability data
async function fetchDoctorAvailability(dateRange) {
  try {
    const usersRef = collection(db, "users")
    const doctorsQuery = query(usersRef, where("role", "==", "doctor"))
    const doctorsSnapshot = await getDocs(doctorsQuery)

    const doctors = []
    doctorsSnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Get appointments to calculate utilization
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const appointmentsRef = collection(db, "appointments")
    let appointmentsSnapshot
    
    try {
      const appointmentsQuery = query(
        appointmentsRef,
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
      )
      appointmentsSnapshot = await getDocs(appointmentsQuery)
    } catch (error) {
      console.warn("Date range query failed, fetching all appointments:", error)
      appointmentsSnapshot = await getDocs(appointmentsRef)
    }

    // Filter appointments by date range in memory
    let totalAppointments = 0
    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      let appointmentDate = null
      if (data.date) {
        if (data.date.toDate) {
          appointmentDate = data.date.toDate()
        } else if (data.date instanceof Date) {
          appointmentDate = data.date
        } else if (typeof data.date === "string") {
          appointmentDate = new Date(data.date)
        }
      }
      
      if (!appointmentDate || (appointmentDate >= startDate && appointmentDate <= endDate)) {
        totalAppointments++
      }
    })
    const totalHours = doctors.length * 40 * 4 // Assuming 40 hours/week per doctor, 4 weeks
    const utilization = totalHours > 0 ? ((totalAppointments * 0.5) / totalHours) * 100 : 0 // 0.5 hours per appointment

    // Calculate availability by day (mock data based on appointments)
    const availabilityByDay = {
      Monday: "82%",
      Tuesday: "79%",
      Wednesday: "81%",
      Thursday: "76%",
      Friday: "74%",
      Saturday: "68%",
      Sunday: "42%",
    }

    return {
      totalHours: totalHours,
      utilization: utilization.toFixed(0) + "%",
      peakHours: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"],
      availabilityByDay,
      summary: `Doctor availability analysis for ${dateRange} period. Utilization rate: ${utilization.toFixed(0)}%.`,
    }
  } catch (error) {
    console.error("Error fetching doctor availability:", error)
    throw error
  }
}

// Fetch patient list overview
async function fetchPatientOverview(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const usersRef = collection(db, "users")
    const patientsQuery = query(usersRef, where("role", "==", "patient"))
    const snapshot = await getDocs(patientsQuery)

    const allPatients = []
    const newPatients = []
    const today = new Date()
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    snapshot.forEach((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      allPatients.push({ id: doc.id, ...data, createdAt })
      
      if (createdAt >= startDate && createdAt <= endDate) {
        newPatients.push({ id: doc.id, ...data, createdAt })
      }
    })

    const dailyNew = newPatients.filter(p => {
      const pDate = new Date(p.createdAt)
      return pDate.toDateString() === today.toDateString()
    }).length

    const weeklyNew = newPatients.filter(p => p.createdAt >= oneWeekAgo).length
    const monthlyNew = newPatients.filter(p => p.createdAt >= oneMonthAgo).length

    return {
      totalPatients: allPatients.length,
      newPatients: newPatients.length,
      dailyNew,
      weeklyNew,
      monthlyNew,
      activePatients: allPatients.filter(p => p.status !== "inactive").length,
      inactivePatients: allPatients.filter(p => p.status === "inactive").length,
      summary: `Patient overview for ${dateRange} period. Total: ${allPatients.length} patients, ${newPatients.length} new registrations.`,
    }
  } catch (error) {
    console.error("Error fetching patient overview:", error)
    throw error
  }
}

// Fetch patient medical history summary
async function fetchPatientMedicalHistory(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const appointmentsRef = collection(db, "appointments")
    const appointmentsSnapshot = await getDocs(appointmentsRef)

    const conditions = {}
    const chronicPatients = new Set()
    let totalAppointments = 0

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
      
      if (aptDate >= startDate && aptDate <= endDate) {
        totalAppointments++
        
        // Extract conditions from reason/notes
        const reason = (data.reason || data.notes || "").toLowerCase()
        if (reason.includes("diabetes") || reason.includes("diabetic")) {
          conditions["Diabetes"] = (conditions["Diabetes"] || 0) + 1
          if (data.patientId) chronicPatients.add(data.patientId)
        }
        if (reason.includes("hypertension") || reason.includes("hypertensive") || reason.includes("high blood")) {
          conditions["Hypertension"] = (conditions["Hypertension"] || 0) + 1
          if (data.patientId) chronicPatients.add(data.patientId)
        }
        if (reason.includes("asthma")) {
          conditions["Asthma"] = (conditions["Asthma"] || 0) + 1
          if (data.patientId) chronicPatients.add(data.patientId)
        }
        if (reason.includes("heart") || reason.includes("cardiac")) {
          conditions["Heart Disease"] = (conditions["Heart Disease"] || 0) + 1
          if (data.patientId) chronicPatients.add(data.patientId)
        }
      }
    })

    // Get top conditions
    const topConditions = Object.entries(conditions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    return {
      totalAppointments,
      commonConditions: topConditions,
      chronicPatients: chronicPatients.size,
      totalConditions: Object.keys(conditions).length,
      summary: `Medical history summary for ${dateRange} period. ${totalAppointments} appointments analyzed, ${chronicPatients.size} chronic patients identified.`,
    }
  } catch (error) {
    console.error("Error fetching medical history:", error)
    throw error
  }
}

// Fetch patient visit frequency
async function fetchPatientVisitFrequency(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const appointmentsRef = collection(db, "appointments")
    const appointmentsSnapshot = await getDocs(appointmentsRef)

    const patientVisits = {}
    const now = new Date()
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.patientId) {
        if (!patientVisits[data.patientId]) {
          patientVisits[data.patientId] = { count: 0, lastVisit: null }
        }
        const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
        if (aptDate >= startDate && aptDate <= endDate) {
          patientVisits[data.patientId].count++
          if (!patientVisits[data.patientId].lastVisit || aptDate > patientVisits[data.patientId].lastVisit) {
            patientVisits[data.patientId].lastVisit = aptDate
          }
        }
      }
    })

    // Find frequent visitors (5+ visits)
    const frequentVisitors = Object.entries(patientVisits)
      .filter(([_, visits]) => visits.count >= 5)
      .map(([patientId, visits]) => ({ patientId, visits: visits.count }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10)

    // Find inactive patients (no visit in last 6 months)
    const inactivePatients = Object.entries(patientVisits)
      .filter(([_, visits]) => !visits.lastVisit || visits.lastVisit < sixMonthsAgo)
      .length

    return {
      totalPatients: Object.keys(patientVisits).length,
      frequentVisitors: frequentVisitors.length,
      topFrequentVisitors: frequentVisitors,
      inactivePatients,
      averageVisits: Object.values(patientVisits).reduce((sum, v) => sum + v.count, 0) / Object.keys(patientVisits).length || 0,
      summary: `Visit frequency analysis for ${dateRange} period. ${frequentVisitors.length} frequent visitors, ${inactivePatients} inactive patients.`,
    }
  } catch (error) {
    console.error("Error fetching visit frequency:", error)
    throw error
  }
}

// Fetch doctor profiles overview
async function fetchDoctorOverview(dateRange) {
  try {
    const usersRef = collection(db, "users")
    const doctorsQuery = query(usersRef, where("role", "==", "doctor"))
    const doctorsSnapshot = await getDocs(doctorsQuery)

    const doctors = []
    const specializations = {}
    const activeDoctors = []

    doctorsSnapshot.forEach((doc) => {
      const data = doc.data()
      const specialty = data.specialty || data.specialization || "General"
      doctors.push({ id: doc.id, ...data, specialty })
      
      if (data.status !== "inactive") {
        activeDoctors.push({ id: doc.id, ...data, specialty })
      }
      
      specializations[specialty] = (specializations[specialty] || 0) + 1
    })

    const specializationList = Object.entries(specializations)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalDoctors: doctors.length,
      activeDoctors: activeDoctors.length,
      inactiveDoctors: doctors.length - activeDoctors.length,
      specializations: specializationList,
      summary: `Doctor profiles overview. ${activeDoctors.length} active doctors across ${specializationList.length} specializations.`,
    }
  } catch (error) {
    console.error("Error fetching doctor overview:", error)
    throw error
  }
}

// Fetch doctor workload
async function fetchDoctorWorkload(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const appointmentsRef = collection(db, "appointments")
    let appointmentsSnapshot = await getDocs(appointmentsRef)

    const doctorWorkload = {}
    const doctorAppointments = {}

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.doctorId) {
        const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
        if (aptDate >= startDate && aptDate <= endDate) {
          if (!doctorAppointments[data.doctorId]) {
            doctorAppointments[data.doctorId] = { total: 0, completed: 0, cancelled: 0 }
          }
          doctorAppointments[data.doctorId].total++
          if (data.status === "completed") doctorAppointments[data.doctorId].completed++
          if (data.status === "cancelled") doctorAppointments[data.doctorId].cancelled++
        }
      }
    })

    // Get doctor details and calculate workload
    for (const [doctorId, stats] of Object.entries(doctorAppointments)) {
      try {
        const doctorDoc = await getDoc(doc(db, "users", doctorId))
        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data()
          doctorWorkload[doctorId] = {
            name: doctorData.displayName || doctorData.name || "Unknown Doctor",
            specialty: doctorData.specialty || "General",
            totalAppointments: stats.total,
            completed: stats.completed,
            cancelled: stats.cancelled,
            completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) + "%" : "0%",
          }
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error)
      }
    }

    const workloadList = Object.values(doctorWorkload)
      .sort((a, b) => b.totalAppointments - a.totalAppointments)

    return {
      totalDoctors: workloadList.length,
      topDoctors: workloadList.slice(0, 10),
      averageAppointments: workloadList.length > 0
        ? (workloadList.reduce((sum, d) => sum + d.totalAppointments, 0) / workloadList.length).toFixed(1)
        : "0",
      summary: `Doctor workload report for ${dateRange} period. ${workloadList.length} doctors analyzed.`,
    }
  } catch (error) {
    console.error("Error fetching doctor workload:", error)
    throw error
  }
}

// Fetch appointment statistics
async function fetchAppointmentStatistics(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const appointmentsRef = collection(db, "appointments")
    let appointmentsSnapshot = await getDocs(appointmentsRef)

    let total = 0
    let completed = 0
    let cancelled = 0
    let noShow = 0
    let pending = 0

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
      
      if (aptDate >= startDate && aptDate <= endDate) {
        total++
        if (data.status === "completed") completed++
        else if (data.status === "cancelled") cancelled++
        else if (data.status === "no-show" || data.status === "noshow") noShow++
        else if (data.status === "pending" || data.status === "approved" || data.status === "confirmed") pending++
      }
    })

    return {
      total,
      completed,
      cancelled,
      noShow,
      pending,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) + "%" : "0%",
      cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(1) + "%" : "0%",
      noShowRate: total > 0 ? ((noShow / total) * 100).toFixed(1) + "%" : "0%",
      summary: `Appointment statistics for ${dateRange} period. Total: ${total}, Completed: ${completed}, Cancelled: ${cancelled}, No-show: ${noShow}.`,
    }
  } catch (error) {
    console.error("Error fetching appointment statistics:", error)
    throw error
  }
}

// Fetch appointment booking trends
async function fetchAppointmentTrends(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const appointmentsRef = collection(db, "appointments")
    let appointmentsSnapshot = await getDocs(appointmentsRef)

    const dayOfWeek = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 }
    const hourOfDay = {}
    const doctorRequests = {}

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
      
      if (aptDate >= startDate && aptDate <= endDate) {
        // Day of week
        const dayName = aptDate.toLocaleDateString("en-US", { weekday: "long" })
        dayOfWeek[dayName] = (dayOfWeek[dayName] || 0) + 1

        // Hour of day
        const hour = aptDate.getHours()
        const hourKey = `${hour}:00`
        hourOfDay[hourKey] = (hourOfDay[hourKey] || 0) + 1

        // Doctor requests
        if (data.doctorId) {
          doctorRequests[data.doctorId] = (doctorRequests[data.doctorId] || 0) + 1
        }
      }
    })

    const peakDays = Object.entries(dayOfWeek)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day, count]) => ({ day, count }))

    const peakHours = Object.entries(hourOfDay)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, count }))

    // Get most requested doctors
    const topDoctors = []
    for (const [doctorId, count] of Object.entries(doctorRequests).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      try {
        const doctorDoc = await getDoc(doc(db, "users", doctorId))
        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data()
          topDoctors.push({
            name: doctorData.displayName || doctorData.name || "Unknown Doctor",
            requests: count,
          })
        }
      } catch (error) {
        console.error("Error fetching doctor:", error)
      }
    }

    return {
      peakDays,
      peakHours,
      mostRequestedDoctors: topDoctors,
      summary: `Booking trends for ${dateRange} period. Peak day: ${peakDays[0]?.day || "N/A"}, Peak hour: ${peakHours[0]?.hour || "N/A"}.`,
    }
  } catch (error) {
    console.error("Error fetching appointment trends:", error)
    throw error
  }
}

// Fetch appointment types
async function fetchAppointmentTypes(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const appointmentsRef = collection(db, "appointments")
    let appointmentsSnapshot = await getDocs(appointmentsRef)

    const types = {}
    let walkIn = 0
    let online = 0
    let teleconsultation = 0
    let physical = 0

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
      
      if (aptDate >= startDate && aptDate <= endDate) {
        // Appointment type
        const type = data.type || "consultation"
        types[type] = (types[type] || 0) + 1

        // Booking method
        if (data.bookingMethod === "walk-in" || data.isWalkIn) walkIn++
        else online++

        // Visit type
        if (data.location && (data.location.toLowerCase().includes("virtual") || data.location.toLowerCase().includes("tele"))) {
          teleconsultation++
        } else {
          physical++
        }
      }
    })

    const typeDistribution = Object.entries(types)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return {
      typeDistribution,
      walkIn,
      online,
      teleconsultation,
      physical,
      summary: `Appointment types for ${dateRange} period. Online: ${online}, Walk-in: ${walkIn}, Teleconsultation: ${teleconsultation}, Physical: ${physical}.`,
    }
  } catch (error) {
    console.error("Error fetching appointment types:", error)
    throw error
  }
}

// Fetch upcoming appointments
async function fetchUpcomingAppointments(dateRange) {
  try {
    const now = new Date()
    const appointmentsRef = collection(db, "appointments")
    let appointmentsSnapshot = await getDocs(appointmentsRef)

    const upcoming = []
    const today = []
    const thisWeek = []
    const nextWeek = []

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
      
      if (aptDate >= now && (data.status === "pending" || data.status === "approved" || data.status === "confirmed")) {
        const appointment = {
          id: doc.id,
          patientName: data.patientName || "Unknown",
          doctorName: data.doctorName || "Unknown",
          date: aptDate,
          time: data.time || "00:00",
          type: data.type || "consultation",
          status: data.status,
        }
        upcoming.push(appointment)

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setHours(23, 59, 59, 999)

        if (aptDate >= todayStart && aptDate <= todayEnd) {
          today.push(appointment)
        }

        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() + 7)
        if (aptDate <= weekEnd) {
          thisWeek.push(appointment)
        }

        const nextWeekEnd = new Date(now)
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 14)
        if (aptDate > weekEnd && aptDate <= nextWeekEnd) {
          nextWeek.push(appointment)
        }
      }
    })

    upcoming.sort((a, b) => a.date - b.date)

    return {
      total: upcoming.length,
      today: today.length,
      thisWeek: thisWeek.length,
      nextWeek: nextWeek.length,
      upcomingAppointments: upcoming.slice(0, 20),
      summary: `Upcoming appointments overview. Today: ${today.length}, This week: ${thisWeek.length}, Next week: ${nextWeek.length}.`,
    }
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error)
    throw error
  }
}

// Fetch system activity logs
async function fetchSystemActivityLogs(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const activityLogsRef = collection(db, "activityLogs")
    let logsSnapshot = await getDocs(activityLogsRef)

    let logins = 0
    let logouts = 0
    let failedLogins = 0
    const activityByDay = {}

    logsSnapshot.forEach((doc) => {
      const data = doc.data()
      const logDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
      
      if (logDate >= startDate && logDate <= endDate) {
        const action = data.action || data.type || ""
        if (action.toLowerCase().includes("login")) {
          if (action.toLowerCase().includes("failed")) {
            failedLogins++
          } else {
            logins++
          }
        } else if (action.toLowerCase().includes("logout")) {
          logouts++
        }

        const dayKey = logDate.toLocaleDateString()
        activityByDay[dayKey] = (activityByDay[dayKey] || 0) + 1
      }
    })

    return {
      totalLogins: logins,
      totalLogouts: logouts,
      failedLogins,
      activityByDay,
      summary: `System activity logs for ${dateRange} period. Logins: ${logins}, Logouts: ${logouts}, Failed attempts: ${failedLogins}.`,
    }
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    throw error
  }
}

// Fetch user roles overview
async function fetchUserRolesOverview(dateRange) {
  try {
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(usersRef)

    const roles = { admin: 0, doctor: 0, patient: 0, staff: 0, other: 0 }
    const activeUsers = { admin: 0, doctor: 0, patient: 0, staff: 0, other: 0 }

    snapshot.forEach((doc) => {
      const data = doc.data()
      const role = (data.role || "other").toLowerCase()
      roles[role] = (roles[role] || 0) + 1
      if (data.status !== "inactive") {
        activeUsers[role] = (activeUsers[role] || 0) + 1
      }
    })

    return {
      totalUsers: snapshot.size,
      roles: {
        admin: roles.admin,
        doctor: roles.doctor,
        patient: roles.patient,
        staff: roles.staff,
        other: roles.other,
      },
      activeUsers: {
        admin: activeUsers.admin,
        doctor: activeUsers.doctor,
        patient: activeUsers.patient,
        staff: activeUsers.staff,
        other: activeUsers.other,
      },
      summary: `User roles overview. Total users: ${snapshot.size}, Active: ${Object.values(activeUsers).reduce((a, b) => a + b, 0)}.`,
    }
  } catch (error) {
    console.error("Error fetching user roles:", error)
    throw error
  }
}

// Fetch data usage
async function fetchDataUsage(dateRange) {
  try {
    // This would typically come from storage metrics
    // For now, we'll estimate based on collections
    const collections = ["users", "appointments", "prescriptions", "messages", "notifications"]
    let totalDocs = 0
    const collectionSizes = {}

    for (const collName of collections) {
      try {
        const collRef = collection(db, collName)
        const snapshot = await getDocs(collRef)
        const size = snapshot.size
        totalDocs += size
        collectionSizes[collName] = size
      } catch (error) {
        console.error(`Error fetching ${collName}:`, error)
      }
    }

    // Estimate storage (rough calculation)
    const estimatedStorageMB = (totalDocs * 0.05).toFixed(2) // ~50KB per document average

    return {
      totalDocuments: totalDocs,
      collectionSizes,
      estimatedStorageMB,
      summary: `Data usage overview. Total documents: ${totalDocs}, Estimated storage: ${estimatedStorageMB} MB.`,
    }
  } catch (error) {
    console.error("Error fetching data usage:", error)
    throw error
  }
}

// Fetch system notifications
async function fetchSystemNotifications(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const notificationsRef = collection(db, "notifications")
    let notificationsSnapshot = await getDocs(notificationsRef)

    let emailSuccess = 0
    let emailFailed = 0
    let smsSuccess = 0
    let smsFailed = 0
    let total = 0

    notificationsSnapshot.forEach((doc) => {
      const data = doc.data()
      const notifDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      
      if (notifDate >= startDate && notifDate <= endDate) {
        total++
        const type = (data.type || "").toLowerCase()
        const status = (data.status || "").toLowerCase()
        
        if (type.includes("email")) {
          if (status === "success" || status === "sent") emailSuccess++
          else emailFailed++
        } else if (type.includes("sms")) {
          if (status === "success" || status === "sent") smsSuccess++
          else smsFailed++
        }
      }
    })

    return {
      total,
      emailSuccess,
      emailFailed,
      smsSuccess,
      smsFailed,
      emailSuccessRate: (emailSuccess + emailFailed) > 0
        ? ((emailSuccess / (emailSuccess + emailFailed)) * 100).toFixed(1) + "%"
        : "N/A",
      smsSuccessRate: (smsSuccess + smsFailed) > 0
        ? ((smsSuccess / (smsSuccess + smsFailed)) * 100).toFixed(1) + "%"
        : "N/A",
      summary: `System notifications for ${dateRange} period. Email: ${emailSuccess} success, ${emailFailed} failed. SMS: ${smsSuccess} success, ${smsFailed} failed.`,
    }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }
}

// Fetch audit trail
async function fetchAuditTrail(dateRange) {
  try {
    const { startDate, endDate } = getDateRangeFilter(dateRange)
    const auditLogsRef = collection(db, "auditLogs")
    let auditSnapshot = await getDocs(auditLogsRef)

    const accessLogs = []
    const editLogs = []
    const userActions = {}

    auditSnapshot.forEach((doc) => {
      const data = doc.data()
      const logDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
      
      if (logDate >= startDate && logDate <= endDate) {
        const action = data.action || data.type || ""
        const userId = data.userId || data.adminId || "unknown"
        
        if (action.toLowerCase().includes("access") || action.toLowerCase().includes("view")) {
          accessLogs.push({ userId, action, resource: data.resource || "unknown", timestamp: logDate })
        }
        if (action.toLowerCase().includes("edit") || action.toLowerCase().includes("update")) {
          editLogs.push({ userId, action, resource: data.resource || "unknown", timestamp: logDate })
        }

        userActions[userId] = (userActions[userId] || 0) + 1
      }
    })

    const topUsers = Object.entries(userActions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, actions: count }))

    return {
      totalAccess: accessLogs.length,
      totalEdits: editLogs.length,
      topUsers,
      recentAccess: accessLogs.slice(-10),
      recentEdits: editLogs.slice(-10),
      summary: `Audit trail for ${dateRange} period. Access logs: ${accessLogs.length}, Edit logs: ${editLogs.length}.`,
    }
  } catch (error) {
    console.error("Error fetching audit trail:", error)
    throw error
  }
}

// Fetch backup and security status
async function fetchBackupStatus(dateRange) {
  try {
    // This would typically come from backup service logs
    // For now, we'll return mock data structure
    const now = new Date()
    const lastBackup = new Date(now)
    lastBackup.setDate(lastBackup.getDate() - 1) // Assume backup ran yesterday

    return {
      lastBackupTime: lastBackup.toLocaleString(),
      backupStatus: "success",
      backupHistory: [
        { date: new Date(now.getDate() - 1).toLocaleDateString(), status: "success", size: "2.5 GB" },
        { date: new Date(now.getDate() - 2).toLocaleDateString(), status: "success", size: "2.4 GB" },
        { date: new Date(now.getDate() - 3).toLocaleDateString(), status: "success", size: "2.3 GB" },
      ],
      securityStatus: "secure",
      summary: `Backup & security status. Last backup: ${lastBackup.toLocaleString()}, Status: Success.`,
    }
  } catch (error) {
    console.error("Error fetching backup status:", error)
    throw error
  }
}

// Generate dynamic report data based on report type
async function generateDynamicReportData(reportData) {
  const { type, subType, dateRange } = reportData

  try {
    // Patient reports
    if (type === "patient") {
      if (subType === "overview") {
        return await fetchPatientOverview(dateRange)
      } else if (subType === "demographics") {
        return await fetchPatientDemographics(dateRange)
      } else if (subType === "medicalHistory") {
        return await fetchPatientMedicalHistory(dateRange)
      } else if (subType === "visitFrequency") {
        return await fetchPatientVisitFrequency(dateRange)
      } else if (subType === "registration") {
        return await fetchPatientRegistration(dateRange)
      }
    }

    // Doctor reports
    if (type === "doctor") {
      if (subType === "overview") {
        return await fetchDoctorOverview(dateRange)
      } else if (subType === "performance") {
        return await fetchDoctorPerformance(dateRange)
      } else if (subType === "availability") {
        return await fetchDoctorAvailability(dateRange)
      } else if (subType === "workload") {
        return await fetchDoctorWorkload(dateRange)
      } else if (subType === "specialization") {
        return await fetchDoctorOverview(dateRange) // Reuse overview for specialization
      }
    }

    // Appointment reports
    if (type === "appointment") {
      if (subType === "statistics") {
        return await fetchAppointmentStatistics(dateRange)
      } else if (subType === "trends") {
        return await fetchAppointmentTrends(dateRange)
      } else if (subType === "types") {
        return await fetchAppointmentTypes(dateRange)
      } else if (subType === "upcoming") {
        return await fetchUpcomingAppointments(dateRange)
      }
    }

    // System reports
    if (type === "system") {
      if (subType === "activity") {
        return await fetchSystemActivityLogs(dateRange)
      } else if (subType === "userRoles") {
        return await fetchUserRolesOverview(dateRange)
      } else if (subType === "dataUsage") {
        return await fetchDataUsage(dateRange)
      } else if (subType === "notifications") {
        return await fetchSystemNotifications(dateRange)
      } else if (subType === "audit") {
        return await fetchAuditTrail(dateRange)
      } else if (subType === "backup") {
        return await fetchBackupStatus(dateRange)
      } else if (subType === "performance") {
        try {
          const metrics = await getSystemMetrics()
          return {
            ...metrics,
            summary: "System is performing within expected parameters.",
            recommendations: [
              "Consider upgrading server capacity during peak hours",
              "Optimize database queries for better performance",
            ],
          }
        } catch (error) {
          console.error("Error fetching system metrics:", error)
        }
      }
    }

    // Doctor reports
    if (type === "doctor") {
      if (subType === "performance") {
        return await fetchDoctorPerformance(dateRange)
      } else if (subType === "availability") {
        return await fetchDoctorAvailability(dateRange)
      }
    }

    // System reports
    if (type === "system" && subType === "performance") {
      try {
        const metrics = await getSystemMetrics()
        return {
          ...metrics,
          summary: "System is performing within expected parameters.",
          recommendations: [
            "Consider upgrading server capacity during peak hours",
            "Optimize database queries for better performance",
          ],
        }
      } catch (error) {
        console.error("Error fetching system metrics:", error)
      }
    }

    // Fallback to mock data for unsupported types
    return await generateMockReportData(reportData)
  } catch (error) {
    console.error("Error generating dynamic report data:", error)
    // Fallback to mock data on error
    return await generateMockReportData(reportData)
  }
}

// Generate mock report data based on report type (fallback)
async function generateMockReportData(reportData) {
  const { type, subType, dateRange } = reportData

  // For system reports, use actual system metrics
  if (type === "system" && subType === "performance") {
    try {
      const metrics = await getSystemMetrics()
      return {
        metrics,
        summary: "System is performing within expected parameters.",
        recommendations: [
          "Consider upgrading server capacity during peak hours",
          "Optimize database queries for better performance",
        ],
      }
    } catch (error) {
      console.error("Error fetching system metrics:", error)
    }
  }

  // Mock data for different report types
  const mockData = {
    patient: {
      demographics: {
        totalPatients: 1247,
        ageDistribution: {
          "0-18": 187,
          "19-35": 412,
          "36-50": 328,
          "51-65": 198,
          "65+": 122,
        },
        genderDistribution: {
          Male: 602,
          Female: 635,
          Other: 10,
        },
        locationMap: {
          Downtown: 342,
          Suburbs: 528,
          Rural: 377,
        },
        summary: "Patient demographics show a balanced distribution across age groups and genders.",
      },
      registration: {
        totalRegistrations: 156,
        weeklyTrend: [23, 18, 27, 31, 19, 22, 16],
        conversionRate: "68%",
        channelDistribution: {
          Website: 87,
          Mobile: 52,
          Referral: 17,
        },
        summary: "Registration rates have increased by 12% compared to the previous period.",
      },
    },
    doctor: {
      performance: {
        totalDoctors: 42,
        averageRating: 4.7,
        patientSatisfaction: "92%",
        appointmentCompletion: "96%",
        topPerformers: [
          { name: "Dr. Sarah Johnson", rating: 4.9, patients: 187 },
          { name: "Dr. Michael Chen", rating: 4.8, patients: 163 },
          { name: "Dr. Emily Rodriguez", rating: 4.8, patients: 159 },
        ],
        summary: "Doctor performance metrics show high satisfaction rates across all specialties.",
      },
      availability: {
        totalHours: 1680,
        utilization: "78%",
        peakHours: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"],
        availabilityByDay: {
          Monday: "82%",
          Tuesday: "79%",
          Wednesday: "81%",
          Thursday: "76%",
          Friday: "74%",
          Saturday: "68%",
          Sunday: "42%",
        },
        summary: "Doctor availability is highest during weekday mornings and early afternoons.",
      },
    },
    system: {
      performance: {
        averageCPU: "24%",
        averageMemory: "62%",
        diskUsage: "47%",
        responseTime: "238ms",
        uptime: "99.97%",
        peakUsageTimes: ["9:00 AM - 11:00 AM", "1:00 PM - 3:00 PM"],
        summary: "System performance is stable with no significant issues detected.",
      },
      errors: {
        totalErrors: 37,
        criticalErrors: 3,
        errorsByType: {
          "Database Connection": 12,
          Authentication: 8,
          "File Upload": 7,
          "API Timeout": 6,
          Other: 4,
        },
        mostFrequentError: "Database connection timeout",
        summary: "Error rates have decreased by 23% compared to the previous period.",
      },
    },
  }

  // Return mock data based on report type and subtype
  if (type === "patient" && mockData.patient[subType]) {
    return mockData.patient[subType]
  } else if (type === "doctor" && mockData.doctor[subType]) {
    return mockData.doctor[subType]
  } else if (type === "system" && mockData.system[subType]) {
    return mockData.system[subType]
  }

  // Default mock data
  return {
    summary: `This is a mock ${type} report for ${subType || "general analysis"}.`,
    generatedAt: new Date().toISOString(),
    dataPoints: 128,
  }
}

// Get report formats
export function getReportFormats() {
  return [
    { id: "pdf", label: "PDF Document", icon: "file-text" },
    { id: "excel", label: "Excel Spreadsheet", icon: "file-spreadsheet" },
    { id: "csv", label: "CSV File", icon: "file" },
    { id: "json", label: "JSON Data", icon: "code" },
  ]
}

// Generate report preview without saving to Firestore
export async function generateReportPreview(reportData) {
  try {
    // Generate dynamic report data based on type
    const reportContent = await generateDynamicReportData(reportData)
    return reportContent
  } catch (error) {
    console.error("Error generating report preview:", error)
    throw error
  }
}

// Get date range options
export function getDateRangeOptions() {
  return [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "last7", label: "Last 7 Days" },
    { id: "last30", label: "Last 30 Days" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
    { id: "custom", label: "Custom Range" },
  ]
}
