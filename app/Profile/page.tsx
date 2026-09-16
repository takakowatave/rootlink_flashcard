'use client'

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EditProfileModal from "@/components/EditProfileModal";
import { FaUserCircle } from "react-icons/fa";
import type { Profile } from "@/types/Profile";
import { useAuthReload } from "@/lib/useAuthReload";

// AppShell.ensureProfile と同じロジックで、profiles 行が無ければその場で作る。
// .single() は行が無いと throw するので .maybeSingle() で受けて、
// null なら insert → 再取得する。
async function loadOrInsertProfile(userId: string): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (existing) return existing;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return null;

  const username =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "";
  const avatar_url =
    user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    username,
    avatar_url,
  });
  if (error) return null;

  const { data: refetched } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();
  return refetched ?? null;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  // マウント + SIGNED_IN で profile を再取得（行が無ければ insert 込み）。
  // SIGNED_OUT では profile を空にする。
  useAuthReload(async (userId, event) => {
    if (event === "SIGNED_OUT" || !userId) {
      setProfile(null);
      return;
    }
    const p = await loadOrInsertProfile(userId);
    if (p) setProfile(p);
  });

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">RootLink</h1>

      <div className="flex items-center gap-4 mb-10">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} className="w-20 h-20 rounded-full" />
        ) : (
          <FaUserCircle className="w-20 h-20 text-gray-300" />
        )}

        <div>
          <p className="text-gray-500 text-sm">Display name</p>
          <p className="text-lg font-medium">
            {profile.username ?? "未設定"}
          </p>
        </div>
      </div>

      <button
        className="px-4 py-2 rounded-lg border"
        onClick={() => setOpen(true)}
      >
        Edit profile
      </button>

      <EditProfileModal
        isOpen={open}
        onClose={() => setOpen(false)}
        profile={profile}
        onUpdated={() => window.location.reload()}
      />
    </div>
  );
}
