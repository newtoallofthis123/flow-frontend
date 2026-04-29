import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ChipVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'
type ChipSize = 'sm' | 'md'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant
  size?: ChipSize
}

const variantClasses: Record<ChipVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
}

const sizeClasses: Record<ChipSize, string> = {
  sm: 'text-[11px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-md font-medium leading-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
)
Chip.displayName = 'Chip'

export default Chip
