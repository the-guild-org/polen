import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../lib/utils.js'
import { toggleVariants } from './toggle.js'

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: 'default',
  variant: 'default',
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  & React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
  & Omit<VariantProps<typeof toggleVariants>, 'size'>
  & { size?: 'default' | 'sm' | 'lg' | string | number }
>(({ className, variant, size, children, ...props }, ref) => {
  // Map numeric sizes
  const sizeMap: Record<string, string> = {
    '1': 'sm',
    '2': 'default',
    '3': 'lg',
  }
  const mappedSize = (size && sizeMap[String(size)]) || size

  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size: mappedSize as any }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  & React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
  & VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

// Export with proper typing
export const ToggleGroupRoot = ToggleGroup as React.ForwardRefExoticComponent<
  & React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
  & Omit<VariantProps<typeof toggleVariants>, 'size'>
  & { size?: 'default' | 'sm' | 'lg' | string | number }
  & React.RefAttributes<React.ElementRef<typeof ToggleGroupPrimitive.Root>>
>

export { ToggleGroup, ToggleGroupItem }
