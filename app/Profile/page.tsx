'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EditProfileModal from "@/components/EditProfileModal";
import { FaUserCircle } from "react-icons/fa";
import type { Profile } from "@/types/Profile";

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>();

      if (data) setProfile(data);
    };

    load();
  }, []);

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
