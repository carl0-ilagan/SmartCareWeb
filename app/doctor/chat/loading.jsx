import { Skeleton } from "@/components/ui/skeleton"

export default function DoctorChatLoading() {
  return (
    <div className="h-screen w-full">
      <div className="grid h-full w-full grid-cols-[350px_1fr]">
        {/* Conversation list loading */}
        <div className="flex h-full flex-col bg-white">
          <div className="border-b border-pale-stone p-3">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="mt-2 flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="flex-1 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation view loading */}
        <div className="flex h-full flex-col bg-white">
          <div className="flex items-center justify-between border-b border-pale-stone p-3">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                  <Skeleton className={`h-20 w-3/4 rounded-lg ${i % 2 === 0 ? "mr-auto" : "ml-auto"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-pale-stone p-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-10 flex-1 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
