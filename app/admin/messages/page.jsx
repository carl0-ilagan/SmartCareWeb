"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Mail, Search, Archive, Trash2, Star, StarOff, Reply, MoreVertical, ChevronLeft, Filter, RefreshCw, AlertCircle, CheckCircle, ChevronDown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { useMobile } from "@/hooks/use-mobile"
import { SuccessNotification } from "@/components/success-notification"

function MessagesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const isMobile = useMobile()
  const [messages, setMessages] = useState([])
  const [gmailMessages, setGmailMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all") // all, unread, read, starred
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState("all") // all, contact, gmail
  const [fetchingGmail, setFetchingGmail] = useState(false)
  const [oauthStatus, setOauthStatus] = useState(null)
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replySubject, setReplySubject] = useState("")
  const [replyMessage, setReplyMessage] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [showReplyNotification, setShowReplyNotification] = useState(false)
  const [replyNotificationMessage, setReplyNotificationMessage] = useState("")
  const [replyNotificationType, setReplyNotificationType] = useState("success")

  // Fetch messages from Firestore (contact form submissions)
  useEffect(() => {
    if (!user) return

    const messagesRef = collection(db, "contact_messages")
    const q = query(messagesRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          source: "contact",
          ...doc.data(),
        }))
        setMessages(messagesData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching messages:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Fetch emails from Gmail API
  const fetchGmailEmails = async () => {
    setFetchingGmail(true)
    try {
      const response = await fetch("/api/gmail/fetch?maxResults=50")
      const data = await response.json()

      if (data.success && data.emails) {
        // Transform Gmail emails to match our message format
        const transformedEmails = data.emails.map((email) => ({
          id: email.id,
          source: "gmail",
          name: email.from?.split("<")[0]?.trim() || email.from,
          email: email.from?.match(/<(.+)>/)?.[1] || email.from,
          subject: email.subject || "No Subject",
          message: email.body || email.snippet,
          read: email.read,
          starred: email.starred,
          createdAt: email.timestamp ? { toDate: () => new Date(email.timestamp) } : null,
          gmailData: email, // Store full Gmail data
        }))
        setGmailMessages(transformedEmails)
      } else {
        console.warn("Gmail API not configured or error:", data.message)
      }
    } catch (error) {
      console.error("Error fetching Gmail emails:", error)
    } finally {
      setFetchingGmail(false)
    }
  }

  // Check for OAuth callback status
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const refreshToken = searchParams.get("refresh_token")

    if (success === "1" && refreshToken) {
      setOauthStatus({
        type: "success",
        message: `OAuth successful! Please add this refresh token to your .env.local file: ${refreshToken}`,
        refreshToken: refreshToken,
      })
      // Clear URL params
      window.history.replaceState({}, "", "/admin/messages")
    } else if (error) {
      setOauthStatus({
        type: "error",
        message: `OAuth error: ${error}`,
      })
      window.history.replaceState({}, "", "/admin/messages")
    }
  }, [searchParams])

  // Fetch Gmail emails on mount and when source changes
  useEffect(() => {
    if (user && (source === "all" || source === "gmail")) {
      fetchGmailEmails()
    }
  }, [user, source])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setSourceDropdownOpen(false)
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Combine messages from both sources
  const allMessages = [
    ...messages.map((m) => ({ ...m, source: m.source || "contact" })),
    ...gmailMessages.map((m) => ({ ...m, source: "gmail" })),
  ].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : a.createdAt || 0
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : b.createdAt || 0
    return dateB - dateA
  })

  // Filter and search messages
  const filteredMessages = allMessages.filter((msg) => {
    // Filter by source
    const matchesSource =
      source === "all" ||
      (source === "contact" && msg.source === "contact") ||
      (source === "gmail" && msg.source === "gmail")

    const matchesSearch =
      msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !msg.read) ||
      (filter === "read" && msg.read) ||
      (filter === "starred" && msg.starred)

    return matchesSource && matchesSearch && matchesFilter
  })

  // Mark message as read
  const markAsRead = async (messageId, messageSource) => {
    try {
      if (messageSource === "contact") {
        const messageRef = doc(db, "contact_messages", messageId)
        await updateDoc(messageRef, {
          read: true,
          readAt: serverTimestamp(),
        })
      } else if (messageSource === "gmail") {
        // Update local state for Gmail messages
        setGmailMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
        )
      }
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  // Toggle star
  const toggleStar = async (messageId, currentStarred, messageSource) => {
    try {
      if (messageSource === "contact") {
        // Update in Firestore
        const messageRef = doc(db, "contact_messages", messageId)
        await updateDoc(messageRef, {
          starred: !currentStarred,
        })
      } else if (messageSource === "gmail") {
        // For Gmail, we can update local state (Gmail API star/unstar would require additional API calls)
        setGmailMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, starred: !currentStarred } : msg))
        )
      }
    } catch (error) {
      console.error("Error toggling star:", error)
    }
  }

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now"
    let date
    if (timestamp?.toDate) {
      date = timestamp.toDate()
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp)
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }
    
    if (isNaN(date.getTime())) return "Just now"
    
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  // Select message and mark as read
  const handleSelectMessage = async (message) => {
    setSelectedMessage(message)
    if (!message.read) {
      await markAsRead(message.id, message.source)
    }
  }

  // Handle back to list on mobile
  const handleBackToList = () => {
    setSelectedMessage(null)
  }

  // Handle reply
  const handleReply = () => {
    if (!selectedMessage) return
    setReplySubject(`Re: ${selectedMessage.subject || "No Subject"}`)
    setReplyMessage("")
    setShowReplyForm(true)
    setShowReplyNotification(false)
  }

  // Send reply email
  const sendReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) {
      setReplyNotificationMessage("Please enter a message")
      setReplyNotificationType("error")
      setShowReplyNotification(true)
      return
    }

    if (!selectedMessage.email) {
      setReplyNotificationMessage("No email address found for this message")
      setReplyNotificationType("error")
      setShowReplyNotification(true)
      return
    }

    setIsSendingReply(true)

    try {
      // Send reply to the user's email address (from their contact form submission)
      console.log("Sending reply to:", selectedMessage.email)
      console.log("Reply subject:", replySubject || `Re: ${selectedMessage.subject || "No Subject"}`)
      
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: selectedMessage.email, // User's email from contact form
          subject: replySubject || `Re: ${selectedMessage.subject || "No Subject"}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">
                Reply from Smart Care
              </h2>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Original Message:</strong></p>
                <p style="color: #6b7280; margin: 10px 0; padding: 10px; background: #fff; border-left: 3px solid #d97706;">
                  ${selectedMessage.message || selectedMessage.subject || "No content"}
                </p>
              </div>
              <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #374151; margin-top: 0;">Reply:</h3>
                <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${replyMessage.replace(/\n/g, "<br>")}</p>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                This is a reply from Smart Care. Please do not reply to this email directly.
              </p>
            </div>
          `,
          text: `
Reply from Smart Care

Original Message:
${selectedMessage.message || selectedMessage.subject || "No content"}

Reply:
${replyMessage}

---
This is a reply from Smart Care. Please do not reply to this email directly.
          `,
        }),
      })

      const data = await response.json()
      console.log("Email API response:", data)

      if (data.success) {
        setReplyNotificationMessage("Reply sent successfully!")
        setReplyNotificationType("success")
        setShowReplyNotification(true)
        setReplyMessage("")
        setReplySubject("")
        setTimeout(() => {
          setShowReplyForm(false)
        }, 1500)
      } else {
        setReplyNotificationMessage(data.message || "Failed to send reply. Please check SMTP configuration.")
        setReplyNotificationType("error")
        setShowReplyNotification(true)
      }
    } catch (error) {
      console.error("Error sending reply:", error)
      setReplyNotificationMessage("An error occurred while sending the reply: " + error.message)
      setReplyNotificationType("error")
      setShowReplyNotification(true)
    } finally {
      setIsSendingReply(false)
    }
  }

  const unreadCount = allMessages.filter((msg) => !msg.read).length
  const starredCount = allMessages.filter((msg) => msg.starred).length
  const contactCount = messages.length
  const gmailCount = gmailMessages.length

  return (
    <div className="space-y-6">
      {/* Success/Error Notification */}
      <SuccessNotification
        message={replyNotificationMessage}
        isVisible={showReplyNotification}
        onClose={() => setShowReplyNotification(false)}
        type={replyNotificationType}
        position="top-center"
        duration={5000}
      />
      
      <AdminHeaderBanner
        title="Messages"
        subtitle="View and manage contact form submissions and Gmail messages"
        stats={[
          { label: "Total Messages", value: allMessages.length, icon: <Mail className="h-4 w-4 text-white/70" /> },
          { label: "Unread", value: unreadCount, icon: <Mail className="h-4 w-4 text-white/70" /> },
          { label: "Starred", value: starredCount, icon: <Star className="h-4 w-4 text-white/70" /> },
          { label: "Gmail", value: gmailCount, icon: <Mail className="h-4 w-4 text-white/70" /> },
        ]}
      />

      {/* OAuth Status Messages */}
      {oauthStatus && (
        <div className={`border rounded-lg p-4 ${
          oauthStatus.type === "success" 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-start gap-3">
            {oauthStatus.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${
                oauthStatus.type === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {oauthStatus.type === "success" ? "OAuth Successful!" : "OAuth Error"}
              </h3>
              <p className={`text-sm mb-2 ${
                oauthStatus.type === "success" ? "text-green-700" : "text-red-700"
              }`}>
                {oauthStatus.message}
              </p>
              {oauthStatus.refreshToken && (
                <div className="mt-3 p-3 bg-white rounded border border-green-300">
                  <p className="text-xs font-semibold text-graphite mb-1">Add this to your .env.local:</p>
                  <code className="text-xs text-graphite break-all">
                    GMAIL_REFRESH_TOKEN={oauthStatus.refreshToken}
                  </code>
                </div>
              )}
            </div>
            <button
              onClick={() => setOauthStatus(null)}
              className="text-drift-gray hover:text-graphite"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Gmail API Setup Notice */}
      {gmailCount === 0 && source === "gmail" && !fetchingGmail && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-1">Gmail API Setup Required</h3>
              <p className="text-sm text-amber-700 mb-2">
                To fetch emails from Gmail, you need to:
              </p>
              <ol className="text-xs text-amber-700 list-decimal list-inside space-y-1 mb-3">
                <li>Set up OAuth 2.0 Client ID in Google Cloud Console</li>
                <li>Add environment variables to your .env.local file</li>
                <li>Click "Connect Gmail" button below to get refresh token</li>
              </ol>
              <a
                href="/api/gmail/auth"
                className="inline-flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-soft-amber/90 transition-colors text-sm font-medium"
              >
                <Mail className="h-4 w-4" />
                Connect Gmail Account
              </a>
              <div className="mt-3 p-3 bg-white rounded border border-amber-300">
                <p className="text-xs font-semibold text-graphite mb-2">Current Configuration:</p>
                <div className="space-y-1 text-xs">
                  <p className="text-drift-gray">
                    <span className="font-medium">Client ID:</span> {process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID ? "✓ Configured" : "✗ Not set"}
                  </p>
                  <p className="text-drift-gray">
                    <span className="font-medium">Client Secret:</span> {process.env.NEXT_PUBLIC_GMAIL_CLIENT_SECRET ? "✓ Configured" : "✗ Not set"}
                  </p>
                  <p className="text-drift-gray">
                    <span className="font-medium">Refresh Token:</span> {process.env.NEXT_PUBLIC_GMAIL_REFRESH_TOKEN ? "✓ Configured" : "✗ Not set - Click 'Connect Gmail' to get one"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                Contact form submissions are still being saved and displayed in the "Contact" tab.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-earth-beige/50 overflow-hidden">
        <div className={`flex ${isMobile ? "flex-col" : ""} ${isMobile ? "h-[calc(100vh-200px)]" : "h-[calc(100vh-250px)]"} md:h-[calc(100vh-250px)]`}>
          {/* Sidebar - Message List */}
          <div className={`${isMobile && selectedMessage ? "hidden" : ""} ${isMobile ? "w-full h-full" : "w-1/3"} ${isMobile ? "" : "border-r"} border-earth-beige/50 flex flex-col`}>
            {/* Search and Filter */}
            <div className="p-3 md:p-4 border-b border-earth-beige/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-drift-gray" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-earth-beige rounded-lg focus:ring-2 focus:ring-soft-amber focus:border-soft-amber"
                />
              </div>
              
              {/* Source Filter Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setSourceDropdownOpen((prev) => !prev)}
                  className="w-full inline-flex items-center justify-between pl-10 pr-3 py-2 border border-earth-beige rounded-md bg-white text-graphite text-sm font-medium shadow-sm transition hover:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                >
                  <span className="flex items-center">
                    <Filter className="h-5 w-5 text-drift-gray mr-2 absolute left-3" />
                    {source === "all"
                      ? `All (${allMessages.length})`
                      : source === "contact"
                      ? `Contact (${contactCount})`
                      : `Gmail (${gmailCount})`}
                  </span>
                  <div className="flex items-center gap-2">
                    {source === "gmail" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          fetchGmailEmails()
                        }}
                        disabled={fetchingGmail}
                        className="p-1 rounded-lg hover:bg-pale-stone transition-colors disabled:opacity-50"
                        title="Refresh Gmail"
                      >
                        <RefreshCw className={`h-4 w-4 text-drift-gray ${fetchingGmail ? "animate-spin" : ""}`} />
                      </button>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${sourceDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                <div
                  className={`absolute left-0 right-0 mt-1 origin-top rounded-lg border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out z-10 ${
                    sourceDropdownOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
                  }`}
                >
                  {[
                    { value: "all", label: `All (${allMessages.length})` },
                    { value: "contact", label: `Contact (${contactCount})` },
                    { value: "gmail", label: `Gmail (${gmailCount})` },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSource(option.value)
                        setSourceDropdownOpen(false)
                        if (option.value === "gmail" && gmailMessages.length === 0) {
                          fetchGmailEmails()
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        source === option.value ? "bg-soft-amber text-white" : "text-graphite hover:bg-pale-stone"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setStatusDropdownOpen((prev) => !prev)}
                  className="w-full inline-flex items-center justify-between pl-10 pr-3 py-2 border border-earth-beige rounded-md bg-white text-graphite text-sm font-medium shadow-sm transition hover:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                >
                  <span className="flex items-center">
                    <Filter className="h-5 w-5 text-drift-gray mr-2 absolute left-3" />
                    {filter === "all"
                      ? "All"
                      : filter === "unread"
                      ? `Unread (${unreadCount})`
                      : filter === "read"
                      ? "Read"
                      : "Starred"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`absolute left-0 right-0 mt-1 origin-top rounded-lg border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out z-10 ${
                    statusDropdownOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
                  }`}
                >
                  {[
                    { value: "all", label: "All" },
                    { value: "unread", label: `Unread (${unreadCount})` },
                    { value: "read", label: "Read" },
                    { value: "starred", label: "Starred" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value)
                        setStatusDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        filter === option.value ? "bg-soft-amber text-white" : "text-graphite hover:bg-pale-stone"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-drift-gray">Loading messages...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-drift-gray">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-drift-gray/30" />
                  <p>No messages found</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-3 md:p-4 border-b border-earth-beige/30 cursor-pointer hover:bg-pale-stone/50 transition-colors active:bg-pale-stone ${
                      selectedMessage?.id === message.id ? "bg-amber-50 border-l-4 border-l-soft-amber" : ""
                    } ${!message.read ? "bg-blue-50/30 font-semibold" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm truncate ${!message.read ? "font-bold text-graphite" : "text-graphite"}`}>
                            {message.name || "Unknown"}
                          </p>
                          {message.source === "gmail" && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                              Gmail
                            </span>
                          )}
                          {message.source === "contact" && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded whitespace-nowrap">
                              Contact
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-drift-gray truncate">{message.email}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        {message.starred && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        <span className="text-xs text-drift-gray whitespace-nowrap">{formatDate(message.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-graphite line-clamp-2 break-words">{message.subject || "No subject"}</p>
                    {!message.read && <div className="mt-2 h-2 w-2 bg-blue-500 rounded-full"></div>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content - Message View */}
          <div className={`${isMobile && !selectedMessage ? "hidden" : ""} flex-1 flex flex-col`}>
            {selectedMessage ? (
              <>
                {/* Message Header */}
                <div className="p-4 md:p-6 border-b border-earth-beige/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {isMobile && (
                          <button
                            onClick={handleBackToList}
                            className="p-1 hover:bg-pale-stone rounded-lg transition-colors"
                            aria-label="Back to messages"
                          >
                            <ChevronLeft className="h-5 w-5 text-graphite" />
                          </button>
                        )}
                        {!isMobile && (
                          <button
                            onClick={() => handleSelectMessage(null)}
                            className="p-1 hover:bg-pale-stone rounded-lg transition-colors"
                            aria-label="Deselect message"
                          >
                            <ChevronLeft className="h-5 w-5 text-graphite" />
                          </button>
                        )}
                        <h2 className="text-lg md:text-xl font-bold text-graphite break-words">{selectedMessage.subject || "No Subject"}</h2>
                      </div>
                      <div className={`flex ${isMobile ? "flex-col gap-2" : "items-center gap-4"} text-sm text-drift-gray`}>
                        <div className="break-words">
                          <span className="font-semibold text-graphite">From:</span> {selectedMessage.name || "Unknown"} ({selectedMessage.email || "No email"})
                        </div>
                        <div>
                          <span className="font-semibold text-graphite">Date:</span> {formatDate(selectedMessage.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStar(selectedMessage.id, selectedMessage.starred, selectedMessage.source)}
                        className="p-2 hover:bg-pale-stone rounded-lg transition-colors"
                        title={selectedMessage.starred ? "Unstar" : "Star"}
                      >
                        {selectedMessage.starred ? (
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="h-5 w-5 text-drift-gray" />
                        )}
                      </button>
                      {!showReplyForm && (
                        <button
                          onClick={handleReply}
                          className="p-2 hover:bg-pale-stone rounded-lg transition-colors"
                          title="Reply"
                        >
                          <Reply className="h-5 w-5 text-drift-gray" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className={`flex-1 ${isMobile ? "p-3" : "p-4 md:p-6"} overflow-y-auto`}>
                  <div className="prose max-w-none">
                    {!isMobile && (
                      <div className="bg-pale-stone/30 rounded-lg p-3 md:p-4 mb-4">
                        <p className="text-sm text-drift-gray mb-1">
                          <strong className="text-graphite">From:</strong> {selectedMessage.name || "Unknown"}
                        </p>
                        <p className="text-sm text-drift-gray mb-1">
                          <strong className="text-graphite">Email:</strong> {selectedMessage.email || "No email"}
                        </p>
                        <p className="text-sm text-drift-gray">
                          <strong className="text-graphite">Subject:</strong> {selectedMessage.subject || "No Subject"}
                        </p>
                      </div>
                    )}
                    <div className={`whitespace-pre-wrap text-graphite leading-relaxed ${isMobile ? "text-sm" : ""} break-words`}>{selectedMessage.message || selectedMessage.body || selectedMessage.snippet || "No message content"}</div>
                  </div>
                </div>

                {/* Reply Form */}
                {showReplyForm && (
                  <div className={`${isMobile ? "p-3 sticky bottom-0 bg-white border-t" : "p-4 md:p-6 border-b"} border-earth-beige/50 bg-pale-stone/30`}>
                    <div className={`space-y-${isMobile ? "3" : "4"}`}>
                      <div>
                        <label className={`block ${isMobile ? "text-xs" : "text-sm"} font-medium text-graphite mb-1.5`}>
                          To: <span className="text-drift-gray font-normal break-all">{selectedMessage.email}</span>
                        </label>
                      </div>
                      <div>
                        <label className={`block ${isMobile ? "text-xs" : "text-sm"} font-medium text-graphite mb-1.5`}>Subject</label>
                        <input
                          type="text"
                          value={replySubject}
                          onChange={(e) => setReplySubject(e.target.value)}
                          className={`w-full ${isMobile ? "px-2.5 py-2 text-sm" : "px-3 py-2"} border border-earth-beige rounded-lg focus:ring-2 focus:ring-soft-amber focus:border-soft-amber`}
                          placeholder="Reply subject"
                        />
                      </div>
                      <div>
                        <label className={`block ${isMobile ? "text-xs" : "text-sm"} font-medium text-graphite mb-1.5`}>Message</label>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={isMobile ? 4 : 6}
                          className={`w-full ${isMobile ? "px-2.5 py-2 text-sm" : "px-3 py-2"} border border-earth-beige rounded-lg focus:ring-2 focus:ring-soft-amber focus:border-soft-amber resize-none`}
                          placeholder="Type your reply here..."
                        />
                      </div>
                      <div className={`flex items-center gap-2 ${isMobile ? "flex-col" : ""}`}>
                        <button
                          onClick={sendReply}
                          disabled={isSendingReply || !replyMessage.trim()}
                          className={`inline-flex items-center justify-center gap-2 ${isMobile ? "w-full px-4 py-2.5 text-sm" : "px-4 py-2"} bg-soft-amber text-white rounded-lg hover:bg-soft-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isSendingReply ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Reply className="h-4 w-4" />
                              Send Reply
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowReplyForm(false)
                            setReplyMessage("")
                            setReplySubject("")
                            setShowReplyNotification(false)
                          }}
                          disabled={isSendingReply}
                          className={`${isMobile ? "w-full px-4 py-2.5 text-sm" : "px-4 py-2"} border border-earth-beige bg-white rounded-lg hover:bg-pale-stone transition-colors disabled:opacity-50`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Actions */}
                {!isMobile && (
                  <div className="p-3 md:p-4 border-t border-earth-beige/50 bg-pale-stone/20">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!showReplyForm && (
                        <button
                          onClick={handleReply}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-soft-amber/90 transition-colors"
                        >
                          <Reply className="h-4 w-4" />
                          Reply
                        </button>
                      )}
                      <button
                        onClick={() => toggleStar(selectedMessage.id, selectedMessage.starred, selectedMessage.source)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-earth-beige bg-white rounded-lg hover:bg-pale-stone transition-colors"
                      >
                        {selectedMessage.starred ? (
                          <>
                            <StarOff className="h-4 w-4" />
                            Unstar
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4" />
                            Star
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-drift-gray">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto mb-4 text-drift-gray/30" />
                  <p className="text-lg">Select a message to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-soft-amber mb-4"></div>
          <p className="text-drift-gray">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}

