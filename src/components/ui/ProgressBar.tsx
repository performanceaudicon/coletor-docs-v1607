import React from 'react'
import { clsx } from 'clsx'

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className,
  showPercentage = true 
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progresso</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{normalizedProgress.toFixed(0)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={clsx(
            'h-2 rounded-full transition-all duration-300',
            normalizedProgress === 100 ? 'bg-green-600' : 'bg-orange-600'
          )}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar