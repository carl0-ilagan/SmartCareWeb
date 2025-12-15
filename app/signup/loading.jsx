export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-48 animate-pulse rounded-md bg-pale-stone"></div>
          <div className="mx-auto mt-2 h-4 w-64 animate-pulse rounded-md bg-pale-stone"></div>
        </div>

        <div className="space-y-4 rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="h-10 w-full animate-pulse rounded-md bg-pale-stone"></div>
          </div>

          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="h-10 w-full animate-pulse rounded-md bg-pale-stone"></div>
          </div>

          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="h-10 w-full animate-pulse rounded-md bg-pale-stone"></div>
          </div>

          <div className="h-10 w-full animate-pulse rounded-md bg-pale-stone"></div>

          <div className="flex items-center">
            <div className="h-px flex-1 bg-pale-stone"></div>
            <div className="mx-2 h-4 w-8 animate-pulse rounded-md bg-pale-stone"></div>
            <div className="h-px flex-1 bg-pale-stone"></div>
          </div>

          <div className="h-10 w-full animate-pulse rounded-md bg-pale-stone"></div>
        </div>
      </div>
    </div>
  )
}
