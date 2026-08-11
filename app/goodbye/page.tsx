import Link from "next/link";
import Button from "@/components/Button";
import AuthPage from "@/components/auth/AuthPage";
import AuthCard from "@/components/auth/AuthCard";

export const metadata = {
  title: "退会が完了しました | RootLink",
};

export default function GoodbyePage() {
  return (
    <AuthPage>
      <AuthCard title="退会が完了しました">
        <div className="flex flex-col gap-4 py-2 text-center">
          <p className="text-sm text-gray-900 leading-relaxed">
            RootLink をご利用いただきありがとうございました。
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            登録メールアドレス宛に、退会完了のご連絡をお送りしています。
          </p>
          <Link href="/" className="mt-2">
            <Button type="button" variant="primary" size="md" radius="lg" fullWidth>
              トップへ戻る
            </Button>
          </Link>
        </div>
      </AuthCard>
    </AuthPage>
  );
}
