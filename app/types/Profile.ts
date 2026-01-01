// types/profile.ts
export interface Profile {
    id: string;
    created_at: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    twitter: string | null;
    email: string | null;
}
