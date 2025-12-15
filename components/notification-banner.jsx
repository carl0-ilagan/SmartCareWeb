import { Bell } from "lucide-react"

export default function NotificationBanner() {
  return (
    <div className="bg-gradient-to-r from-soft-amber to-soft-amber/80 text-white p-4 rounded-lg mb-6 shadow-md">
      <div className="flex items-center">
        <div className="bg-white/20 p-2 rounded-full mr-4">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-white/80 text-sm">Stay updated with your latest activities and alerts</p>
        </div>
      </div>
    </div>
  )
}
