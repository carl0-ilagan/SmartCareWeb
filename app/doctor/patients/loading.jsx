export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-md bg-pale-stone"></div>
        <div className="h-10 w-32 animate-pulse rounded-md bg-pale-stone"></div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-pale-stone"></div>
        <div className="h-10 w-24 animate-pulse rounded-md bg-pale-stone"></div>
      </div>

      <div className="rounded-lg border border-pale-stone bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="p-4">
            <div className="mb-4 h-8 w-full animate-pulse rounded-md bg-pale-stone"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="mb-4 h-16 w-full animate-pulse rounded-md bg-pale-stone"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
