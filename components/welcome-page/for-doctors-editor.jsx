"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateWelcomePageContent, uploadWelcomePageImage } from "@/lib/content-utils"
import { Plus, Trash, Upload } from "lucide-react"

export function ForDoctorsEditor({ content, onUpdate }) {
  const [forDoctorsContent, setForDoctorsContent] = useState(
    content || {
      title: "For Healthcare Providers",
      description:
        "Smart Care offers a streamlined platform for healthcare providers to connect with patients, manage appointments, and provide virtual care.",
      imageUrl: "/placeholder.svg?height=400&width=600",
      benefits: [],
      button: { label: "Join as a Provider", url: "/signup" },
    },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(forDoctorsContent.imageUrl)

  const handleContentChange = (field, value) => {
    setForDoctorsContent({
      ...forDoctorsContent,
      [field]: value,
    })
  }

  const handleButtonChange = (field, value) => {
    setForDoctorsContent({
      ...forDoctorsContent,
      button: {
        ...forDoctorsContent.button,
        [field]: value,
      },
    })
  }

  const handleAddBenefit = () => {
    setForDoctorsContent({
      ...forDoctorsContent,
      benefits: [...forDoctorsContent.benefits, "New benefit"],
    })
  }

  const handleRemoveBenefit = (index) => {
    const updatedBenefits = [...forDoctorsContent.benefits]
    updatedBenefits.splice(index, 1)
    setForDoctorsContent({
      ...forDoctorsContent,
      benefits: updatedBenefits,
    })
  }

  const handleBenefitChange = (index, value) => {
    const updatedBenefits = [...forDoctorsContent.benefits]
    updatedBenefits[index] = value
    setForDoctorsContent({
      ...forDoctorsContent,
      benefits: updatedBenefits,
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedContent = { ...forDoctorsContent }

      // Upload image if a new one is selected
      if (imageFile) {
        const imageUrl = await uploadWelcomePageImage(imageFile, "for-doctors")
        updatedContent.imageUrl = imageUrl
      }

      await updateWelcomePageContent(updatedContent, "forDoctors")
      onUpdate(updatedContent)
    } catch (error) {
      console.error("Error updating for doctors section:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="for-doctors-title">Section Title</Label>
          <Input
            id="for-doctors-title"
            value={forDoctorsContent.title}
            onChange={(e) => handleContentChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="for-doctors-description">Description</Label>
          <Textarea
            id="for-doctors-description"
            value={forDoctorsContent.description}
            onChange={(e) => handleContentChange("description", e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Section Image</Label>
          <div className="flex flex-col gap-4">
            {imagePreview && (
              <div className="relative w-full max-w-md h-48 border rounded-md overflow-hidden">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="For doctors preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="for-doctors-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="max-w-md"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("for-doctors-image").click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Benefits</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBenefit}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Benefit
            </Button>
          </div>

          {forDoctorsContent.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={benefit}
                onChange={(e) => handleBenefitChange(index, e.target.value)}
                placeholder="Enter benefit"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveBenefit(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Button</h4>
          <div className="space-y-2">
            <Label htmlFor="for-doctors-button-label">Label</Label>
            <Input
              id="for-doctors-button-label"
              value={forDoctorsContent.button?.label || ""}
              onChange={(e) => handleButtonChange("label", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="for-doctors-button-url">URL</Label>
            <Input
              id="for-doctors-button-url"
              value={forDoctorsContent.button?.url || ""}
              onChange={(e) => handleButtonChange("url", e.target.value)}
              required
            />
          </div>
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
