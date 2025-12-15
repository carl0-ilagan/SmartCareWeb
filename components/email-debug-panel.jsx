"use client"

import { useState, useEffect } from "react"
import { getEmailHistory } from "@/lib/email-utils"

export function EmailDebugPanel() {
  const [emails, setEmails] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load emails from localStorage
    setEmails(getEmailHistory())

    // Set up interval to check for new emails
    const interval = setInterval(() => {
      setEmails(getEmailHistory())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (emails.length === 0 && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-md shadow-lg z-50"
      >
        Show Email Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border border-gray-200 max-w-md max-h-[80vh] overflow-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Email Debug Panel</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
          Minimize
        </button>
      </div>

      {emails.length === 0 ? (
        <p className="text-gray-500">No emails sent yet</p>
      ) : (
        <div className="space-y-4">
          {emails.map((email, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
              <div className="text-sm text-gray-500">{new Date(email.timestamp).toLocaleString()}</div>
              <div className="font-medium">To: {email.to}</div>
              <div className="font-medium">Subject: {email.subject}</div>
              <div className="mt-2 text-sm whitespace-pre-wrap">{email.text}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            localStorage.removeItem("emailHistory")
            setEmails([])
          }}
          className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
        >
          Clear History
        </button>
        <div className="text-sm text-gray-500">
          {emails.length} email{emails.length !== 1 ? "s" : ""} sent
        </div>
      </div>
    </div>
  )
}
