import { Skeleton } from "@/components/ui/skeleton"

export default function VideoCallLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <Skeleton className="h-[600px] w-full rounded-lg bg-gray-800" />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-full rounded-md mb-2" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}
