export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-pale-stone rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-pale-stone rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="border-b border-earth-beige">
        <div className="flex space-x-4">
          <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse mb-6"></div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-pale-stone p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-white/50 rounded-md animate-pulse"></div>
                <div className="h-5 w-5 bg-white/50 rounded-full animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-white/50 rounded-md animate-pulse mt-2"></div>
              <div className="h-4 w-40 bg-white/50 rounded-md animate-pulse mt-2"></div>
              <div className="h-4 w-24 bg-white/50 rounded-md animate-pulse mt-2"></div>
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="bg-pale-stone rounded-lg p-4 h-64 animate-pulse"></div>
      </div>
    </div>
  )
}
