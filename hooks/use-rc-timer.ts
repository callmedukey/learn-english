import { useEffect } from "react";

interface UseTimerProps {
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  isActive: boolean;
  onTimeOut?: () => void;
}

export function useRCTimer({
  timeLeft,
  setTimeLeft,
  isActive,
  onTimeOut,
}: UseTimerProps) {
  useEffect(() => {
    if (timeLeft > 0 && isActive) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isActive && onTimeOut) {
      onTimeOut();
    }
  }, [timeLeft, isActive, onTimeOut, setTimeLeft]);
}
