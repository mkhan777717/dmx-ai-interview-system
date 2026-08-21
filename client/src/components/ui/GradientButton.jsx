import React from 'react'

export function GradientButton({
  children,
  onClick,
  disabled = false,
  className = '',
  size = 'md',
  type = 'button',
  icon: Icon,
  iconRight: IconRight,
}) {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-xl',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-7 py-3.5 text-base rounded-2xl',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-gradient inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {Icon && <Icon className="text-current shrink-0" />}
      <span>{children}</span>
      {IconRight && <IconRight className="text-current shrink-0" />}
    </button>
  )
}

export default GradientButton
