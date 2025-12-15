import { Loader2 } from "lucide-react"

export default function InformationPagesLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 text-soft-amber animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-graphite mb-2">Loading Information Pages</h2>
      <p className="text-drift-gray">Please wait while we load the content editor...</p>
    </div>
  )
}
