import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse duration-2000 rounded-md bg-muted/40", className)} {...props} />;
}

export { Skeleton };
