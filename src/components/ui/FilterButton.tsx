import { forwardRef, type ButtonHTMLAttributes, type ComponentType, type SVGProps } from 'react'
import { cn } from '../../lib/utils'

interface FilterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  active?: boolean
  count?: number
}

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  ({ className, icon: Icon, active, count, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium',
        'transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-border hover:bg-accent',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" aria-hidden />}
      <span>{children}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded text-[11px] font-semibold leading-none',
            active
              ? 'bg-primary-foreground/15 text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  ),
)
FilterButton.displayName = 'FilterButton'

export default FilterButton
