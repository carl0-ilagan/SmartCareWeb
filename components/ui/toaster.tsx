"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Get icon based on variant
        const getIcon = () => {
          if (variant === "success") {
            return <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
          }
          if (variant === "destructive") {
            return <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
          }
          return null
        }

        return (
          <Toast key={id} variant={variant} {...props} className="relative overflow-hidden">
            {/* Decorative background elements */}
            {variant === "success" && (
              <>
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-500/5 rounded-full -ml-8 -mb-8"></div>
              </>
            )}
            {variant === "destructive" && (
              <>
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-500/5 rounded-full -ml-8 -mb-8"></div>
              </>
            )}
            
            <div className="flex items-start gap-3 sm:gap-4 flex-1 relative z-10">
              {getIcon() && (
                <div className={`flex-shrink-0 mt-0.5 ${
                  variant === "success" ? "text-green-600" : 
                  variant === "destructive" ? "text-red-600" : 
                  "text-amber-600"
                }`}>
                  {getIcon()}
                </div>
              )}
              <div className="grid gap-1 flex-1 min-w-0">
                {title && (
                  <ToastTitle className="text-sm sm:text-base font-bold text-gray-900">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-xs sm:text-sm text-gray-700 leading-relaxed mt-0.5">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="absolute right-2 top-2 rounded-md p-1.5 opacity-70 hover:opacity-100 hover:bg-black/5 transition-all duration-200" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
