import * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      style={{ borderRadius: "50%" }}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  alt,
  src,
  onError,
  ...props
}: React.ComponentProps<"img">) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return null;
  }

  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      className={cn("aspect-square size-full shrink-0 rounded-full object-cover", className)}
      style={{ borderRadius: "50%" }}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
        className,
      )}
      style={{ borderRadius: "50%" }}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
