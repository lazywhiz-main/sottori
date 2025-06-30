import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const variants = {
      primary: 'bg-deep-blue-500 text-white hover:bg-deep-blue-600 focus:ring-deep-blue-500 gentle-hover',
      secondary: 'bg-warm-coral-400 text-white hover:bg-warm-coral-500 focus:ring-warm-coral-400 gentle-hover',
      outline: 'border-2 border-deep-blue-500 text-deep-blue-500 hover:bg-deep-blue-500 hover:text-white focus:ring-deep-blue-500 gentle-hover',
      ghost: 'text-deep-blue-500 hover:bg-deep-blue-50 focus:ring-deep-blue-500 gentle-hover'
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
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
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button 