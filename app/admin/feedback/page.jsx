"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquare, RefreshCw, Send, AlertCircle, Search, ChevronDown, Loader2, Star } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminHeaderBanner } from "@/components/admin/admin-header-banner"
import ProfileImage from "@/components/profile-image"
import { getAllFeedback, respondToFeedback } from "@/lib/feedback-utils"
import { useAuth } from "@/contexts/auth-context"
import { getDoc, doc, collection, query, orderBy, getDocs, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminFeedbackPage() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState("feedback")
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selected, setSelected] = useState(null)
  const [responseText, setResponseText] = useState("")
  const [responding, setResponding] = useState(false)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [adminProfiles, setAdminProfiles] = useState({})
  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(false)
  const [testimonialSearch, setTestimonialSearch] = useState("")
  const [updatingLanding, setUpdatingLanding] = useState(false)

  const loadFeedback = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      const { feedback: fetched, lastVisible, hasMore: more } = await getAllFeedback(15, reset ? null : lastDoc)
      setLastDoc(lastVisible || null)
      setHasMore(more)
      setFeedback((prev) => (reset ? fetched : [...prev, ...fetched]))
      
      // Fetch admin profiles for responses
      const adminIds = fetched
        .filter((item) => item.status === "responded" && item.respondedBy)
        .map((item) => item.respondedBy)
        .filter((value, index, self) => self.indexOf(value) === index) // Get unique admin IDs

      const adminProfilesData = { ...adminProfiles }
      for (const adminId of adminIds) {
        if (!adminProfilesData[adminId]) {
          try {
            // First try to get from admins collection
            const adminDoc = await getDoc(doc(db, "admins", adminId))

            if (adminDoc.exists()) {
              adminProfilesData[adminId] = adminDoc.data()
            } else {
              // If not found in admins collection, try users collection with admin role
              const userDoc = await getDoc(doc(db, "users", adminId))

              if (userDoc.exists() && userDoc.data().role === "admin") {
                adminProfilesData[adminId] = userDoc.data()
              }
            }
          } catch (error) {
            console.error(`Error fetching admin ${adminId}:`, error)
          }
        }
      }
      // Always keep current admin cached for fallback (store under uid and "admin")
      if (user?.uid) {
        adminProfilesData[user.uid] = {
          displayName: user.displayName || "Admin",
          photoURL: user.photoURL || null,
        }
        adminProfilesData.admin = adminProfilesData[user.uid]
      }

      setAdminProfiles(adminProfilesData)
      
      if (reset) {
        setSelected(null)
        setResponseText("")
      }
    } catch (err) {
      console.error(err)
      setError("Unable to load feedback right now. Please try again.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadTestimonials = async () => {
    try {
      setLoadingTestimonials(true)
      const testimonialsRef = collection(db, "testimonials")
      const q = query(testimonialsRef, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

      // Enrich testimonials with user context
      const enriched = await Promise.all(
        items.map(async (item) => {
          try {
            if (!item.userId) return { ...item }
            const userDoc = await getDoc(doc(db, "users", item.userId))
            if (!userDoc.exists()) return { ...item }

            const userData = userDoc.data() || {}
            return {
              ...item,
              userRole: userData.role || item.userRole || "patient",
              specialty: userData.specialty || userData.specialization || userData.speciality || null,
              userName: item.userName || userData.displayName || userData.name || "User",
              userProfile: item.userProfile || userData.photoURL || null,
            }
          } catch (err) {
            console.warn("Failed to enrich testimonial user data", err)
            return { ...item }
          }
        })
      )

      setTestimonials(enriched)
    } catch (error) {
      if (error?.code === "permission-denied") {
        console.warn("Testimonials load blocked by permissions; showing none.")
      } else {
        console.error("Error loading testimonials:", error)
      }
      setTestimonials([])
    } finally {
      setLoadingTestimonials(false)
    }
  }

  useEffect(() => {
    loadFeedback(true)
    loadTestimonials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleLandingPage = async (testimonialId, currentValue) => {
    try {
      setUpdatingLanding(true)
      setError("") // Clear any previous errors
      const newValue = !currentValue
      
      // Update Firestore - this will trigger real-time listeners on landing page
      await updateDoc(doc(db, "testimonials", testimonialId), {
        showOnLanding: newValue,
      })
      
      // Update local state immediately for instant UI feedback
      setTestimonials((prev) =>
        prev.map((t) => (t.id === testimonialId ? { ...t, showOnLanding: newValue } : t))
      )
      if (selected?.id === testimonialId) {
        setSelected((prev) => ({ ...prev, showOnLanding: newValue }))
      }
      
      // Note: The landing page will automatically update via real-time listener
      // No need to manually refresh - changes appear instantly
    } catch (err) {
      console.error("Error updating landing page status:", err)
      setError("Could not update landing page status. Please try again.")
    } finally {
      setUpdatingLanding(false)
    }
  }

  const stats = useMemo(() => {
    if (activeTab === "testimonials") {
      return [
        { label: "Total testimonials", value: testimonials.length },
        { label: "On landing page", value: testimonials.filter((t) => t.showOnLanding === true).length },
        { label: "Published", value: testimonials.filter((t) => t.published !== false).length },
        { label: "Pending review", value: testimonials.filter((t) => t.published === false).length },
      ]
    }

    const total = feedback.length
    const responded = feedback.filter((f) => f.status === "responded").length
    const pending = total - responded
    const avgRating =
      feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) / feedback.length).toFixed(1)
        : "0.0"

    return [
      { label: "Total feedback", value: total },
      { label: "Pending", value: pending },
      { label: "Responded", value: responded },
      { label: "Avg rating", value: avgRating },
    ]
  }, [feedback, testimonials, activeTab])

  const filteredFeedback = useMemo(() => {
    const term = search.toLowerCase().trim()
    return feedback.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      const matchesType = typeFilter === "all" || item.type === typeFilter
      const matchesSearch =
        !term ||
        item.userName?.toLowerCase().includes(term) ||
        item.message?.toLowerCase().includes(term) ||
        item.type?.toLowerCase().includes(term)
      return matchesStatus && matchesType && matchesSearch
    })
  }, [feedback, search, statusFilter, typeFilter])

  const filteredTestimonials = useMemo(() => {
    const term = testimonialSearch.toLowerCase().trim()
    return testimonials.filter((item) => {
      const matchesSearch =
        !term ||
        item.userName?.toLowerCase().includes(term) ||
        item.message?.toLowerCase().includes(term)
      return matchesSearch
    })
  }, [testimonials, testimonialSearch])

  const handleSelect = async (item) => {
    setSelected(item)
    setResponseText(item.response || "")
  }

  const handleRespond = async () => {
    if (!selected) return
    if (!responseText.trim()) {
      setError("Please enter a response before sending.")
      return
    }

    try {
      setResponding(true)
      setError("")
      const updated = await respondToFeedback(selected.id, responseText.trim(), user?.uid || null)
      setFeedback((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
      setSelected((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
      
      // Update admin profiles if needed (cache current admin under uid and "admin")
      if (user?.uid) {
        setAdminProfiles((prev) => ({
          ...prev,
          [user.uid]: {
            displayName: user.displayName || "Admin",
            photoURL: user.photoURL || null,
          },
          admin: {
            displayName: user.displayName || "Admin",
            photoURL: user.photoURL || null,
          },
        }))
      }
    } catch (err) {
      console.error(err)
      setError("Could not send response. Please try again.")
    } finally {
      setResponding(false)
    }
  }

  // Get admin profile picture
  const getAdminProfilePic = (adminId) => {
    // Prefer cached admin profiles (includes current admin under uid and "admin")
    const profile = adminProfiles[adminId] || (adminId === "admin" && user?.uid ? adminProfiles[user.uid] : null)
    if (profile?.photoURL && typeof profile.photoURL === "string") {
      return profile.photoURL
    }
    if (user?.uid && adminId === user.uid && user.photoURL) {
      return user.photoURL
    }
    return "/admin-interface.png"
  }

  // Get admin name
  const getAdminName = (adminId) => {
    const profile = adminProfiles[adminId] || (adminId === "admin" && user?.uid ? adminProfiles[user.uid] : null)
    if (profile?.displayName) {
      return profile.displayName
    }
    if (adminId === "admin" && user?.displayName) {
      return user.displayName
    }
    if (user?.uid && adminId === user.uid && user.displayName) {
      return user.displayName
    }
    return "Admin"
  }

  const renderFeedbackItem = (item) => (
    <button
      key={item.id}
      onClick={() => handleSelect(item)}
      className={`w-full rounded-lg border p-4 text-left transition hover:border-amber-400 hover:bg-amber-50 ${
        selected?.id === item.id ? "border-amber-500 bg-amber-50" : "border-earth-beige bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-earth-beige">
          <ProfileImage
            src={item.userProfile}
            alt={item.userName || "User"}
            className="h-full w-full"
            role={item.userRole || "patient"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-deep-forest">{item.userName || "Unknown user"}</span>
            <span className="text-xs text-graphite">{item.userRole || "patient"}</span>
          </div>
          <p className="mt-1 text-xs text-drift-gray">{item.date || "—"}</p>
          <p className="mt-2 line-clamp-2 text-sm text-graphite">{item.message || "No message provided."}</p>
          <div className="mt-3 flex items-center space-x-2">
            <span className="rounded-full bg-sandstone px-2 py-1 text-xs capitalize text-deep-forest">
              {item.type || "general"}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                item.status === "responded"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {item.status === "responded" ? "Responded" : "Pending"}
            </span>
            {item.rating ? (
              <span className="flex items-center space-x-1 text-xs text-amber-600">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span>{item.rating}</span>
              </span>
            ) : null}
          </div>
        </div>
        <MessageSquare size={18} className="text-earth-clay flex-shrink-0" />
      </div>
    </button>
  )

  const renderTestimonialItem = (item) => (
    <button
      key={item.id}
      onClick={() => handleSelect(item)}
      className={`w-full rounded-lg border p-4 text-left transition hover:border-amber-400 hover:bg-amber-50 ${
        selected?.id === item.id ? "border-amber-500 bg-amber-50" : "border-earth-beige bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-earth-beige">
          <ProfileImage
            src={item.userProfile}
            alt={item.userName || "User"}
            className="h-full w-full"
            role={item.userRole || "patient"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-deep-forest">{item.userName || "Unknown user"}</span>
            <span className="text-xs text-graphite">{item.userRole || "patient"}</span>
          </div>
          <p className="mt-1 text-xs text-drift-gray">
            {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : item.date || "—"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-graphite">{item.message || "No message provided."}</p>
          <div className="mt-3 flex items-center space-x-2 flex-wrap gap-2">
            {item.rating ? (
              <span className="flex items-center space-x-1 text-xs text-amber-600">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span>{item.rating}</span>
              </span>
            ) : null}
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                item.published !== false
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {item.published !== false ? "Published" : "Pending"}
            </span>
            {item.showOnLanding === true && (
              <span className="rounded-full px-2 py-1 text-xs bg-soft-amber/20 text-soft-amber border border-soft-amber/30 font-semibold">
                On Landing Page
              </span>
            )}
          </div>
        </div>
        <Star size={18} className="text-amber-500 flex-shrink-0" />
      </div>
    </button>
  )

  return (
    <div className="space-y-6">
      <AdminHeaderBanner
        title="Feedback Center"
        subtitle="Review and respond to patient and doctor feedback"
        stats={stats}
      />

      {/* Enhanced tab controls with switch-like appearance */}
      <div className="flex justify-center">
        <div className="flex p-1 bg-earth-beige/20 rounded-full shadow-sm">
          <button
            onClick={() => {
              setActiveTab("feedback")
              setSelected(null)
            }}
            className={`relative px-5 py-2.5 pr-7 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
              activeTab === "feedback" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
          >
            <span>Feedback</span>
            {feedback.length > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                activeTab === "feedback" 
                  ? "bg-white/20 text-white border border-white/30" 
                  : "bg-soft-amber text-white"
              }`}>
                {feedback.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("testimonials")
              setSelected(null)
            }}
            className={`relative px-5 py-2.5 pr-7 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
              activeTab === "testimonials" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
          >
            <span>Testimonials</span>
            {testimonials.length > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                activeTab === "testimonials" 
                  ? "bg-white/20 text-white border border-white/30" 
                  : "bg-soft-amber text-white"
              }`}>
                {testimonials.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
        {activeTab === "feedback" ? (
          <>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-earth-beige bg-cream px-3 py-2">
            <Search size={16} className="text-earth-clay" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feedback by name, type, or message..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-drift-gray"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "responded", label: "Responded" },
              ]}
            />
            <FilterPill
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All" },
                { value: "general", label: "General" },
                { value: "doctor", label: "Doctor" },
                { value: "service", label: "Service" },
              ]}
            />
            <button
              onClick={() => loadFeedback(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-earth-beige px-3 py-2 text-sm text-deep-forest transition hover:border-amber-500 hover:text-amber-700"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-drift-gray">
                <Loader2 size={16} className="animate-spin" />
                Loading feedback...
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="rounded-lg border border-earth-beige bg-cream p-4 text-sm text-drift-gray">
                No feedback found with current filters.
              </div>
            ) : (
              <div className="space-y-3">{filteredFeedback.map((item) => renderFeedbackItem(item))}</div>
            )}

            {hasMore && (
              <button
                onClick={() => loadFeedback(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-earth-beige bg-white px-3 py-2 text-sm text-deep-forest transition hover:border-amber-500 hover:text-amber-700 disabled:opacity-60"
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Load more
              </button>
            )}
          </div>

          <div className="rounded-lg border border-earth-beige bg-cream p-4">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-deep-forest">{selected.userName || "Unknown user"}</p>
                    <p className="text-xs text-graphite">
                          {selected.userRole || "patient"} • {selected.date || selected.createdAt?.toDate ? new Date(selected.createdAt.toDate()).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                        {activeTab === "feedback" && (
                    <span className="rounded-full bg-sandstone px-2 py-1 text-xs capitalize text-deep-forest">
                      {selected.type || "general"}
                    </span>
                        )}
                    {selected.rating ? (
                      <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-amber-700">
                        <Star size={14} className="fill-amber-500 text-amber-500" />
                        {selected.rating}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white p-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-earth-beige">
                    <ProfileImage
                      src={selected.userProfile}
                      alt={selected.userName || "User"}
                      className="h-full w-full"
                      role={selected.userRole}
                    />
                  </div>
                  <div>
                        <p className="text-sm font-medium text-deep-forest">{activeTab === "feedback" ? "Feedback" : "Testimonial"}</p>
                    <p className="text-sm text-graphite">{selected.message || "No message provided."}</p>
                  </div>
                </div>

                    {activeTab === "feedback" && selected.status === "responded" && selected.response && (
                  <div className="rounded-lg bg-white p-3 text-sm text-deep-forest">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-earth-beige">
                        <ProfileImage
                          userId={selected.respondedBy}
                          src={getAdminProfilePic(selected.respondedBy)}
                          alt={getAdminName(selected.respondedBy)}
                          className="h-full w-full"
                          role="admin"
                        />
                      </div>
                      <p className="font-semibold text-soft-amber">
                        Response from {getAdminName(selected.respondedBy)}
                      </p>
                    </div>
                    <p className="mt-1 text-graphite">{selected.response}</p>
                  </div>
                )}

                    {activeTab === "feedback" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-deep-forest">Send a response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write a helpful response to this feedback..."
                    className="h-28 w-full rounded-lg border border-earth-beige bg-white p-3 text-sm outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-drift-gray">
                      Response will be visible to the submitter immediately.
                    </span>
                    <button
                      onClick={handleRespond}
                      disabled={responding}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-70"
                    >
                      {responding ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Send
                    </button>
                  </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-drift-gray">
                    {activeTab === "feedback" ? <MessageSquare size={18} /> : <Star size={18} />}
                    Select a {activeTab === "feedback" ? "feedback" : "testimonial"} item to view details.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-earth-beige bg-cream px-3 py-2">
                <Search size={16} className="text-earth-clay" />
                <input
                  value={testimonialSearch}
                  onChange={(e) => setTestimonialSearch(e.target.value)}
                  placeholder="Search testimonials by name or message..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-drift-gray"
                />
              </div>
              <button
                onClick={() => loadTestimonials()}
                className="inline-flex items-center gap-2 rounded-lg border border-earth-beige px-3 py-2 text-sm text-deep-forest transition hover:border-amber-500 hover:text-amber-700"
              >
                {loadingTestimonials ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {loadingTestimonials ? (
                  <div className="flex items-center gap-2 text-sm text-drift-gray">
                    <Loader2 size={16} className="animate-spin" />
                    Loading testimonials...
                  </div>
                ) : filteredTestimonials.length === 0 ? (
                  <div className="rounded-lg border border-earth-beige bg-cream p-4 text-sm text-drift-gray">
                    No testimonials found.
                  </div>
                ) : (
                  <div className="space-y-3">{filteredTestimonials.map((item) => renderTestimonialItem(item))}</div>
                )}
              </div>

              <div className="rounded-lg border border-earth-beige bg-cream p-4">
                {selected ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-deep-forest">{selected.userName || "Unknown user"}</p>
                        <p className="text-xs text-graphite">
                          {selected.userRole || "patient"} • {selected.createdAt?.toDate ? new Date(selected.createdAt.toDate()).toLocaleDateString() : selected.date || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected.rating ? (
                          <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-amber-700">
                            <Star size={14} className="fill-amber-500 text-amber-500" />
                            {selected.rating}
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            selected.published !== false
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {selected.published !== false ? "Published" : "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-white p-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-earth-beige">
                        <ProfileImage
                          src={selected.userProfile}
                          alt={selected.userName || "User"}
                          className="h-full w-full"
                          role={selected.userRole}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-deep-forest">Testimonial</p>
                        <p className="text-sm text-graphite">{selected.message || "No message provided."}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selected.showOnLanding === true}
                            onChange={() => handleToggleLandingPage(selected.id, selected.showOnLanding === true)}
                            disabled={updatingLanding}
                            className="sr-only"
                          />
                          <div
                            className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                              selected.showOnLanding === true
                                ? "bg-soft-amber"
                                : "bg-gray-300"
                            } ${updatingLanding ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                                selected.showOnLanding === true ? "translate-x-5" : "translate-x-0.5"
                              } mt-0.5`}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-deep-forest">Show on Landing Page</span>
                          <p className="text-xs text-drift-gray">
                            {selected.showOnLanding === true
                              ? "This testimonial will be displayed on the landing page (only the 6 most recent are shown)"
                              : "This testimonial will not appear on the landing page"}
                          </p>
                          {selected.showOnLanding === true && (
                            <p className="text-xs text-amber-600 mt-1 font-medium">
                              ✓ Changes appear instantly on the landing page
                            </p>
                          )}
                        </div>
                        {updatingLanding && (
                          <Loader2 size={16} className="animate-spin text-soft-amber" />
                        )}
                      </label>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-drift-gray">
                    <Star size={18} />
                    Select a testimonial item to view details.
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}

function FilterPill({ label, value, onChange, options }) {
  const current = options.find((o) => o.value === value) || options[0]
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-earth-beige bg-white px-3 py-2 text-sm text-deep-forest transition hover:border-amber-500 hover:text-amber-700"
      >
        <span className="font-semibold">{label}:</span>
        <span className="capitalize text-graphite">{current.label}</span>
        <ChevronDown size={14} />
      </button>
      <div
        className={`absolute right-0 z-10 mt-1 w-40 origin-top rounded-lg border border-earth-beige bg-white shadow-md transition-all duration-200 ease-out ${
          open ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" : "scale-95 opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value)
              setOpen(false)
            }}
            className={`block w-full px-3 py-2 text-left text-sm capitalize transition-colors duration-150 ${
              value === option.value ? "bg-amber-50 text-amber-700" : "hover:bg-cream"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
