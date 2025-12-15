"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateWelcomePageContent } from "@/lib/content-utils"
import { Plus, Trash } from "lucide-react"

export function HowItWorksEditor({ content, onUpdate }) {
  const [howItWorksContent, setHowItWorksContent] = useState(
    content || {
      title: "How It Works",
      subtitle:
        "Getting started with Smart Care is simple. Follow these steps to access quality healthcare from anywhere.",
      steps: [],
    },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContentChange = (field, value) => {
    setHowItWorksContent({
      ...howItWorksContent,
      [field]: value,
    })
  }

  const handleAddStep = () => {
    const newStepNumber = howItWorksContent.steps.length + 1
    setHowItWorksContent({
      ...howItWorksContent,
      steps: [
        ...howItWorksContent.steps,
        {
          number: newStepNumber.toString(),
          title: `Step ${newStepNumber}`,
          description: "Description of this step",
        },
      ],
    })
  }

  const handleRemoveStep = (index) => {
    const updatedSteps = [...howItWorksContent.steps]
    updatedSteps.splice(index, 1)

    // Renumber the steps
    const renumberedSteps = updatedSteps.map((step, idx) => ({
      ...step,
      number: (idx + 1).toString(),
    }))

    setHowItWorksContent({
      ...howItWorksContent,
      steps: renumberedSteps,
    })
  }

  const handleStepChange = (index, field, value) => {
    const updatedSteps = [...howItWorksContent.steps]
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value,
    }
    setHowItWorksContent({
      ...howItWorksContent,
      steps: updatedSteps,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateWelcomePageContent(howItWorksContent, "howItWorks")
      onUpdate(howItWorksContent)
    } catch (error) {
      console.error("Error updating how it works section:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="how-it-works-title">Section Title</Label>
          <Input
            id="how-it-works-title"
            value={howItWorksContent.title}
            onChange={(e) => handleContentChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="how-it-works-subtitle">Section Subtitle</Label>
          <Textarea
            id="how-it-works-subtitle"
            value={howItWorksContent.subtitle}
            onChange={(e) => handleContentChange("subtitle", e.target.value)}
            rows={2}
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Steps</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStep}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </div>

          {howItWorksContent.steps.map((step, index) => (
            <div key={index} className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-soft-amber flex items-center justify-center text-white font-bold">
                    {step.number}
                  </div>
                  <h4 className="font-medium">Step {step.number}</h4>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStep(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`step-title-${index}`}>Title</Label>
                <Input
                  id={`step-title-${index}`}
                  value={step.title}
                  onChange={(e) => handleStepChange(index, "title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`step-description-${index}`}>Description</Label>
                <Textarea
                  id={`step-description-${index}`}
                  value={step.description}
                  onChange={(e) => handleStepChange(index, "description", e.target.value)}
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
