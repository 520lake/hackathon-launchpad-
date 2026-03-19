export interface ProfileUser {
  id?: number;
  email?: string | null;
  email_verified?: boolean | null;
  is_superuser?: boolean | null;
  can_create_hackathon?: boolean | null;
  username?: string | null;
  full_name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  city?: string | null;
  phone?: string | null;
  skills?: string | null;
  interests?: string | null;
}
