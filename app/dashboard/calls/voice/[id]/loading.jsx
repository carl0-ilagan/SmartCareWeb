import { Skeleton } from "@/components/ui/skeleton"

export default function VoiceCallLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pale-stone via-white to-pale-stone">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-6" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}
