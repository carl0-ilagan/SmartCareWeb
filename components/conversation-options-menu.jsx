"use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, Bell, BellOff, Trash2, Mail } from "lucide-react"
import DeleteConversationModal from "./delete-conversation-modal"

const ConversationOptionsMenu = ({ 
  onMarkAsUnread, 
  onDelete, 
  onMute,
  onUnmute,
  isMuted = false,
  className = "" 
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
    document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMenu])

  const handleMenuItemClick = (action) => {
    setShowMenu(false)
    if (typeof action === "function") {
      action()
    }
  }

  const handleDeleteClick = () => {
    setShowMenu(false)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (typeof onDelete === "function") {
        await onDelete()
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button 
        onClick={() => setShowMenu(!showMenu)} 
        className="p-1.5 rounded-full hover:bg-pale-stone transition-colors duration-200 text-drift-gray hover:text-graphite"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {/* Dropdown with smooth animations */}
      <div
        className={`absolute right-0 mt-1 w-48 origin-top rounded-lg border border-earth-beige bg-white shadow-lg z-50 transition-all duration-200 ease-out ${
          showMenu 
            ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" 
            : "scale-95 opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
          <div className="py-1">
          {onMarkAsUnread && (
            <button
              onClick={() => handleMenuItemClick(onMarkAsUnread)}
              className="w-full text-left px-4 py-2.5 text-sm text-graphite hover:bg-pale-stone transition-colors duration-150 flex items-center gap-2.5 dropdown-item"
            >
              <Mail className="h-4 w-4 text-drift-gray" />
              <span>Mark as unread</span>
            </button>
          )}
          
          {onMute && !isMuted && (
            <button
              onClick={() => handleMenuItemClick(onMute)}
              className="w-full text-left px-4 py-2.5 text-sm text-graphite hover:bg-pale-stone transition-colors duration-150 flex items-center gap-2.5 dropdown-item"
            >
              <BellOff className="h-4 w-4 text-drift-gray" />
              <span>Mute conversation</span>
            </button>
          )}
          
          {onUnmute && isMuted && (
            <button
              onClick={() => handleMenuItemClick(onUnmute)}
              className="w-full text-left px-4 py-2.5 text-sm text-graphite hover:bg-pale-stone transition-colors duration-150 flex items-center gap-2.5 dropdown-item"
            >
              <Bell className="h-4 w-4 text-drift-gray" />
              <span>Unmute conversation</span>
            </button>
          )}
          
          <div className="my-1 border-t border-pale-stone"></div>
          
          <button
            onClick={handleDeleteClick}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2.5 dropdown-item"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            <span>Delete conversation</span>
          </button>
        </div>
      </div>

      <DeleteConversationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default ConversationOptionsMenu
