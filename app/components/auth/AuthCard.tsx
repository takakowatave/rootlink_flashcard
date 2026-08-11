"use client";

export default function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full">
      <div className="flex justify-center mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="RootLink" className="h-[17px] w-auto" />
      </div>
      <h2 className="text-lg font-semibold text-center mb-6">{title}</h2>
      {children}
    </div>
  );
}
