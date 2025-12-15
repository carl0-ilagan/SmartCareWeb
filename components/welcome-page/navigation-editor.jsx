"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash } from "lucide-react"
import { updateWelcomePageContent } from "@/lib/content-utils"

export function NavigationEditor({ content, onUpdate }) {
  const [navItems, setNavItems] = useState(content || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddItem = () => {
    setNavItems([...navItems, { label: "New Link", url: "/" }])
  }

  const handleRemoveItem = (index) => {
    const updatedItems = [...navItems]
    updatedItems.splice(index, 1)
    setNavItems(updatedItems)
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...navItems]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setNavItems(updatedItems)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateWelcomePageContent(navItems, "navigation")
      onUpdate(navItems)
    } catch (error) {
      console.error("Error updating navigation:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Navigation Links</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        </div>

        {navItems.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end border-b pb-4">
            <div className="space-y-2">
              <Label htmlFor={`nav-label-${index}`}>Label</Label>
              <Input
                id={`nav-label-${index}`}
                value={item.label}
                onChange={(e) => handleItemChange(index, "label", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`nav-url-${index}`}>URL</Label>
              <Input
                id={`nav-url-${index}`}
                value={item.url}
                onChange={(e) => handleItemChange(index, "url", e.target.value)}
                required
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveItem(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={navItems.length <= 1}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        ))}

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}
