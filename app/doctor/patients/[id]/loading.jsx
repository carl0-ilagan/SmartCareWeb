export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="h-5 w-5 animate-pulse rounded-md bg-pale-stone mr-4"></div>
        <div className="h-8 w-48 animate-pulse rounded-md bg-pale-stone"></div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="mb-4 h-24 w-24 animate-pulse rounded-full bg-pale-stone"></div>
            <div className="h-6 w-32 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="mt-2 h-4 w-24 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="mt-4 w-full space-y-3">
              <div className="h-4 w-full animate-pulse rounded-md bg-pale-stone"></div>
              <div className="h-4 w-full animate-pulse rounded-md bg-pale-stone"></div>
              <div className="h-4 w-full animate-pulse rounded-md bg-pale-stone"></div>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-2">
            <div className="h-8 w-24 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="h-8 w-24 animate-pulse rounded-md bg-pale-stone"></div>
          </div>
        </div>

        <div className="col-span-2 rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded-md bg-pale-stone mb-4"></div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-pale-stone"></div>
            ))}
          </div>

          <div className="mt-6">
            <div className="h-6 w-40 animate-pulse rounded-md bg-pale-stone mb-2"></div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-pale-stone"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-full rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="h-4 w-40 animate-pulse rounded-md bg-pale-stone"></div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-pale-stone"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
