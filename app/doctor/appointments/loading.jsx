export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-md bg-pale-stone"></div>
        <div className="h-10 w-40 animate-pulse rounded-md bg-pale-stone"></div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-pale-stone"></div>
        <div className="h-10 w-32 animate-pulse rounded-md bg-pale-stone"></div>
      </div>

      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-md bg-pale-stone"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-pale-stone"></div>
        ))}
      </div>
    </div>
  )
}
