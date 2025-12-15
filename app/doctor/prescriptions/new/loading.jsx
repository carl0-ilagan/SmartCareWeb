export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-md bg-pale-stone"></div>

      <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="space-y-2">
                <div className="h-5 w-24 animate-pulse rounded bg-pale-stone"></div>
                <div className="h-10 w-full animate-pulse rounded bg-pale-stone"></div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-pale-stone"></div>
            <div className="h-24 w-full animate-pulse rounded bg-pale-stone"></div>
          </div>

          <div className="flex justify-end space-x-3">
            <div className="h-10 w-20 animate-pulse rounded bg-pale-stone"></div>
            <div className="h-10 w-40 animate-pulse rounded bg-pale-stone"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
