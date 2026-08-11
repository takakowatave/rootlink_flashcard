"use client";

export default function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 border-t border-line" />
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex-1 border-t border-line" />
    </div>
  );
}
