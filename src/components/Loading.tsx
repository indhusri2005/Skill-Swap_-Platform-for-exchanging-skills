import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const Loading = ({ 
  size = "md", 
  text = "Loading...", 
  className,
  fullScreen = false 
}: LoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4 p-8 bg-background rounded-lg border shadow-lg">
          <Loader2 className={cn("animate-spin text-primary", sizeClasses.lg)} />
          <p className={cn("text-muted-foreground", textSizeClasses.lg)}>
            {text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
};

// For inline loading states
export const LoadingButton = ({ 
  size = "sm", 
  className 
}: Pick<LoadingProps, "size" | "className">) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };
  
  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
};

// For card/section loading states  
export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="bg-muted rounded-lg h-4 w-3/4 mb-2"></div>
    <div className="bg-muted rounded-lg h-4 w-1/2 mb-2"></div>
    <div className="bg-muted rounded-lg h-4 w-5/6"></div>
  </div>
);

export default Loading;
