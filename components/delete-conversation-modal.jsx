"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

export default function DeleteConversationModal({ isOpen, onClose, onConfirm, isDeleting = false }) {
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleClose = () => {
    if (isDeleting) return // Prevent closing while deleting
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleConfirm = async () => {
    if (typeof onConfirm === "function") {
      await onConfirm()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes modalOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-out;
        }
        .animate-modal-in {
          animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-modal-out {
          animation: modalOut 0.3s ease-in;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${
          isClosing ? "animate-fade-out" : "animate-fade-in"
        }`}
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          className={`w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden ${
            isClosing ? "animate-modal-out" : "animate-modal-in"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with warning gradient */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-b border-red-100 p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-graphite text-center">Delete Conversation</h2>
        </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-drift-gray text-center mb-2 text-base leading-relaxed">
              Are you sure you want to delete this conversation?
            </p>
            <p className="text-sm text-drift-gray/80 text-center mb-6">
              This action cannot be undone. All messages in this conversation will be permanently deleted.
          </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
                onClick={handleClose}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg border border-earth-beige bg-white text-graphite text-sm font-medium transition-all duration-200 hover:bg-pale-stone hover:border-soft-amber disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium transition-all duration-200 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Conversation</span>
                  </>
                )}
            </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
