export default function FeedbackLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-pale-stone rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-28 bg-pale-stone rounded-md animate-pulse"></div>
      </div>

      {/* Tabs skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-earth-beige px-4">
          <div className="flex space-x-4 py-3">
            <div className="h-6 w-32 bg-pale-stone rounded-md animate-pulse"></div>
            <div className="h-6 w-32 bg-pale-stone rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* List skeleton */}
          <div className="flex-1 divide-y divide-earth-beige">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="h-5 w-48 bg-pale-stone rounded-md animate-pulse"></div>
                      <div className="h-4 w-16 bg-pale-stone rounded-md animate-pulse"></div>
                    </div>
                    <div className="h-4 w-32 bg-pale-stone rounded-md animate-pulse mt-1"></div>
                    <div className="h-4 w-full bg-pale-stone rounded-md animate-pulse mt-2"></div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <div className="h-5 w-16 bg-pale-stone rounded-full animate-pulse"></div>
                        <div className="h-5 w-16 bg-pale-stone rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-4 w-24 bg-pale-stone rounded-md animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail view skeleton */}
          <div className="border-t md:border-t-0 md:border-l border-earth-beige md:w-1/2 hidden md:block">
            <div className="p-4">
              <div className="h-6 w-64 bg-pale-stone rounded-md animate-pulse"></div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-pale-stone rounded-full animate-pulse mr-3"></div>
                  <div>
                    <div className="h-5 w-32 bg-pale-stone rounded-md animate-pulse"></div>
                    <div className="h-4 w-48 bg-pale-stone rounded-md animate-pulse mt-1"></div>
                  </div>
                </div>
                <div className="h-4 w-24 bg-pale-stone rounded-md animate-pulse"></div>
              </div>

              <div className="mt-4 flex space-x-2">
                <div className="h-5 w-16 bg-pale-stone rounded-full animate-pulse"></div>
                <div className="h-5 w-16 bg-pale-stone rounded-full animate-pulse"></div>
              </div>

              <div className="mt-4 h-32 bg-pale-stone rounded-lg animate-pulse"></div>

              <div className="mt-6 space-y-3">
                <div className="h-5 w-24 bg-pale-stone rounded-md animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-32 bg-pale-stone rounded-md animate-pulse"></div>
                  <div className="h-8 w-32 bg-pale-stone rounded-md animate-pulse"></div>
                  <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
                  <div className="h-8 w-28 bg-pale-stone rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
