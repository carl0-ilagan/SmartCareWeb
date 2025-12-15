import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />

      <div className="space-y-6">
        {/* Appearance */}
        <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="mt-4 space-y-4">
            <Skeleton className="h-5 w-24 mb-2" />
            <div className="flex space-x-4">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <Skeleton className="h-24 w-24 rounded-lg" />
              <Skeleton className="h-24 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-24 mb-2 mt-4" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-36 mb-1" />
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}
