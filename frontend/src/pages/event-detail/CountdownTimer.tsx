import { useState, useEffect } from "react";

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { value: timeLeft.days, label: "天" },
        { value: timeLeft.hours, label: "时" },
        { value: timeLeft.minutes, label: "分" },
        { value: timeLeft.seconds, label: "秒" },
      ].map((item, i) => (
        <div key={i}>
          <div className="text-2xl font-bold text-brand font-mono">
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] text-gray-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
