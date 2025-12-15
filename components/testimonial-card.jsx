export function TestimonialCard({ name, role, testimonial, avatarSrc }) {
  return (
    <div className="group flex flex-col rounded-xl border border-earth-beige/50 bg-white p-6 shadow-sm hover:shadow-lg hover:border-amber-300/50 transition-all duration-300 hover:-translate-y-1">
      <div className="mb-5 flex-1">
        <p className="text-drift-gray text-[15px] leading-relaxed group-hover:text-graphite transition-colors duration-300">
          "{testimonial}"
        </p>
      </div>
      <div className="mt-auto flex items-center pt-4 border-t border-earth-beige/30">
        <div className="mr-3 h-12 w-12 overflow-hidden rounded-full ring-2 ring-earth-beige/20 group-hover:ring-amber-300/40 transition-all duration-300 shadow-sm">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.src = "/placeholder.svg"
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-600 font-semibold text-lg">
              {name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-graphite group-hover:text-amber-600 transition-colors duration-300">{name}</p>
          <p className="text-sm text-drift-gray mt-0.5">{role}</p>
        </div>
      </div>
    </div>
  )
}
