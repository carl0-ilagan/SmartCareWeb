export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse"></div>
        <div className="h-4 w-64 bg-pale-stone rounded-md animate-pulse mt-2"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar skeleton */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-10 bg-pale-stone rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 w-48 bg-pale-stone rounded-md animate-pulse mb-6"></div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-32 bg-pale-stone rounded-md animate-pulse"></div>
                <div className="h-10 w-full bg-pale-stone rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <div className="h-10 w-32 bg-pale-stone rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
