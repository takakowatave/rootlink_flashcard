'use client'

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import AuthPage from "@/components/auth/AuthPage";
import AuthCard from "@/components/auth/AuthCard";
import { supabase } from "../lib/supabaseClient";
import { sendEvent } from "@/lib/ga";

const SIGNUP_TRIGGER_KEY = "signup_trigger";
// 「新規ユーザー」とみなす signup 直後の窓
const NEW_USER_WINDOW_MS = 10 * 60 * 1000;

type State = "loading" | "confirmed";

// メール認証 (signup / recovery / email_change) のリンクを踏んだ Web ユーザーが
// たどり着くページ。
//
// 対応する 2 経路:
//   - token_hash 方式 (新, 推奨):
//       /callback?token_hash=XXX&type=signup|recovery|email_change
//     Supabase の email template を {{ .TokenHash }} 方式に切り替えたときに走る。
//     verifyOtp でセッションを張る。type=recovery の場合は /reset-password に飛ばす。
//   - PKCE code 方式 (旧, 互換用):
//       /callback?code=XXX
//     @supabase/ssr の createBrowserClient は detectSessionInUrl でこれを自動 exchange
//     するので、既存 session があればそのまま進む。無ければ手動 exchange。
//
// 失敗時 (期限切れ / 使用済み / bad_code_verifier など) はメール認証は済んでいる
// 可能性があるので、confirmed 状態で「ログイン画面へ」だけ出す。
//
// 画面は AuthPage / AuthCard を流用してログイン・新規登録画面と同じ枠にする。
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
          setState("confirmed");
          return;
        }

        // 明示的な state=confirmed (AppShell.appUrlOpen から失敗時に渡される) は
        // そのまま案内画面へ。
        if (url.searchParams.get("state") === "confirmed") {
          setState("confirmed");
          return;
        }

        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as
              | "signup"
              | "recovery"
              | "email_change"
              | "magiclink"
              | "invite",
          });
          if (error) {
            // 失敗時 (期限切れ・使用済み等) は再度メールを送っても意味が無い
            // ことが多い。既に email_confirmed_at が付いている可能性が高いので、
            // ログイン導線に流す。
            setState("confirmed");
            return;
          }
          if (type === "recovery") {
            window.location.href = "/reset-password";
            return;
          }
          // signup / email_change / magic link 等はこの下の profile 補完 &
          // sign_up_complete 計測を通す。
        } else {
          // 旧 PKCE 経路。@supabase/ssr は detectSessionInUrl で自動 exchange
          // するので、既にセッションが張られている可能性がある。まず確認。
          const {
            data: { session: existingSession },
          } = await supabase.auth.getSession();

          if (!existingSession) {
            const code = url.searchParams.get("code");
            if (code) {
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) {
                // 別ブラウザで開いた / code_verifier 無し等。email 認証は
                // 済んでいる想定なので confirmed で案内。
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
                    setState("confirmed");
                    return;
                  }
                }
              }
            }
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setState("confirmed");
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
            await supabase.from("profiles").update(updates).eq("id", user.id);
          }
        }

        // 新規ユーザー判定: 未オンボーディング (acquisition_source が null)
        // かつ auth.users.email_confirmed_at が直近 NEW_USER_WINDOW_MS 以内。
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
          try {
            window.sessionStorage.removeItem(SIGNUP_TRIGGER_KEY);
          } catch {
            // ignore
          }
        }

        window.location.href = "/";
      } catch {
        setState("confirmed");
      }
    };

    run();
  }, []);

  if (state === "confirmed") {
    return (
      <AuthPage>
        <AuthCard title="リンクの有効期限が切れているか、すでに使われています">
          <p className="text-base text-gray-950 leading-relaxed text-center mb-6">
            メール認証はすでに完了している可能性があります。
            <br />
            そのままログインしてご利用ください。
          </p>
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            variant="primary"
            size="md"
            radius="lg"
            fullWidth
          >
            ログイン画面へ
          </Button>
        </AuthCard>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthCard title="読み込み中...">
        <p className="text-base text-muted text-center">
          メール認証を確認しています。
        </p>
      </AuthCard>
    </AuthPage>
  );
}
