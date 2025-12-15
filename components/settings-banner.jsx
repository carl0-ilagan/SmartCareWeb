"use client"

import { Cog, Shield, Bell } from "lucide-react"

export function SettingsBanner({ userRole = "patient" }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 p-6 shadow-md">
      <div className="relative z-10">
        <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Account Settings</h2>
            <p className="mt-1 text-sm text-white/90 sm:text-base">
              {userRole === "doctor"
                ? "Manage your doctor account preferences and security settings"
                : "Manage your account preferences, privacy, and security settings"}
            </p>
          </div>
          <div className="mt-4 hidden items-center space-x-2 sm:mt-0 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Cog className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-1 flex items-center">
              <Bell className="mr-1 h-4 w-4 text-white/70" />
              <p className="text-xs font-medium uppercase text-white/70">Notifications</p>
            </div>
            <p className="text-sm font-medium text-white">Control how you receive alerts</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-1 flex items-center">
              <Shield className="mr-1 h-4 w-4 text-white/70" />
              <p className="text-xs font-medium uppercase text-white/70">Privacy</p>
            </div>
            <p className="text-sm font-medium text-white">Manage your data sharing preferences</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-1 flex items-center">
              <Cog className="mr-1 h-4 w-4 text-white/70" />
              <p className="text-xs font-medium uppercase text-white/70">Security</p>
            </div>
            <p className="text-sm font-medium text-white">Keep your account secure</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-white/5"></div>
    </div>
  )
}
