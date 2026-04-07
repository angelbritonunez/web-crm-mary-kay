import { ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface AuthButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: ReactNode
}

export default function AuthButton({ onClick, loading, disabled, children }: AuthButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-white transition disabled:opacity-50"
      style={{ backgroundColor: "#E75480" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d04070" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E75480" }}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Cargando...
        </>
      ) : (
        children
      )}
    </button>
  )
}
