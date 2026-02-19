import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "wide" | "full";
  padded?: boolean;
}

export function Container({
  children,
  className,
  size = "default",
  padded = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        size === "default" && "max-w-7xl",
        size === "wide" && "max-w-screen-2xl",
        padded && "px-6 sm:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
