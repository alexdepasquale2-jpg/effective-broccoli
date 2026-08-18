import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function playCelebration() {
  if (typeof window !== "undefined") {
    import("canvas-confetti").then((confetti) => {
      confetti.default({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"],
      });
    });
  }
}
