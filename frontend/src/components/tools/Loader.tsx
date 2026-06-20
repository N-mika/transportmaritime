import { FC } from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  fullscreen?: boolean;
}

const Loader: FC<LoaderProps> = ({ text = "Chargement en cours...", fullscreen = false }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 w-full h-full
      ${fullscreen ? "fixed inset-0 bg-white/70 z-50 backdrop-blur-sm" : "p-6"}`}
    >
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-gray-700 text-sm font-medium">{text}</p>
    </div>
  );
};

export default Loader;
