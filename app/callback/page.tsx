'use client'

import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

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
    };

    run();
  }, []);

  return <p>Logging in...</p>;
}
