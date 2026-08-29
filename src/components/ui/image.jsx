import React from "react";
import { cn } from "@/lib/utils";

export const Image = React.forwardRef(({ src, alt = "", fittingType = "cover", className, ...props }, ref) => {
  const objectFitClass =
    fittingType === "fill"
      ? "object-cover"
      : fittingType === "contain"
      ? "object-contain"
      : "object-cover";

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn(objectFitClass, className)}
      loading="lazy"
      {...props}
    />
  );
});

Image.displayName = "Image";
