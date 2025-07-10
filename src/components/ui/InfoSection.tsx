import React from 'react'
import { cn } from '@/lib/utils'

interface InfoSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title: string
  icon?: React.ReactNode
  variant?: 'treatment' | 'guidelines' | 'support' | 'side-effects' | 'clinical-trials'
  className?: string
}

const InfoSection = React.forwardRef<HTMLDivElement, InfoSectionProps>(
  ({ className, variant = 'treatment', title, icon, children, ...props }, ref) => {
    const variants = {
      treatment: 'border-l-4 border-deep-blue-500 bg-deep-blue-50',
      guidelines: 'border-l-4 border-golden-yellow-500 bg-golden-yellow-50',
      support: 'border-l-4 border-soft-peach-500 bg-soft-peach-50',
      'side-effects': 'border-l-4 border-warm-coral-500 bg-warm-coral-50',
      'clinical-trials': 'border-l-4 border-deep-blue-600 bg-deep-blue-100'
    }
    
    const iconColors = {
      treatment: 'text-deep-blue-600',
      guidelines: 'text-golden-yellow-700',
      support: 'text-soft-peach-700',
      'side-effects': 'text-warm-coral-700',
      'clinical-trials': 'text-deep-blue-700'
    }

    return (
      <div
        className={cn(
          'rounded-2xl p-6 transition-all duration-300',
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className={cn('text-2xl', iconColors[variant])}>
              {icon}
            </div>
          )}
          <h3 className="text-xl font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    )
  }
)

InfoSection.displayName = 'InfoSection'

export { InfoSection } 