import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { Info, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type AlertVariant = 'info' | 'warning' | 'danger' | 'success'

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant
  title?: ReactNode
  action?: ReactNode
}

const variantStyles: Record<
  AlertVariant,
  { rule: string; icon: string; Icon: typeof Info }
> = {
  info: {
    rule: 'before:bg-primary',
    icon: 'text-primary',
    Icon: Info,
  },
  warning: {
    rule: 'before:bg-warning',
    icon: 'text-warning',
    Icon: AlertTriangle,
  },
  danger: {
    rule: 'before:bg-destructive',
    icon: 'text-destructive',
    Icon: AlertOctagon,
  },
  success: {
    rule: 'before:bg-success',
    icon: 'text-success',
    Icon: CheckCircle2,
  },
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, action, children, ...props }, ref) => {
    const styles = variantStyles[variant]
    const Icon = styles.Icon
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative flex items-start gap-3 rounded-lg bg-muted/50 pl-4 pr-4 py-3',
          'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:rounded-full',
          styles.rule,
          className,
        )}
        {...props}
      >
        <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', styles.icon)} aria-hidden />
        <div className="flex-1 min-w-0">
          {title && (
            <div className="text-sm font-semibold text-foreground leading-tight">{title}</div>
          )}
          {children && (
            <div className={cn('text-sm text-muted-foreground', title && 'mt-1')}>
              {children}
            </div>
          )}
        </div>
        {action && <div className="shrink-0 ml-2">{action}</div>}
      </div>
    )
  },
)
Alert.displayName = 'Alert'

export default Alert
