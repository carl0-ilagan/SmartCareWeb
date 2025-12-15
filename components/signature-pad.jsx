"use client"

import { useRef, useState, useEffect } from "react"
import { Trash2 } from "lucide-react"

export function SignaturePad({ onChange, initialSignature = null }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [ctx, setCtx] = useState(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    setCtx(context)

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentNode.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = 200

      // Clear and redraw if we have an initial signature
      if (initialSignature) {
        const img = new Image()
        img.onload = () => {
          context.drawImage(img, 0, 0)
          setIsEmpty(false)
        }
        img.src = initialSignature
        img.crossOrigin = "anonymous"
      } else {
        // Set canvas background
        context.fillStyle = "#f9f9f9"
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [initialSignature])

  // Start drawing
  const startDrawing = (e) => {
    if (!ctx) return

    const { offsetX, offsetY } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
    setIsDrawing(true)
    setIsEmpty(false)
  }

  // Draw
  const draw = (e) => {
    if (!isDrawing || !ctx) return

    const { offsetX, offsetY } = getCoordinates(e)
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
  }

  // Stop drawing
  const stopDrawing = () => {
    if (!ctx) return

    ctx.closePath()
    setIsDrawing(false)

    // Notify parent component of signature change
    if (onChange && canvasRef.current) {
      onChange(canvasRef.current.toDataURL())
    }
  }

  // Get coordinates for both mouse and touch events
  const getCoordinates = (e) => {
    let offsetX, offsetY
    const canvas = canvasRef.current

    if (e.type.includes("touch")) {
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0] || e.changedTouches[0]
      offsetX = touch.clientX - rect.left
      offsetY = touch.clientY - rect.top
    } else {
      offsetX = e.nativeEvent.offsetX
      offsetY = e.nativeEvent.offsetY
    }

    return { offsetX, offsetY }
  }

  // Clear signature
  const clearSignature = () => {
    if (!ctx || !canvasRef.current) return

    ctx.fillStyle = "#f9f9f9"
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setIsEmpty(true)

    // Notify parent component
    if (onChange) {
      onChange(null)
    }
  }

  // Set drawing style
  useEffect(() => {
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000000"
  }, [ctx])

  return (
    <div className="w-full">
      <div className="relative border border-earth-beige rounded-md overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!isEmpty && (
          <button
            type="button"
            onClick={clearSignature}
            className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-pale-stone"
            title="Clear signature"
          >
            <Trash2 className="h-4 w-4 text-drift-gray" />
          </button>
        )}
      </div>
      <p className="text-xs text-drift-gray mt-1">
        {isEmpty ? "Sign here using mouse or touch" : "Signature captured"}
      </p>
    </div>
  )
}
