import { ReactNode, InputHTMLAttributes } from "react"

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
}

export default function AuthInput({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  leftIcon,
  rightIcon,
  className = "",
  ...rest
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-gray-400">{leftIcon}</span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E75480] text-sm ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-9" : ""} ${className}`}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 text-gray-400 cursor-pointer">{rightIcon}</span>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
