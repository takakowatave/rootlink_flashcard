"use client";

import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function SettingsSection({ title, children }: Props) {
  return (
    <section className="flex flex-col">
      <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 px-1">
        {title}
      </h3>
      <div className="flex flex-col bg-gray-50 rounded-2xl px-4">
        {children}
      </div>
    </section>
  );
}
