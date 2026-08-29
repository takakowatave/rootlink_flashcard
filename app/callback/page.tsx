'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type State = "loading" | "error";

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
              setState("error");
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
          .single();

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

  return <p className="px-6 py-16 text-center text-gray-600">Logging in...</p>;
}
