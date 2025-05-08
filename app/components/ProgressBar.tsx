import { useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function ProgressBar() {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (navigation.state === "loading") {
      setIsVisible(true);
      setProgress(0);
      timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 10, 90));
      }, 100);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
    }

    return () => clearInterval(timer);
  }, [navigation.state]);

  return isVisible ? (
    <div className="fixed top-16 left-0 w-full h-0.5 bg-transparent z-50">
      <div
        className="h-full bg-blue-500 transition-all duration-200 ease-out origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          transformOrigin: "left",
        }}
      />
    </div>
  ) : null;
}
