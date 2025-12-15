"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function HealthTipsCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const healthTips = [
    {
      title: "Stay Hydrated",
      content:
        "Drinking enough water is crucial for your health. Aim for at least 8 glasses a day to maintain proper hydration.",
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      title: "Regular Exercise",
      content:
        "Just 30 minutes of moderate exercise five days a week can significantly improve your physical and mental health.",
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      title: "Balanced Diet",
      content:
        "Incorporate a variety of fruits, vegetables, whole grains, and lean proteins into your meals for optimal nutrition.",
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      title: "Adequate Sleep",
      content: "Adults should aim for 7-9 hours of quality sleep each night to support overall health and well-being.",
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      title: "Stress Management",
      content: "Practice mindfulness, deep breathing, or meditation to help manage stress and improve mental health.",
      image: "/placeholder.svg?height=300&width=500",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === healthTips.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? healthTips.length - 1 : prev - 1))
  }

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative h-[400px] w-full overflow-hidden rounded-xl">
        {healthTips.map((tip, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="grid h-full grid-cols-1 overflow-hidden rounded-xl bg-white md:grid-cols-2">
              <div className="flex flex-col justify-center p-6 md:p-8">
                <h3 className="mb-2 text-2xl font-bold text-graphite">{tip.title}</h3>
                <p className="text-drift-gray">{tip.content}</p>
                <div className="mt-6">
                  <a href="#" className="text-sm font-medium text-soft-amber hover:underline">
                    Read more health tips
                  </a>
                </div>
              </div>
              <div className="relative h-[200px] md:h-full">
                <img src={tip.image || "/placeholder.svg"} alt={tip.title} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-graphite shadow-md transition-colors hover:bg-white hover:text-soft-amber"
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">Previous slide</span>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-graphite shadow-md transition-colors hover:bg-white hover:text-soft-amber"
      >
        <ChevronRight className="h-6 w-6" />
        <span className="sr-only">Next slide</span>
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
        {healthTips.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 w-2 rounded-full ${index === currentSlide ? "bg-soft-amber" : "bg-drift-gray/30"}`}
          >
            <span className="sr-only">Go to slide {index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
