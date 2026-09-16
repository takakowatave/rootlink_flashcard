'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "../lib/supabaseClient";
import { sendEvent } from "@/lib/ga";

const SIGNUP_TRIGGER_KEY = "signup_trigger";
// 「新規ユーザー」とみなす signup 直後の窓
const NEW_USER_WINDOW_MS = 10 * 60 * 1000;

type State = "loading" | "error" | "confirmed";

export default function AuthCallback() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const urlError =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");

        if (urlError) {
          setState("error");
          return;
        }

        // @supabase/ssr の createBrowserClient は detectSessionInUrl が
        // デフォルト有効で、client 初期化時に URL の ?code= を自動 exchange する。
        // そのため既に session が張られている可能性があるので、まず確認する。
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!existingSession) {
          const code = url.searchParams.get("code");
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              // PKCE の code_verifier が別ブラウザに無いケース (Web で signup した
              // ユーザーが確認メールを別ブラウザで開いた等)。Supabase 側では
              // email_confirmed_at が入っているので認証完了として扱い、
              // ログイン導線に誘導する。native はアプリ deeplink で戻る経路のため
              // このパスには入らない。
              setState("confirmed");
              return;
            }
          } else {
            const fragment = window.location.hash.startsWith("#")
              ? window.location.hash.slice(1)
              : "";
            if (fragment) {
              const params = new URLSearchParams(fragment);
              const access_token = params.get("access_token");
              const refresh_token = params.get("refresh_token");
              if (access_token && refresh_token) {
                const { error } = await supabase.auth.setSession({
                  access_token,
                  refresh_token,
                });
                if (error) {
                  setState("error");
                  return;
                }
              }
            }
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setState("error");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        // profiles 行はトリガーで自動作成される（handle_new_user）。
        // 落ちてしまった過去ユーザー用に保険で insert も残す。
        if (!profile) {
          const googleName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "";

          const googleAvatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            username: googleName,
            avatar_url: googleAvatar,
          });
        } else {
          const googleName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null;

          const googleAvatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          const updates: { username?: string; avatar_url?: string } = {};

          if (!profile.username && googleName) {
            updates.username = googleName;
          }
          if (!profile.avatar_url && googleAvatar) {
            updates.avatar_url = googleAvatar;
          }

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("profiles")
              .update(updates)
              .eq("id", user.id);
          }
        }

        // 新規ユーザー判定: 未オンボーディング (acquisition_source が null)
        // かつ auth.users.email_confirmed_at が直近 NEW_USER_WINDOW_MS 以内。
        // created_at は signUp() 呼び出し時点で、メール認証まで数時間空くケースがあり
        // 「新規なのに計測されない」問題があるため email_confirmed_at を採用。
        const confirmedAtRaw = (user as { email_confirmed_at?: string | null })
          .email_confirmed_at;
        const confirmedAt = confirmedAtRaw ? new Date(confirmedAtRaw).getTime() : 0;
        const isRecent = confirmedAt > 0 && Date.now() - confirmedAt < NEW_USER_WINDOW_MS;
        const acquisitionSource = profile?.acquisition_source ?? null;
        const isNewUser = isRecent && !acquisitionSource;

        if (isNewUser) {
          let trigger: string | null = null;
          try {
            trigger = window.sessionStorage.getItem(SIGNUP_TRIGGER_KEY);
            window.sessionStorage.removeItem(SIGNUP_TRIGGER_KEY);
          } catch {
            // ignore
          }
          sendEvent("sign_up_complete", { trigger: trigger ?? "direct" });
        } else {
          // 新規ではないので trigger だけ掃除（残しておく理由が無い）
          try {
            window.sessionStorage.removeItem(SIGNUP_TRIGGER_KEY);
          } catch {
            // ignore
          }
        }

        window.location.href = "/";
      } catch {
        setState("error");
      }
    };

    run();
  }, []);

  if (state === "error") {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          認証に失敗しました
        </h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          リンクの有効期限が切れているか、無効になっている可能性があります。
          <br />
          もう一度お試しください。
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link href="/login" className="text-primary underline">
            ログイン
          </Link>
          <Link href="/signup" className="text-primary underline">
            新規登録
          </Link>
        </div>
      </div>
    );
  }

  if (state === "confirmed") {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          メール認証が完了しました
        </h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          ログインしてご利用ください。
        </p>
        <div className="flex items-center justify-center">
          <Link href="/login">
            <Button variant="primary">ログイン</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <p className="px-6 py-16 text-center text-gray-600">Logging in...</p>;
}
