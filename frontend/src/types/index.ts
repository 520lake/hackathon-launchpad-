export interface Hackathon {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  submission_start_date?: string;
  submission_end_date?: string;
  judging_start_date?: string;
  judging_end_date?: string;
  status: string;
  organizer_id: number;
  organizer_name?: string;
  format?: 'online' | 'offline';
  registration_type?: 'individual' | 'team';
  location?: string;
  contact_info?: string; // JSON string
  requirements?: string;
  awards_detail?: string; // JSON string
  rules_detail?: string;
  scoring_dimensions?: string; // JSON string
  resource_detail?: string;
  results_detail?: string; // JSON string
  sponsors_detail?: string; // JSON string
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  is_verified?: boolean;
  skills?: string | string[]; // Inconsistency in original code: string in Dashboard, string[] in Detail. Allowing both or union.
  interests?: string | string[];
  city?: string;
  phone?: string;
  personality?: string;
  bio?: string;
  organization?: string;
  title?: string; // Job title
}

export interface Enrollment {
  id: number;
  status: string;
  joined_at?: string;
  hackathon_id?: number;
  user_id?: number;
}

export interface EnrollmentWithHackathon extends Enrollment {
  hackathon: Hackathon;
}

export interface TeamMember {
  id: number;
  user_id: number;
  user?: User;
  role?: string;
  joined_at?: string;
}

export interface Team {
  id: number;
  hackathon_id: number;
  name: string;
  description?: string;
  leader_id?: number;
  members?: TeamMember[];
  recruitments?: Recruitment[];
}

export interface Recruitment {
  id: number;
  team_id: number;
  role: string;
  skills: string;
  count: number;
  description?: string;
  contact_info?: string;
  status: string;
  created_at: string;
  team?: Team;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  team?: Team;
}

export interface SponsorItem {
  name: string;
  logo: string;
  url: string;
}
