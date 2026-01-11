import { Plus } from "lucide-react";
import { Button } from "./ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingActionButton({ onClick, label = "Melden" }: FloatingActionButtonProps) {
  return (
    <>
      {/* Mobile FAB */}
      <div className="lg:hidden">
        <Button
          onClick={onClick}
          size="lg"
          className="fixed bottom-24 right-5 h-16 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 z-40 p-0 transition-all hover:scale-110 active:scale-95 border-2 border-white dark:border-slate-800"
          aria-label={label}
        >
          <Plus className="h-8 w-8 text-white" strokeWidth={2.5} />
        </Button>
      </div>

      {/* Tablet/Desktop FAB with label */}
      <div className="hidden lg:block">
        <Button
          onClick={onClick}
          size="lg"
          className="fixed bottom-8 right-8 h-16 gap-3 rounded-2xl shadow-2xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 z-40 px-8 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
          <span className="text-lg font-semibold text-white">Grofvuil Melden</span>
        </Button>
      </div>
    </>
  );
}