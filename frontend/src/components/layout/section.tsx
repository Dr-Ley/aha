import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "default" | "large" | "none";
  as?: "section" | "div" | "aside";
  variant?: "default" | "secondary" | "primary";
}

export function Section({
  children,
  className,
  spacing = "default",
  as: Component = "section",
  variant = "default",
  ...props
}: SectionProps ) {
  return (
    <Component
      className={cn(
        variant === "secondary" && "bg-secondary",
        variant === "primary" && "bg-primary text-primary-content",
        spacing === "default" && "py-20 lg:py-[6rem]",
        spacing === "large" && "py-24 lg:py-[7.5rem]",
        spacing === "none" && "pt-20  pb-0",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
