'use client'

import { CategoryTabData, InfoUpdateCategory } from '../../lib/types/info-updates'

interface CategoryTabsProps {
  tabs: CategoryTabData[]
  selectedCategory: InfoUpdateCategory | 'all'
  onCategoryChange: (category: InfoUpdateCategory | 'all') => void
}

export function CategoryTabs({ 
  tabs, 
  selectedCategory, 
  onCategoryChange 
}: CategoryTabsProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-soft-peach-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = selectedCategory === tab.category
            
            return (
              <button
                key={tab.category}
                onClick={() => onCategoryChange(tab.category)}
                className={`
                  py-3 px-4 rounded-t-lg font-medium text-sm whitespace-nowrap transition-all duration-200 gentle-hover
                  ${isActive 
                    ? 'sottori-tab-active border-b-2 border-deep-blue-500' 
                    : 'sottori-tab-inactive border-b-2 border-transparent'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`
                      inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${isActive 
                        ? 'bg-white text-deep-blue-500' 
                        : 'bg-deep-blue-100 text-deep-blue-600'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
} 