"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Eye,
  Trash2,
  UserX,
  Download,
  X,
  Calendar,
  Users,
  UserCheck,
  AlertCircle,
  UserCog,
  CheckCircle,
  ChevronDown,
} from "lucide-react"
import {
  collection,
  query,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  where,
  getCountFromServer,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import PaginationControls from "@/components/pagination-controls"

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [lastVisible, setLastVisible] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    recent: 0,
  })
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [actionSuccess, setActionSuccess] = useState({ show: false, message: "", type: "" })
  const PATIENTS_PER_PAGE = 10

  // Fetch patients count for stats
  useEffect(() => {
    async function fetchStats() {
      try {
        // Query for all patients
        const totalQuery = query(collection(db, "users"), where("role", "==", "patient"))
        const totalSnapshot = await getCountFromServer(totalQuery)
        const totalCount = totalSnapshot.data().count

        // Get all patient documents to properly count by status
        const patientsSnapshot = await getDocs(totalQuery)

        // Count patients by status
        let activeCount = 0
        let inactiveCount = 0

        patientsSnapshot.forEach((doc) => {
          const data = doc.data()
          // Consider patients active by default if status is missing
          if (!data.status || data.status === "active") {
            activeCount++
          } else if (data.status === "inactive") {
            inactiveCount++
          }
        })

        // Count recent patients (last 7 days)
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        let recentCount = 0
        patientsSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.createdAt && data.createdAt.toDate() >= oneWeekAgo) {
            recentCount++
          }
        })

        setStats({
          total: totalCount,
          active: activeCount,
          inactive: inactiveCount,
          recent: recentCount,
        })

        // Calculate total pages
        setTotalPages(Math.ceil(totalCount / PATIENTS_PER_PAGE))
      } catch (error) {
        console.error("Error fetching stats:", error)
        // Set default values in case of error
        setStats({
          total: 0,
          active: 0,
          inactive: 0,
          recent: 0,
        })
      }
    }

    fetchStats()
  }, [])

  // Fetch patients data
  useEffect(() => {
    async function fetchPatients() {
      setIsLoading(true)
      try {
        let patientsQuery

        if (lastVisible && currentPage > 1) {
          patientsQuery = query(
            collection(db, "users"),
            where("role", "==", "patient"),
            orderBy("createdAt", "desc"),
            startAfter(lastVisible),
            limit(PATIENTS_PER_PAGE),
          )
        } else {
          patientsQuery = query(
            collection(db, "users"),
            where("role", "==", "patient"),
            orderBy("createdAt", "desc"),
            limit(PATIENTS_PER_PAGE),
          )
        }

        const querySnapshot = await getDocs(patientsQuery)
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
        setLastVisible(lastDoc)

        const fetchedPatients = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.displayName || "Unknown",
            email: data.email || "No email",
            phone: data.phone || data.phoneNumber || "No phone",
            lastLogin: data.lastLogin ? new Date(data.lastLogin.toDate()).toLocaleString() : "Never",
            status: data.status || "active",
            avatar: data.photoURL || "/placeholder.svg?height=40&width=40",
            createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : "Unknown",
            dob: data.dateOfBirth || data.dob || "Not provided",
            address: data.address || "Not provided",
          }
        })

        setPatients(fetchedPatients)
        setFilteredPatients(fetchedPatients)
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [currentPage])

  // Handle search and filter
  useEffect(() => {
    let result = patients

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (patient.phone && patient.phone.includes(searchTerm)),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((patient) => patient.status === statusFilter)
    }

    setFilteredPatients(result)
  }, [searchTerm, statusFilter, patients])

  // Handle patient deletion
  const handleDeletePatient = async () => {
    if (selectedPatient) {
      try {
        setIsLoading(true)
        await deleteDoc(doc(db, "users", selectedPatient.id))

        // Update local state
        const updatedPatients = patients.filter((patient) => patient.id !== selectedPatient.id)
        setPatients(updatedPatients)
        setFilteredPatients(
          updatedPatients.filter((patient) => {
            if (statusFilter !== "all") {
              return patient.status === statusFilter
            }
            return true
          }),
        )

        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          [selectedPatient.status]: prev[selectedPatient.status] - 1,
        }))

        setShowDeleteModal(false)
        setSelectedPatient(null)

        // Show success message
        setActionSuccess({
          show: true,
          message: `Patient ${selectedPatient.name} has been deleted successfully.`,
          type: "delete",
        })

        // Hide success message after 3 seconds
        setTimeout(() => {
          setActionSuccess({ show: false, message: "", type: "" })
        }, 3000)
      } catch (error) {
        console.error("Error deleting patient:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle patient deactivation
  const handleDeactivatePatient = async () => {
    if (selectedPatient) {
      try {
        setIsLoading(true)
        const newStatus = selectedPatient.status === "active" ? "inactive" : "active"

        await updateDoc(doc(db, "users", selectedPatient.id), {
          status: newStatus,
        })

        // Update local state
        const updatedPatients = patients.map((patient) => {
          if (patient.id === selectedPatient.id) {
            return { ...patient, status: newStatus }
          }
          return patient
        })

        setPatients(updatedPatients)
        setFilteredPatients(
          updatedPatients.filter((patient) => {
            if (statusFilter !== "all") {
              return patient.status === statusFilter
            }
            return true
          }),
        )

        // Update stats
        if (newStatus === "active") {
          setStats((prev) => ({
            ...prev,
            active: prev.active + 1,
            inactive: prev.inactive - 1,
          }))
        } else {
          setStats((prev) => ({
            ...prev,
            active: prev.active - 1,
            inactive: prev.inactive + 1,
          }))
        }

        setShowDeactivateModal(false)
        setSelectedPatient(null)

        // Show success message
        setActionSuccess({
          show: true,
          message: `Patient ${selectedPatient.name} has been ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
          type: newStatus === "active" ? "activate" : "deactivate",
        })

        // Hide success message after 3 seconds
        setTimeout(() => {
          setActionSuccess({ show: false, message: "", type: "" })
        }, 3000)
      } catch (error) {
        console.error("Error updating patient status:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Stop event propagation for action buttons
  const handleActionClick = (e, action, patient) => {
    e.stopPropagation()
    setSelectedPatient(patient)
    if (action === "delete") {
      setShowDeleteModal(true)
    } else if (action === "status") {
      setShowDeactivateModal(true)
    } else if (action === "view") {
      router.push(`/admin/patients/${patient.id}`)
    }
  }

  // Loading state
  if (isLoading && currentPage === 1) {
    return (
      <div className="animate-pulse w-full">
        <div className="h-40 bg-gray-200 rounded-xl mb-6"></div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gray-200 h-8 w-48 rounded"></h1>
          <div className="bg-gray-200 h-10 w-32 rounded"></div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 w-full">
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="bg-gray-200 h-10 w-full md:w-64 rounded"></div>
            <div className="bg-gray-200 h-10 w-full md:w-48 rounded"></div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="py-3 px-4 border-b border-earth-beige">
                      <div className="bg-gray-200 h-6 w-full rounded"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-4 border-b border-earth-beige">
                        <div className="bg-gray-200 h-6 w-full rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <AdminHeaderBanner
        title="Patients Management"
        subtitle="Monitor and manage all patient accounts"
        stats={[
          {
            label: "Total Patients",
            value: stats.total,
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "Active",
            value: stats.active,
            icon: <UserCheck className="h-4 w-4" />,
          },
          {
            label: "Inactive",
            value: stats.inactive,
            icon: <UserX className="h-4 w-4" />,
          },
          {
            label: "New (7 days)",
            value: stats.recent,
            icon: <Calendar className="h-4 w-4" />,
          },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-graphite">Patients</h1>
        <button
          onClick={() => (window.location.href = "/admin/reports?type=patients")}
          className="inline-flex items-center px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>

      {/* Success message */}
      {actionSuccess.show && (
        <div
          className={`mb-6 p-4 rounded-md flex items-center ${
            actionSuccess.type === "delete"
              ? "bg-red-50 text-red-800"
              : actionSuccess.type === "activate"
                ? "bg-green-50 text-green-800"
                : "bg-amber-50 text-amber-800"
          }`}
        >
          {actionSuccess.type === "delete" ? (
            <AlertCircle className="h-5 w-5 mr-2" />
          ) : actionSuccess.type === "activate" ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <UserX className="h-5 w-5 mr-2" />
          )}
          <span>{actionSuccess.message}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full pl-10 pr-4 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-drift-gray" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-drift-gray hover:text-graphite"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="relative w-full md:w-48">
            <button
              onClick={() => setStatusDropdownOpen((prev) => !prev)}
              className="w-full inline-flex items-center justify-between pl-10 pr-3 py-2 border border-earth-beige rounded-md bg-white text-graphite text-sm font-medium shadow-sm transition hover:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
            >
              <span className="flex items-center">
                <Filter className="h-5 w-5 text-drift-gray mr-2 absolute left-3" />
                {statusFilter === "all" ? "All Status" : statusFilter === "active" ? "Active" : "Inactive"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`absolute left-0 right-0 mt-1 origin-top rounded-lg border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out ${
                statusDropdownOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
              }`}
            >
              {[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value)
                    setStatusDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    statusFilter === option.value ? "bg-soft-amber text-white" : "text-graphite hover:bg-pale-stone"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {/* Mobile-friendly cards */}
          <div className="grid gap-3 sm:hidden">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-earth-beige animate-pulse bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 rounded-lg border border-earth-beige bg-white shadow-sm"
                  onClick={() => router.push(`/admin/patients/${patient.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {patient.avatar ? (
                        <img
                          src={patient.avatar || "/placeholder.svg"}
                          alt={patient.name}
                          className="h-12 w-12 object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                      ) : (
                        <UserCog className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-graphite truncate">{patient.name}</p>
                      <p className="text-xs text-drift-gray truncate">{patient.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        patient.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {patient.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-graphite">
                    <div>
                      <p className="text-drift-gray">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                    <div>
                      <p className="text-drift-gray">Last Login</p>
                      <p className="font-medium">{patient.lastLogin}</p>
                    </div>
                    <div>
                      <p className="text-drift-gray">Joined</p>
                      <p className="font-medium">{patient.createdAt}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 col-span-2">
                      <button
                        onClick={(e) => handleActionClick(e, "view", patient)}
                        className="p-2 text-soft-amber hover:bg-amber-50 rounded-full"
                        aria-label="View patient"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => handleActionClick(e, "status", patient)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                        aria-label="Toggle status"
                      >
                        <UserCog className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => handleActionClick(e, "delete", patient)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        aria-label="Delete patient"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-drift-gray py-6 bg-cream rounded-lg border border-earth-beige">
                No patients found.
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Patient
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Email
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Phone
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Last Login
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="h-5 w-40 bg-gray-200 rounded"></div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="h-5 w-28 bg-gray-200 rounded"></div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="h-5 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-pale-stone/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/patients/${patient.id}`)}
                  >
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-100 flex items-center justify-center">
                          {patient.avatar ? (
                            <img
                              src={patient.avatar || "/placeholder.svg"}
                              alt={patient.name}
                              className="h-10 w-10 object-cover"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          ) : (
                            <UserCog className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <span className="font-medium text-graphite">{patient.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-drift-gray">{patient.email}</td>
                    <td className="py-4 px-4 border-b border-earth-beige text-drift-gray">{patient.phone}</td>
                    <td className="py-4 px-4 border-b border-earth-beige text-drift-gray">{patient.lastLogin}</td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          patient.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {patient.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => handleActionClick(e, "view", patient)}
                          className="p-1.5 rounded-full hover:bg-soft-amber/10 text-soft-amber transition-colors"
                          aria-label="View patient details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleActionClick(e, "status", patient)}
                          className={`p-1.5 rounded-full transition-colors ${
                            patient.status === "active"
                              ? "hover:bg-amber-50 text-amber-600"
                              : "hover:bg-green-50 text-green-600"
                          }`}
                          aria-label={patient.status === "active" ? "Deactivate patient" : "Activate patient"}
                        >
                          {patient.status === "active" ? (
                            <UserX className="h-5 w-5" />
                          ) : (
                            <UserCheck className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleActionClick(e, "delete", patient)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                          aria-label="Delete patient"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-drift-gray border-b border-earth-beige">
                    No patients found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-semibold text-graphite mb-2">Delete Patient</h3>
            <p className="text-drift-gray mb-4">
              Are you sure you want to delete {selectedPatient?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-earth-beige rounded-md text-drift-gray hover:bg-pale-stone transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-semibold text-graphite mb-2">
              {selectedPatient?.status === "active" ? "Deactivate" : "Activate"} Patient
            </h3>
            <p className="text-drift-gray mb-4">
              Are you sure you want to {selectedPatient?.status === "active" ? "deactivate" : "activate"}{" "}
              {selectedPatient?.name}?
              {selectedPatient?.status === "active" && (
                <span className="block mt-2 text-sm text-amber-600">
                  This will prevent the patient from logging into their account.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-earth-beige rounded-md text-drift-gray hover:bg-pale-stone transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivatePatient}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  selectedPatient?.status === "active"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : selectedPatient?.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
