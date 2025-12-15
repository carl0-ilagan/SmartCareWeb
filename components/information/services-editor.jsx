"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export function ServicesEditor({ content, onUpdate, onImageUpload, isSaving }) {
  const [title, setTitle] = useState(content.title || "")
  const [subtitle, setSubtitle] = useState(content.subtitle || "")
  const [sections, setSections] = useState(content.sections || [])
  const [uploadingId, setUploadingId] = useState(null)

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        id: uuidv4(),
        title: "",
        description: "",
        imageUrl: "",
      },
    ])
  }

  const handleRemoveSection = (id) => {
    setSections(sections.filter((section) => section.id !== id))
  }

  const handleSectionChange = (id, field, value) => {
    setSections(sections.map((section) => (section.id === id ? { ...section, [field]: value } : section)))
  }

  const handleImageUpload = async (id, e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingId(id)
    try {
      const url = await onImageUpload(file, id)
      if (url) {
        handleSectionChange(id, "imageUrl", url)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setUploadingId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const updatedContent = {
      title,
      subtitle,
      sections,
    }

    await onUpdate(updatedContent)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Our Services"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Comprehensive healthcare solutions designed for your needs"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Services</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Service</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSection(section.id)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`service-title-${section.id}`}>Title</Label>
                <Input
                  id={`service-title-${section.id}`}
                  value={section.title}
                  onChange={(e) => handleSectionChange(section.id, "title", e.target.value)}
                  placeholder="Service Title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`service-description-${section.id}`}>Description</Label>
                <Textarea
                  id={`service-description-${section.id}`}
                  value={section.description}
                  onChange={(e) => handleSectionChange(section.id, "description", e.target.value)}
                  placeholder="Service description..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`service-image-${section.id}`}>Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id={`service-image-${section.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(section.id, e)}
                    className="max-w-sm"
                    disabled={uploadingId === section.id}
                  />
                  {uploadingId === section.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {section.imageUrl && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium">Current Image:</p>
                    <img
                      src={section.imageUrl || "/placeholder.svg"}
                      alt={section.title}
                      className="max-h-40 rounded-md"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || uploadingId !== null}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
