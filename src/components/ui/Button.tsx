import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      primary: 'bg-deep-blue-500 text-white hover:bg-deep-blue-600 focus-visible:ring-deep-blue-500',
      secondary: 'bg-soft-peach-200 text-deep-blue-700 hover:bg-soft-peach-300 focus-visible:ring-soft-peach-500',
      outline: 'border border-soft-peach-300 bg-white text-deep-blue-700 hover:bg-soft-peach-50 focus-visible:ring-deep-blue-500',
      ghost: 'text-deep-blue-700 hover:bg-soft-peach-100 focus-visible:ring-deep-blue-500'
    }
    
    const sizes = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-8 text-base'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
export default Button 