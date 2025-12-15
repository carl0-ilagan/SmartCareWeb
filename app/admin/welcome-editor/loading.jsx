import { Skeleton } from "@/components/ui/skeleton"
import { AdminHeaderBanner } from "@/components/admin-header-banner"

export default function WelcomeEditorLoading() {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <AdminHeaderBanner
        title="Content Management"
        subtitle="Edit and manage website content and welcome messages"
        stats={[
          {
            label: "Last Updated",
            value: "Loading...",
            icon: <div className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Landing Sections",
            value: "...",
            icon: <div className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Welcome Modals",
            value: "...",
            icon: <div className="h-4 w-4 text-white/70" />,
          },
        ]}
      />

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Tabs */}
      <div className="border rounded-lg bg-white">
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Content sections */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div>
                  <Skeleton className="h-48 w-full" />
                  <div className="flex space-x-2 mt-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
