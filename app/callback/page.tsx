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
  // 失敗画面 (「リンクの有効期限が切れているか、すでに使われています」) は
  // 認証が実際に成功して window.location.href = "/" で即遷移するケースで
  // 1 フレームだけ描画されて「失敗が一瞬出る」フラッシュになる。
  // 「マウント後 1500ms 経つまでは失敗画面を描画しない」にすることで、
  // 通常フローでは 1 秒以内に離脱するので失敗画面は絶対に見えなくなる。
  // 本当に auth が失敗して 1.5 秒滞在した場合だけ表示する。
  const [mayShowError, setMayShowError] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMayShowError(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);

        // 先に session を取る。以下の全ての失敗フォールバックは
        // 「session が無い」ときだけ発動させる。deeplink 二重発火 (AppShell
        // 側で verifyOtp 成功 → /callback で二度目を試みて "使用済み" で失敗
        // → 失敗画面が 1 フレーム描画されて onboarding に潜る) を根絶するため、
        // session がある = 認証は済んでいる、として扱う。
        const {
          data: { session: preSession },
        } = await supabase.auth.getSession();

        const urlError =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");
        if (urlError && !preSession) {
          setState("confirmed");
          return;
        }

        // 明示的な state=confirmed (AppShell.appUrlOpen から失敗時に渡される)
        // は本来「AppShell の verify が失敗した」シグナルだが、その後に別経路
        // で session が張られていれば成功として扱う。
        if (url.searchParams.get("state") === "confirmed" && !preSession) {
          setState("confirmed");
          return;
        }

        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");
        if (tokenHash && type && !preSession) {
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
            // 失敗しても、既にセッションが張られていれば成功として扱う
            // (別窓 / AppShell 側で既に verify 済みで、これは 2 回目)。
            const {
              data: { session: afterErr },
            } = await supabase.auth.getSession();
            if (!afterErr?.user) {
              setState("confirmed");
              return;
            }
          }
          if (type === "recovery") {
            window.location.href = "/reset-password";
            return;
          }
          // signup / email_change / magic link 等はこの下の profile 補完 &
          // sign_up_complete 計測を通す。
        } else if (tokenHash && type === "recovery" && preSession) {
          // 既にセッション張り済み + recovery → verify を叩き直さず直接遷移。
          window.location.href = "/reset-password";
          return;
        } else if (!tokenHash) {
          // 旧 PKCE 経路。@supabase/ssr は detectSessionInUrl で自動 exchange
          // するので、既にセッションが張られている可能性がある。
          if (!preSession) {
            const code = url.searchParams.get("code");
            if (code) {
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) {
                // 別ブラウザで開いた / code_verifier 無し / 使用済み 等。
                // ただしその間に別経路でセッションが張られていれば救う。
                const {
                  data: { session: afterErr },
                } = await supabase.auth.getSession();
                if (!afterErr?.user) {
                  setState("confirmed");
                  return;
                }
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
                    const {
                      data: { session: afterErr },
                    } = await supabase.auth.getSession();
                    if (!afterErr?.user) {
                      setState("confirmed");
                      return;
                    }
                  }
                }
              }
            }
          }
        }

        // まず session を再取得し、user はそこから取り出す。verifyOtp や
        // exchangeCodeForSession の直後は getUser がネットワーク経由の
        // /user 呼び出しで刺さることがあり、null で返ると失敗画面に落ちて
        // しまうため、session.user を優先して落とし込む。
        const {
          data: { session: finalSession },
        } = await supabase.auth.getSession();
        const user =
          finalSession?.user ??
          (await supabase.auth.getUser()).data.user ??
          null;

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

  if (state === "confirmed" && mayShowError) {
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
      <AuthCard title="認証しています">
        <p className="text-base text-muted text-center">
          しばらくお待ちください。
        </p>
      </AuthCard>
    </AuthPage>
  );
}
