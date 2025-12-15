"use client"

import { useState, useEffect } from "react"
import { UserPlus, Edit, Trash2, Shield, Search, AlertCircle, Users, UserCheck, Lock } from "lucide-react"
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { logAdminAction } from "@/lib/admin-utils"
import { useAuth } from "@/contexts/auth-context"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { SuccessNotification } from "@/components/success-notification"

export default function RolesPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { userProfile } = useAuth()

  const [stats, setStats] = useState([
    { label: "Total Roles", value: "0", icon: <Shield className="h-4 w-4" /> },
    { label: "System Roles", value: "0", icon: <Lock className="h-4 w-4" /> },
    { label: "Total Users", value: "0", icon: <Users className="h-4 w-4" /> },
    { label: "Active Permissions", value: "0", icon: <UserCheck className="h-4 w-4" /> },
  ])

  // Fetch roles from Firestore
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true)
        const rolesRef = collection(db, "roles")
        const snapshot = await getDocs(rolesRef)

        if (snapshot.empty) {
          // If no roles exist, create default roles
          await createDefaultRoles()
          const newSnapshot = await getDocs(rolesRef)
          const rolesData = newSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setRoles(rolesData)
          updateStats(rolesData)
        } else {
          const rolesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setRoles(rolesData)
          updateStats(rolesData)
        }
      } catch (err) {
        console.error("Error fetching roles:", err)
        setError("Failed to load roles. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [])

  // Create default roles if they don't exist
  const createDefaultRoles = async () => {
    try {
      const defaultRoles = [
        {
          name: "Super Admin",
          description: "Full system access with all permissions",
          users: 1,
          permissions: {
            users: { view: true, create: true, edit: true, delete: true },
            doctors: { view: true, create: true, edit: true, delete: true },
            patients: { view: true, create: true, edit: true, delete: true },
            appointments: { view: true, create: true, edit: true, delete: true },
            billing: { view: true, create: true, edit: true, delete: true },
            reports: { view: true, create: true, edit: true, delete: true },
            settings: { view: true, create: true, edit: true, delete: true },
            logs: { view: true, create: true, edit: true, delete: true },
            notifications: { view: true, create: true, edit: true, delete: true },
            feedback: { view: true, create: true, edit: true, delete: true },
          },
          isSystem: true,
        },
        {
          name: "Doctor",
          description: "Medical professional with patient management capabilities",
          users: 0,
          permissions: {
            patients: { view: true, create: false, edit: true, delete: false },
            appointments: { view: true, create: true, edit: true, delete: true },
            prescriptions: { view: true, create: true, edit: true, delete: true },
            records: { view: true, create: true, edit: true, delete: false },
            messages: { view: true, create: true, edit: false, delete: false },
            feedback: { view: true, create: true, edit: false, delete: false },
          },
          isSystem: true,
        },
        {
          name: "Patient",
          description: "Standard patient account with limited access",
          users: 0,
          permissions: {
            profile: { view: true, create: false, edit: true, delete: false },
            appointments: { view: true, create: true, edit: false, delete: true },
            prescriptions: { view: true, create: false, edit: false, delete: false },
            records: { view: true, create: false, edit: false, delete: false },
            messages: { view: true, create: true, edit: false, delete: false },
            feedback: { view: true, create: true, edit: false, delete: false },
          },
          isSystem: true,
        },
      ]

      for (const role of defaultRoles) {
        await addRole(role)
      }

      console.log("Default roles created")
    } catch (err) {
      console.error("Error creating default roles:", err)
    }
  }

  // Add a new role to Firestore
  const addRole = async (roleData) => {
    try {
      const rolesRef = collection(db, "roles")
      const docRef = doc(rolesRef, roleData.name.toLowerCase().replace(/\s+/g, "-"))
      await updateDoc(docRef, roleData).catch(async () => {
        // If document doesn't exist, create it
        const docRef = doc(db, "roles", roleData.name.toLowerCase().replace(/\s+/g, "-"))
        await setDoc(docRef, roleData)
      })
      return docRef.id
    } catch (err) {
      console.error("Error adding role:", err)
      throw err
    }
  }

  // Update stats based on roles data
  const updateStats = (rolesData) => {
    const totalRoles = rolesData.length
    const systemRoles = rolesData.filter((role) => role.isSystem).length
    const totalUsers = rolesData.reduce((sum, role) => sum + (role.users || 0), 0)

    // Count active permissions across all roles
    let activePermissions = 0
    rolesData.forEach((role) => {
      if (role.permissions) {
        Object.values(role.permissions).forEach((category) => {
          Object.values(category).forEach((value) => {
            if (value === true) activePermissions++
          })
        })
      }
    })

    setStats([
      { label: "Total Roles", value: totalRoles.toString(), icon: <Shield className="h-4 w-4" /> },
      { label: "System Roles", value: systemRoles.toString(), icon: <Lock className="h-4 w-4" /> },
      { label: "Total Users", value: totalUsers.toString(), icon: <Users className="h-4 w-4" /> },
      { label: "Active Permissions", value: activePermissions.toString(), icon: <UserCheck className="h-4 w-4" /> },
    ])
  }

  const handleEditRole = (role) => {
    // Don't allow editing Super Admin role
    if (role.name === "Super Admin") {
      setError("Super Admin role cannot be modified")
      setTimeout(() => setError(null), 3000)
      return
    }

    // Only allow editing Patient and Doctor roles
    if (role.name !== "Patient" && role.name !== "Doctor") {
      setError("Only Patient and Doctor roles can be modified")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsEditing(true)
    setSelectedRole({ ...role })
  }

  const handleSaveRole = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate role
      if (!selectedRole.name || !selectedRole.description) {
        setError("Role name and description are required")
        setSaving(false)
        return
      }

      // Update role in Firestore
      const roleRef = doc(db, "roles", selectedRole.id)
      await updateDoc(roleRef, {
        description: selectedRole.description,
        permissions: selectedRole.permissions,
        updatedAt: new Date(),
      })

      // Log the action
      await logAdminAction("Role Updated", `Role ${selectedRole.name} was updated`, userProfile)

      // Update local state
      setRoles(roles.map((role) => (role.id === selectedRole.id ? { ...selectedRole } : role)))

      // Show success notification
      setSuccessMessage(`Role ${selectedRole.name} updated successfully`)
      setShowSuccessNotification(true)
      console.log("Success notification should appear now")

      // Close modal
      setIsEditing(false)
      setSelectedRole(null)
    } catch (err) {
      console.error("Error saving role:", err)
      setError("Failed to save role. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Update permission in the selected role
  const updatePermission = (category, action, value) => {
    if (!selectedRole) return

    setSelectedRole({
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [category]: {
          ...selectedRole.permissions[category],
          [action]: value,
        },
      },
    })
  }

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get permission categories for a role
  const getPermissionCategories = (role) => {
    if (!role.permissions) return []
    return Object.keys(role.permissions)
  }

  // Count users with each role
  useEffect(() => {
    const countRoleUsers = async () => {
      try {
        const usersRef = collection(db, "users")
        const snapshot = await getDocs(usersRef)

        const roleCounts = {
          "super admin": 0,
          doctor: 0,
          patient: 0,
        }

        snapshot.forEach((doc) => {
          const userData = doc.data()
          const role = userData.role?.toLowerCase() || "patient"
          roleCounts[role] = (roleCounts[role] || 0) + 1
        })

        // Update roles with user counts
        setRoles((prevRoles) => {
          const updatedRoles = prevRoles.map((role) => ({
            ...role,
            users: roleCounts[role.name.toLowerCase()] || 0,
          }))
          updateStats(updatedRoles)
          return updatedRoles
        })
      } catch (err) {
        console.error("Error counting role users:", err)
      }
    }

    if (roles.length > 0) {
      countRoleUsers()
    }
  }, [roles.length])

  // Handle closing the success notification
  const handleCloseSuccessNotification = () => {
    setShowSuccessNotification(false)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <AdminHeaderBanner
        title="Roles & Permissions"
        subtitle="Manage user roles and access permissions"
        stats={stats}
      />

      {/* Success Notification */}
      <SuccessNotification
        message={successMessage}
        isVisible={showSuccessNotification}
        onClose={handleCloseSuccessNotification}
        type="success"
        position="top-right"
        duration={5000}
      />

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 flex justify-end">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:border-soft-amber"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-drift-gray" />
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-soft-amber border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-drift-gray">Loading roles...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-earth-beige">
              <thead>
                <tr className="bg-pale-stone/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-drift-gray uppercase tracking-wider">
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-drift-gray uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-drift-gray uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-drift-gray uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-beige">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-pale-stone/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-soft-amber mr-2" />
                        <div>
                          <div className="text-sm font-medium text-graphite">{role.name}</div>
                          <div className="text-xs text-drift-gray">
                            {role.permissions ? Object.keys(role.permissions).length : 0} permissions
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-drift-gray">{role.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-drift-gray">{role.users} users</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-drift-gray">
                      {role.name === "Patient" || role.name === "Doctor" ? (
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-soft-amber hover:text-soft-amber/80 mr-3"
                        >
                          <Edit className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-gray-300 cursor-not-allowed mr-3"
                          title={
                            role.name === "Super Admin"
                              ? "Super Admin role cannot be modified"
                              : "Only Patient and Doctor roles can be modified"
                          }
                        >
                          <Edit className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </button>
                      )}
                      <button
                        disabled
                        className="text-gray-300 cursor-not-allowed"
                        title="Deleting roles is not allowed"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-drift-gray">
                      No roles found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Editor Modal */}
      {isEditing && selectedRole && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto">
            <div className="bg-white px-6 pt-5 pb-4 sm:p-6 rounded-t-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-soft-amber/20 mr-4">
                  <UserPlus className="h-6 w-6 text-soft-amber" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg leading-6 font-medium text-graphite">Edit {selectedRole.name} Role</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-graphite mb-1">Role Name</label>
                      <input
                        type="text"
                        value={selectedRole.name}
                        disabled
                        className="w-full px-3 py-2 border border-earth-beige rounded-md bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-drift-gray mt-1">Role names cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-graphite mb-1">Description</label>
                      <textarea
                        rows="2"
                        value={selectedRole.description}
                        onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:border-soft-amber"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-graphite mb-1">Permissions</label>
                      <div className="max-h-60 overflow-y-auto border border-earth-beige rounded-md p-3">
                        {getPermissionCategories(selectedRole).map((category, idx) => (
                          <div key={idx} className="mb-4">
                            <div className="flex items-center mb-2">
                              <label className="block text-sm font-medium text-graphite capitalize">{category}</label>
                            </div>
                            <div className="ml-4 grid grid-cols-2 gap-2">
                              {Object.keys(selectedRole.permissions[category]).map((action, actionIdx) => (
                                <div key={actionIdx} className="flex items-center">
                                  <input
                                    id={`${idx}-${actionIdx}`}
                                    type="checkbox"
                                    checked={selectedRole.permissions[category][action]}
                                    onChange={(e) => updatePermission(category, action, e.target.checked)}
                                    className="h-4 w-4 text-soft-amber focus:ring-soft-amber border-earth-beige rounded"
                                  />
                                  <label
                                    htmlFor={`${idx}-${actionIdx}`}
                                    className="ml-2 block text-xs text-drift-gray capitalize"
                                  >
                                    {action}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-pale-stone/30 px-6 py-4 rounded-b-lg flex flex-row-reverse">
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={saving}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-soft-amber text-base font-medium text-white hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber ml-3 disabled:bg-soft-amber/50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setSelectedRole(null)
                }}
                disabled={saving}
                className="inline-flex justify-center rounded-md border border-earth-beige shadow-sm px-4 py-2 bg-white text-base font-medium text-graphite hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-beige disabled:bg-white/50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
