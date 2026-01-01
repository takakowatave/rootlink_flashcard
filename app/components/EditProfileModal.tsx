"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
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

  useEffect(() => {
    if (profile) {
      setValue("display_name", profile.username ?? "");
    }
  }, [profile, setValue]);

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
