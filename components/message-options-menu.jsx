"use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, Copy, Reply, Trash, Trash2, X } from "lucide-react"

export default function MessageOptionsMenu({
  message,
  onUnsend,
  onDelete,
  onDeleteForEveryone,
  onCopy,
  onReply,
  isSender,
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
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

  const toggleMenu = (e) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleUnsend = (e) => {
    e.stopPropagation()
    onUnsend(message)
    setShowMenu(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(message)
    setShowMenu(false)
  }

  const handleDeleteForEveryone = (e) => {
    e.stopPropagation()
    onDeleteForEveryone(message)
    setShowMenu(false)
  }

  const handleCopy = (e) => {
    e.stopPropagation()
    onCopy(message)
    setShowMenu(false)
  }

  const handleReply = (e) => {
    e.stopPropagation()
    onReply(message)
    setShowMenu(false)
  }

  return (
    <div className="relative ml-1" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-1 rounded-full text-drift-gray opacity-0 group-hover:opacity-100 hover:bg-pale-stone hover:text-soft-amber focus:opacity-100"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-0 z-10 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              onClick={handleReply}
              className="flex w-full items-center px-4 py-2 text-left text-sm text-graphite hover:bg-pale-stone"
            >
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </button>

            {message.type !== "unsent" && message.content && (
              <button
                onClick={handleCopy}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-graphite hover:bg-pale-stone"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </button>
            )}

            {isSender && (
              <button
                onClick={handleUnsend}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-graphite hover:bg-pale-stone"
              >
                <X className="mr-2 h-4 w-4" />
                Unsend
              </button>
            )}

            {isSender && (
              <button
                onClick={handleDeleteForEveryone}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-pale-stone"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete for everyone
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-pale-stone"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete for me
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
