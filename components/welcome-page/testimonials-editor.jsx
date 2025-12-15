"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateWelcomePageContent, uploadWelcomePageImage } from "@/lib/content-utils"
import { Plus, Trash, Upload } from "lucide-react"

export function TestimonialsEditor({ content, onUpdate }) {
  const [testimonialsContent, setTestimonialsContent] = useState(
    content || {
      title: "What Our Users Say",
      subtitle: "Hear from patients and healthcare providers who have experienced the benefits of Smart Care.",
      items: [],
    },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState({})
  const [imagePreviews, setImagePreviews] = useState({})

  const handleContentChange = (field, value) => {
    setTestimonialsContent({
      ...testimonialsContent,
      [field]: value,
    })
  }

  const handleAddTestimonial = () => {
    setTestimonialsContent({
      ...testimonialsContent,
      items: [
        ...testimonialsContent.items,
        {
          name: "New Testimonial",
          role: "Patient",
          testimonial: "This is a new testimonial.",
          avatarSrc: "/placeholder.svg?height=100&width=100",
        },
      ],
    })
  }

  const handleRemoveTestimonial = (index) => {
    const updatedItems = [...testimonialsContent.items]
    updatedItems.splice(index, 1)
    setTestimonialsContent({
      ...testimonialsContent,
      items: updatedItems,
    })
  }

  const handleTestimonialChange = (index, field, value) => {
    const updatedItems = [...testimonialsContent.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setTestimonialsContent({
      ...testimonialsContent,
      items: updatedItems,
    })
  }

  const handleImageChange = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFiles({
        ...imageFiles,
        [index]: file,
      })
      setImagePreviews({
        ...imagePreviews,
        [index]: URL.createObjectURL(file),
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedContent = { ...testimonialsContent }

      // Upload images if new ones are selected
      for (const [index, file] of Object.entries(imageFiles)) {
        const imageUrl = await uploadWelcomePageImage(file, "testimonials")
        updatedContent.items[index].avatarSrc = imageUrl
      }

      await updateWelcomePageContent(updatedContent, "testimonials")
      onUpdate(updatedContent)

      // Clear image files after successful upload
      setImageFiles({})
    } catch (error) {
      console.error("Error updating testimonials section:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="testimonials-title">Section Title</Label>
          <Input
            id="testimonials-title"
            value={testimonialsContent.title}
            onChange={(e) => handleContentChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="testimonials-subtitle">Section Subtitle</Label>
          <Textarea
            id="testimonials-subtitle"
            value={testimonialsContent.subtitle}
            onChange={(e) => handleContentChange("subtitle", e.target.value)}
            rows={2}
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Testimonials</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTestimonial}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </div>

          {testimonialsContent.items.map((testimonial, index) => (
            <div key={index} className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Testimonial {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTestimonial(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`testimonial-name-${index}`}>Name</Label>
                  <Input
                    id={`testimonial-name-${index}`}
                    value={testimonial.name}
                    onChange={(e) => handleTestimonialChange(index, "name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`testimonial-role-${index}`}>Role</Label>
                  <Input
                    id={`testimonial-role-${index}`}
                    value={testimonial.role}
                    onChange={(e) => handleTestimonialChange(index, "role", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`testimonial-text-${index}`}>Testimonial</Label>
                <Textarea
                  id={`testimonial-text-${index}`}
                  value={testimonial.testimonial}
                  onChange={(e) => handleTestimonialChange(index, "testimonial", e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border">
                    <img
                      src={imagePreviews[index] || testimonial.avatarSrc}
                      alt={`${testimonial.name}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`testimonial-avatar-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e)}
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => document.getElementById(`testimonial-avatar-${index}`).click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
