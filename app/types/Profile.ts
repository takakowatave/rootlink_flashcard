// types/profile.ts
import type { DisplayLocale } from './DisplayLocale'

export interface Profile {
    id: string;
    created_at: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    twitter: string | null;
    email: string | null;
    display_locale: DisplayLocale | null;
}
