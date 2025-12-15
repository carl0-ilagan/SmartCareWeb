export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse"></div>
        <div className="h-4 w-64 bg-pale-stone rounded-md animate-pulse mt-2"></div>
      </div>

      {/* Profile header skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="h-24 w-24 bg-pale-stone rounded-full animate-pulse"></div>
          <div className="flex-1 text-center md:text-left">
            <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse mx-auto md:mx-0"></div>
            <div className="h-4 w-32 bg-pale-stone rounded-md animate-pulse mt-2 mx-auto md:mx-0"></div>
            <div className="mt-2 flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="h-4 w-48 bg-pale-stone rounded-md animate-pulse mx-auto md:mx-0"></div>
              <div className="h-4 w-32 bg-pale-stone rounded-md animate-pulse mx-auto md:mx-0"></div>
              <div className="h-4 w-24 bg-pale-stone rounded-md animate-pulse mx-auto md:mx-0"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="border-b border-earth-beige">
        <div className="flex space-x-4">
          <div className="h-8 w-40 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-8 w-32 bg-pale-stone rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 w-64 bg-pale-stone rounded-md animate-pulse mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 w-32 bg-pale-stone rounded-md animate-pulse"></div>
              <div className="h-10 w-full bg-pale-stone rounded-md animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Save button skeleton */}
        <div className="mt-6 flex justify-end">
          <div className="h-10 w-32 bg-pale-stone rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
