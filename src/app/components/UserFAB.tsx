import { Plus } from "lucide-react";

interface UserFABProps {
  onClick: () => void;
}

export function UserFAB({ onClick }: UserFABProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      {/* Floating Action Button with notch design */}
      <button
        onClick={onClick}
        className="pointer-events-auto relative -top-6 flex items-center justify-center h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all hover:scale-110 active:scale-95 border-4 border-white dark:border-slate-900"
        aria-label="Grofvuil melden"
      >
        <Plus className="h-8 w-8 text-white" strokeWidth={3} />
      </button>
    </div>
  );
}