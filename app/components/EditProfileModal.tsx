"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { getUserPlan } from "@/lib/supabaseApi";
import { FaUserCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import type { Profile } from "@/types/Profile";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdated: () => void;
}

interface FormData {
  display_name: string;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdated,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>();
  const [plan, setPlan] = useState<"premium" | "free" | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const API_BASE =
    process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
    "https://rootlink-server-v2-774622345521.asia-northeast1.run.app"

  const handleManagePlan = async () => {
    setIsPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch(`${API_BASE}/stripe/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json()
      if (data.ok && data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      toast.error("エラーが発生しました")
    } finally {
      setIsPortalLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      setValue("display_name", profile.username ?? "");
    }
  }, [profile, setValue]);

  useEffect(() => {
    if (isOpen) {
      getUserPlan().then(setPlan)
    }
  }, [isOpen]);

  if (!isOpen || !profile) return null;

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase
      .from("profiles")
      .update({ username: data.display_name })
      .eq("id", profile.id);

    if (error) {
      toast.error("更新に失敗しました");
      return;
    }

    toast.success("保存しました");
    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-6">Edit profile</h2>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mb-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-20 h-20 text-gray-300" />
            )}
          </div>
        </div>

        {/* プラン */}
        <div className="mb-4 px-1 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">現在のプラン</p>
            {plan === null ? (
              <p className="text-sm text-gray-400">読み込み中...</p>
            ) : plan === "premium" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200">
                ✦ Premium
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium border border-gray-200">
                Free
              </span>
            )}
          </div>
          {plan === "premium" && (
            <button
              type="button"
              onClick={handleManagePlan}
              disabled={isPortalLoading}
              className="text-xs text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
            >
              {isPortalLoading ? "..." : "プランを管理"}
            </button>
          )}
          {plan === "free" && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-amber-600 underline hover:text-amber-800 font-medium"
            >
              アップグレード →
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Display name
            </label>
            <input
              {...register("display_name")}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
