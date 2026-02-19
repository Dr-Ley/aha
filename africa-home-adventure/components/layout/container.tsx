import { cn } from '@/lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max width: default (content), wide, or full */
  size?: 'default' | 'wide' | 'full'
  /** Horizontal padding; uses theme px when true */
  padded?: boolean
}

export function Container({
  children,
  className,
  size = 'default',
  padded = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        size === 'default' && 'max-w-content',
        size === 'wide' && 'max-w-wide',
        padded && 'px-6 sm:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
