import React from 'react'
import { cn } from '@/lib/utils'

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title?: string
  subtitle?: string
  badge?: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
  className?: string
}

const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ className, variant = 'default', title, subtitle, badge, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow',
      elevated: 'bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow',
      outlined: 'bg-white border-2 border-deep-blue-200 hover:border-deep-blue-300 transition-colors'
    }
    
    return (
      <div
        className={cn(
          'rounded-xl p-4 transition-all duration-300',
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {(title || subtitle || badge) && (
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {title && (
                <h4 className="text-lg font-medium text-gray-900 mb-1">
                  {title}
                </h4>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {badge && (
              <div className="ml-3 flex-shrink-0">
                {badge}
              </div>
            )}
          </div>
        )}
        <div className="text-gray-700 leading-relaxed">
          {children}
        </div>
      </div>
    )
  }
)

InfoCard.displayName = 'InfoCard'

interface InfoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'new' | 'priority-high' | 'priority-medium' | 'priority-low' | 'info'
  className?: string
}

const InfoBadge = React.forwardRef<HTMLSpanElement, InfoBadgeProps>(
  ({ className, variant = 'info', children, ...props }, ref) => {
    const variants = {
      new: 'bg-warm-coral-100 text-warm-coral-700',
      'priority-high': 'bg-error-500 text-white',
      'priority-medium': 'bg-warning-500 text-deep-blue-700',
      'priority-low': 'bg-soft-peach-200 text-deep-blue-600',
      info: 'bg-deep-blue-100 text-deep-blue-700'
    }
    
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    )
  }
)

InfoBadge.displayName = 'InfoBadge'

export { InfoCard, InfoBadge } 