import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Skeleton */}
      <div className="bg-gradient-to-r from-soft-amber to-orange-500 rounded-lg p-6">
        <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
        <Skeleton className="h-4 w-96 bg-white/20" />
      </div>

      {/* Security Section */}
      <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="mt-4 space-y-6">
          {/* 2FA Toggle */}
          <div className="bg-gradient-to-r from-blue-50 to-amber-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-3 w-96 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-7 w-12 rounded-full" />
            </div>
          </div>

          {/* Trusted Devices */}
          <div className="pt-2 pb-4 border-b border-earth-beige">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-earth-beige">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-32 mb-1" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Timeout */}
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>

          {/* Login Sessions */}
          <div className="pt-4 border-t border-earth-beige">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 rounded-md border border-earth-beige">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-32 mb-1" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

