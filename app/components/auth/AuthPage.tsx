"use client";

import { useState } from "react";
import { HiX } from "react-icons/hi";
import ModalShell from "@/components/ModalShell";
import PrivacyContent from "@/components/PrivacyContent";
import { openExternalLink } from "@/lib/openExternal";
import { useDisplayLocale } from "@/lib/useDisplayLocale";

const CONTACT_URL = "https://tally.so/r/ODJoEY";

export default function AuthPage({ children }: { children: React.ReactNode }) {
  const locale = useDisplayLocale();
  const labels = locale === 'en'
    ? { privacy: 'Privacy', contact: 'Contact', close: 'Close' }
    : { privacy: 'プライバシーポリシー', contact: 'お問い合わせ', close: '閉じる' };
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen items-start justify-center bg-white px-2 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))] md:pt-24 md:pb-32">
      <div className="w-full lg:max-w-md">{children}</div>

      <footer className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 text-sm text-muted">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-primary-dark transition-colors"
          >
            {labels.privacy}
          </button>
          <button
            type="button"
            onClick={() => openExternalLink(CONTACT_URL)}
            className="hover:text-primary-dark transition-colors"
          >
            {labels.contact}
          </button>
        </div>
        <p>© 2026 RootLink. All rights reserved.</p>
      </footer>

      <ModalShell
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        headerRight={
          <button
            type="button"
            onClick={() => setPrivacyOpen(false)}
            className="p-2 -mr-1 rounded-full hover:bg-primary-subtle text-muted"
            aria-label={labels.close}
          >
            <HiX className="size-5" />
          </button>
        }
      >
        <div className="px-6 py-8">
          <PrivacyContent />
        </div>
      </ModalShell>
    </div>
  );
}
