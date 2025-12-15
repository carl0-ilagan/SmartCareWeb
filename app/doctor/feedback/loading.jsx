import { Loader2 } from "lucide-react"

export default function DoctorFeedbackLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-soft-amber animate-spin mb-4" />
        <h2 className="text-xl font-medium text-graphite">Loading feedback...</h2>
        <p className="text-drift-gray mt-2">Please wait while we retrieve your feedback data</p>
      </div>
    </div>
  )
}
