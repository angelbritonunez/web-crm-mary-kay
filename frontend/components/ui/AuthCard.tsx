import { ReactNode } from "react"

interface AuthCardProps {
  icon: ReactNode
  title: string
  subtitle: string
  caption: string
  children: ReactNode
}

export default function AuthCard({ icon, title, subtitle, caption, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left column — hidden on mobile */}
      <div
        className="hidden md:flex flex-col items-center justify-center gap-4 text-white px-10"
        style={{ width: "38%", backgroundColor: "#E75480" }}
      >
        <div>{icon}</div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-lg font-medium opacity-90">{subtitle}</p>
        <p className="text-sm opacity-70">{caption}</p>
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col justify-center bg-white px-10 py-10" style={{ padding: "2.5rem" }}>
        {children}
      </div>
    </div>
  )
}
