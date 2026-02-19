import { cn } from '@/lib/utils'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Vertical spacing: default (section), large, or none */
  spacing?: 'default' | 'large' | 'none'
  /** Semantic element */
  as?: 'section' | 'div' | 'aside'
  /** Background: default, secondary (muted), or primary */
  variant?: 'default' | 'secondary' | 'primary'
}

export function Section({
  children,
  className,
  spacing = 'default',
  as: Component = 'section',
  variant = 'default',
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn(
        variant === 'secondary' && 'bg-secondary',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        spacing === 'default' && 'py-20 lg:py-section-lg',
        spacing === 'large' && 'py-24 lg:py-30',
        spacing === 'none' && 'py-0',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
