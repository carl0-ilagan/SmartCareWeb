"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export function DoctorsEditor({ content, onUpdate, onImageUpload, isSaving }) {
  const [title, setTitle] = useState(content.title || "")
  const [subtitle, setSubtitle] = useState(content.subtitle || "")
  const [htmlContent, setHtmlContent] = useState(content.content || "")
  const [doctors, setDoctors] = useState(content.doctors || [])
  const [uploadingId, setUploadingId] = useState(null)

  const handleAddDoctor = () => {
    setDoctors([
      ...doctors,
      {
        id: uuidv4(),
        name: "",
        specialty: "",
        bio: "",
        imageUrl: "",
      },
    ])
  }

  const handleRemoveDoctor = (id) => {
    setDoctors(doctors.filter((doctor) => doctor.id !== id))
  }

  const handleDoctorChange = (id, field, value) => {
    setDoctors(doctors.map((doctor) => (doctor.id === id ? { ...doctor, [field]: value } : doctor)))
  }

  const handleImageUpload = async (id, e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingId(id)
    try {
      const url = await onImageUpload(file, id)
      if (url) {
        handleDoctorChange(id, "imageUrl", url)
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
      content: htmlContent,
      doctors,
    }

    await onUpdate(updatedContent)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Our Doctors" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Meet our team of experienced healthcare professionals"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Introduction (HTML)</Label>
        <Textarea
          id="content"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="<p>At Smart Care, we work with a diverse team of qualified and experienced healthcare professionals...</p>"
          className="min-h-[200px] font-mono"
          required
        />
        <p className="text-sm text-drift-gray">You can use HTML tags like &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Doctors</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddDoctor}>
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </div>

        {doctors.map((doctor) => (
          <Card key={doctor.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Doctor</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDoctor(doctor.id)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`doctor-name-${doctor.id}`}>Name</Label>
                <Input
                  id={`doctor-name-${doctor.id}`}
                  value={doctor.name}
                  onChange={(e) => handleDoctorChange(doctor.id, "name", e.target.value)}
                  placeholder="Dr. John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`doctor-specialty-${doctor.id}`}>Specialty</Label>
                <Input
                  id={`doctor-specialty-${doctor.id}`}
                  value={doctor.specialty}
                  onChange={(e) => handleDoctorChange(doctor.id, "specialty", e.target.value)}
                  placeholder="Cardiology"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`doctor-bio-${doctor.id}`}>Bio</Label>
                <Textarea
                  id={`doctor-bio-${doctor.id}`}
                  value={doctor.bio}
                  onChange={(e) => handleDoctorChange(doctor.id, "bio", e.target.value)}
                  placeholder="Doctor's biography..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`doctor-image-${doctor.id}`}>Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id={`doctor-image-${doctor.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(doctor.id, e)}
                    className="max-w-sm"
                    disabled={uploadingId === doctor.id}
                  />
                  {uploadingId === doctor.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {doctor.imageUrl && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium">Current Image:</p>
                    <img
                      src={doctor.imageUrl || "/placeholder.svg"}
                      alt={doctor.name}
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
