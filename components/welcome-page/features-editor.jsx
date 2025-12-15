"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateWelcomePageContent } from "@/lib/content-utils"
import { Plus, Trash } from "lucide-react"
import * as LucideIcons from "lucide-react"

// List of available icons from Lucide
const availableIcons = [
  "MessageSquare",
  "Calendar",
  "Clock",
  "CheckCircle",
  "Heart",
  "Shield",
  "Stethoscope",
  "Activity",
  "Clipboard",
  "Users",
  "FileText",
  "Phone",
  "Video",
  "Mail",
  "Lock",
  "Star",
  "Award",
  "ThumbsUp",
  "Bell",
  "Settings",
]

export function FeaturesEditor({ content, onUpdate }) {
  const [featuresContent, setFeaturesContent] = useState(
    content || {
      title: "Comprehensive Healthcare Solutions",
      subtitle:
        "Smart Care offers a range of features designed to make healthcare accessible, convenient, and personalized for everyone.",
      items: [],
    },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContentChange = (field, value) => {
    setFeaturesContent({
      ...featuresContent,
      [field]: value,
    })
  }

  const handleAddFeature = () => {
    setFeaturesContent({
      ...featuresContent,
      items: [
        ...featuresContent.items,
        {
          icon: "MessageSquare",
          title: "New Feature",
          description: "Description of the new feature",
        },
      ],
    })
  }

  const handleRemoveFeature = (index) => {
    const updatedItems = [...featuresContent.items]
    updatedItems.splice(index, 1)
    setFeaturesContent({
      ...featuresContent,
      items: updatedItems,
    })
  }

  const handleFeatureChange = (index, field, value) => {
    const updatedItems = [...featuresContent.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setFeaturesContent({
      ...featuresContent,
      items: updatedItems,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateWelcomePageContent(featuresContent, "features")
      onUpdate(featuresContent)
    } catch (error) {
      console.error("Error updating features section:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render icon preview
  const renderIconPreview = (iconName) => {
    const Icon = LucideIcons[iconName]
    return Icon ? <Icon className="h-6 w-6 text-soft-amber" /> : null
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="features-title">Section Title</Label>
          <Input
            id="features-title"
            value={featuresContent.title}
            onChange={(e) => handleContentChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="features-subtitle">Section Subtitle</Label>
          <Textarea
            id="features-subtitle"
            value={featuresContent.subtitle}
            onChange={(e) => handleContentChange("subtitle", e.target.value)}
            rows={2}
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Features</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFeature}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Feature
            </Button>
          </div>

          {featuresContent.items.map((feature, index) => (
            <div key={index} className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Feature {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFeature(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`feature-icon-${index}`}>Icon</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center bg-soft-amber/20 rounded-full">
                      {renderIconPreview(feature.icon)}
                    </div>
                    <Select value={feature.icon} onValueChange={(value) => handleFeatureChange(index, "icon", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              {renderIconPreview(icon)}
                              <span>{icon}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`feature-title-${index}`}>Title</Label>
                  <Input
                    id={`feature-title-${index}`}
                    value={feature.title}
                    onChange={(e) => handleFeatureChange(index, "title", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`feature-description-${index}`}>Description</Label>
                <Textarea
                  id={`feature-description-${index}`}
                  value={feature.description}
                  onChange={(e) => handleFeatureChange(index, "description", e.target.value)}
                  rows={2}
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}
