import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import SubmitProjectModal from '../SubmitProjectModal';
import JudgingModal from '../JudgingModal';
import ResultPublishModal from '../ResultPublishModal';
import AIResumeModal from '../AIResumeModal';
import AIParticipantTools from '../AIParticipantTools';
import AIProjectAssistant from '../AIProjectAssistant';
import ReactMarkdown from 'react-markdown';

interface Recruitment {
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


interface Hackathon {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  registration_type?: 'individual' | 'team';
  format?: 'online' | 'offline';
  location?: string;
  organizer_name?: string;
  contact_info?: string; // JSON
  requirements?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  submission_start_date?: string;
  submission_end_date?: string;
  judging_start_date?: string;
  judging_end_date?: string;
  awards_detail?: string; // JSON
  rules_detail?: string;
  scoring_dimensions?: string; // JSON
  resource_detail?: string;
  results_detail?: string; // JSON
  sponsors_detail?: string; // JSON
  status: string;
  organizer_id: number;
}

interface Enrollment {
  id: number;
  status: string;
}

interface User {
  id: number;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  skills?: string[];
  interests?: string[];
}

interface JudgeUser {
  id: number;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
}

interface SponsorItem {
  name: string;
  logo: string;
  url: string;
}

interface TeamMember {
  id: number;
  user_id: number;
  user?: User;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  hackathon_id: number;
  leader_id: number;
  members?: TeamMember[];
  recruitments?: Recruitment[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack?: string;
  repo_url?: string;
  demo_url?: string;
  hackathon_id: number;
  team_id: number;
  team?: Team;
  status: string;
  cover_image?: string;
  total_score?: number;
}

interface HackathonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number | null;
  onEdit?: (hackathon: Hackathon) => void;
  onTeamMatch?: () => void;
  lang: 'zh' | 'en';
  initialTab?: string;
}

export default function HackathonDetailModal({ isOpen, onClose, hackathonId, onEdit, onTeamMatch, lang, initialTab }: HackathonDetailModalProps) {
    return <div>Legacy HackathonDetailModal</div>;
}
