import * as React from 'react'
import { cn } from '../../lib/utils.js'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  underline?: 'auto' | 'always' | 'hover' | 'none'
  color?: 'gray' | 'blue' | 'green' | 'red' | 'iris' | 'inherit'
  weight?: 'light' | 'regular' | 'medium' | 'bold'
  size?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({
    className,
    underline = 'auto',
    color = 'blue',
    weight = 'regular',
    size = 'inherit',
    ...props
  }, ref) => {
    const sizeClasses = {
      '1': 'text-xs',
      '2': 'text-sm',
      '3': 'text-base',
      '4': 'text-lg',
      '5': 'text-xl',
      '6': 'text-2xl',
      '7': 'text-3xl',
      '8': 'text-4xl',
      '9': 'text-5xl',
      'inherit': '',
    }

    const weightClasses = {
      'light': 'font-light',
      'regular': 'font-normal',
      'medium': 'font-medium',
      'bold': 'font-bold',
    }

    const colorClasses = {
      'gray': 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
      'blue': 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
      'green': 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
      'red': 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200',
      'iris': 'text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200',
      'inherit': 'text-inherit',
    }

    const underlineClasses = {
      'auto': 'underline',
      'always': 'underline',
      'hover': 'no-underline hover:underline',
      'none': 'no-underline',
    }

    return (
      <a
        ref={ref}
        className={cn(
          'transition-colors',
          sizeClasses[size as keyof typeof sizeClasses],
          weightClasses[weight],
          colorClasses[color],
          underlineClasses[underline],
          className,
        )}
        {...props}
      />
    )
  },
)
Link.displayName = 'Link'

export { Link }
