export default function NewAppointmentLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6 flex items-center">
        <div className="mr-4 h-9 w-9 rounded-full bg-pale-stone"></div>
        <div className="h-8 w-64 rounded-md bg-pale-stone"></div>
      </div>

      <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="mb-1 h-5 w-20 rounded bg-pale-stone"></div>
              <div className="h-10 w-full rounded-md bg-pale-stone"></div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 h-5 w-16 rounded bg-pale-stone"></div>
                <div className="h-10 w-full rounded-md bg-pale-stone"></div>
              </div>

              <div>
                <div className="mb-1 h-5 w-16 rounded bg-pale-stone"></div>
                <div className="h-10 w-full rounded-md bg-pale-stone"></div>
              </div>
            </div>

            <div>
              <div className="mb-1 h-5 w-32 rounded bg-pale-stone"></div>
              <div className="h-10 w-full rounded-md bg-pale-stone"></div>
            </div>

            <div>
              <div className="mb-1 h-5 w-28 rounded bg-pale-stone"></div>
              <div className="h-32 w-full rounded-md bg-pale-stone"></div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <div className="h-10 w-20 rounded-md bg-pale-stone"></div>
            <div className="h-10 w-40 rounded-md bg-pale-stone"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
