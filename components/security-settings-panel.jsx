"use client"

import { useState, useEffect } from "react"
import { Key, Shield, LogOut, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getUserSessions, revokeSession, revokeAllOtherSessions, formatSessionTime } from "@/lib/session-management"
import { SuspiciousLoginHistory } from "@/components/suspicious-login-history"

export function SecuritySettingsPanel({ userRole }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("password")
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [revokeAllLoading, setRevokeAllLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return

      try {
        setSessionsLoading(true)
        const userSessions = await getUserSessions(user.uid)
        setSessions(userSessions)
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchSessions()
  }, [user])

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault()

    // Reset messages
    setPasswordError("")
    setPasswordSuccess("")

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    try {
      setPasswordLoading(true)

      // In a real app, you would implement the actual password change logic here
      // For this demo, we'll simulate a successful password change
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setPasswordSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError("Failed to update password. Please try again.")
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle 2FA toggle
  const handleToggle2FA = async () => {
    try {
      setTwoFactorLoading(true)

      // In a real app, you would implement the actual 2FA toggle logic here
      // For this demo, we'll simulate the toggle
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setTwoFactorEnabled(!twoFactorEnabled)
    } catch (error) {
      console.error("Error toggling 2FA:", error)
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // Handle session revocation
  const handleRevokeSession = async (sessionId) => {
    try {
      setRevokeLoading(true)
      await revokeSession(sessionId)
      setSessions(sessions.filter((session) => session.id !== sessionId))
    } catch (error) {
      console.error("Error revoking session:", error)
    } finally {
      setRevokeLoading(false)
    }
  }

  // Handle revocation of all other sessions
  const handleRevokeAllOtherSessions = async () => {
    try {
      setRevokeAllLoading(true)
      await revokeAllOtherSessions(user.uid)
      setSessions(sessions.filter((session) => session.isCurrentSession))
    } catch (error) {
      console.error("Error revoking all sessions:", error)
    } finally {
      setRevokeAllLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-earth-beige">
        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center px-4 py-2 font-medium ${
            activeTab === "password"
              ? "text-soft-amber border-b-2 border-soft-amber"
              : "text-drift-gray hover:text-graphite"
          }`}
        >
          <Key className="mr-2 h-4 w-4" />
          Password
        </button>
        <button
          onClick={() => setActiveTab("authentication")}
          className={`flex items-center px-4 py-2 font-medium ${
            activeTab === "authentication"
              ? "text-soft-amber border-b-2 border-soft-amber"
              : "text-drift-gray hover:text-graphite"
          }`}
        >
          <Shield className="mr-2 h-4 w-4" />
          Authentication
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center px-4 py-2 font-medium ${
            activeTab === "sessions"
              ? "text-soft-amber border-b-2 border-soft-amber"
              : "text-drift-gray hover:text-graphite"
          }`}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center px-4 py-2 font-medium ${
            activeTab === "activity"
              ? "text-soft-amber border-b-2 border-soft-amber"
              : "text-drift-gray hover:text-graphite"
          }`}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Login Activity
        </button>
      </div>

      {/* Password Management */}
      {activeTab === "password" && (
        <div className="bg-white p-6 rounded-lg border border-pale-stone shadow-sm">
          <div className="flex items-center mb-4">
            <Key className="h-5 w-5 text-soft-amber mr-2" />
            <h3 className="text-lg font-medium text-graphite">Password Management</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-graphite mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-graphite mb-1">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-graphite mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
                required
              />
            </div>

            {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
            {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50"
            >
              {passwordLoading ? (
                <>
                  <span className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Authentication Section */}
      {activeTab === "authentication" && (
        <div className="bg-white p-6 rounded-lg border border-pale-stone shadow-sm">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-soft-amber mr-2" />
            <h3 className="text-lg font-medium text-graphite">Two-Factor Authentication</h3>
          </div>

          <div className="bg-gray-50 p-4 border border-earth-beige rounded-md mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-graphite">Two-Factor Authentication (2FA)</p>
                <p className="text-sm text-drift-gray mt-1">
                  Add an extra layer of security to your account by requiring a verification code in addition to your
                  password.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={twoFactorEnabled}
                  onChange={handleToggle2FA}
                  disabled={twoFactorLoading}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-soft-amber peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-soft-amber"></div>
              </label>
            </div>
          </div>

          <h4 className="font-medium text-graphite mb-3">Recovery Options</h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-graphite">Recovery Email</p>
              <div className="flex items-center mt-1">
                <input
                  type="email"
                  placeholder="backup@example.com"
                  className="flex-1 px-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
                />
                <button className="ml-2 px-3 py-2 bg-soft-amber text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2">
                  Update
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-graphite">Recovery Phone</p>
              <div className="flex items-center mt-1">
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="flex-1 px-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
                />
                <button className="ml-2 px-3 py-2 bg-soft-amber text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2">
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Section */}
      {activeTab === "sessions" && (
        <div className="bg-white p-6 rounded-lg border border-pale-stone shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <LogOut className="h-5 w-5 text-soft-amber mr-2" />
              <h3 className="text-lg font-medium text-graphite">Active Sessions</h3>
            </div>
            <button
              onClick={handleRevokeAllOtherSessions}
              disabled={revokeAllLoading || sessions.filter((s) => !s.isCurrentSession).length === 0}
              className="px-3 py-1.5 text-sm bg-soft-amber text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50"
            >
              {revokeAllLoading ? (
                <>
                  <span className="inline-block h-3 w-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Revoking...
                </>
              ) : (
                "Sign Out All Other Devices"
              )}
            </button>
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-4 border-soft-amber border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-drift-gray">No active sessions found</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 border rounded-md ${
                    session.isCurrentSession ? "border-soft-amber bg-amber-50" : "border-earth-beige bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-graphite flex items-center">
                        {session.deviceName}
                        {session.isCurrentSession && (
                          <span className="ml-2 text-xs bg-soft-amber text-white px-2 py-0.5 rounded-full">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-drift-gray mt-1">
                        <span>IP: {session.ipAddress}</span>
                        <span className="mx-2">•</span>
                        <span>Last active: {formatSessionTime(session.lastActive)}</span>
                      </div>
                    </div>
                    {!session.isCurrentSession && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokeLoading}
                        className="px-3 py-1.5 text-sm border border-red-600 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Login Activity Section */}
      {activeTab === "activity" && (
        <div className="bg-white p-6 rounded-lg border border-pale-stone shadow-sm">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-soft-amber mr-2" />
            <h3 className="text-lg font-medium text-graphite">Suspicious Login Activity</h3>
          </div>

          {user ? (
            <SuspiciousLoginHistory userId={user.uid} />
          ) : (
            <div className="text-center py-4 text-drift-gray">Please sign in to view login activity</div>
          )}
        </div>
      )}
    </div>
  )
}
