"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function ConfirmSubmit({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn("disabled:opacity-50", className)}
    >
      {children}
    </button>
  );
}
