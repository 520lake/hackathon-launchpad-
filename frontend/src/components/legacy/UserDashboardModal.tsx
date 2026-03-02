import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import AIResumeModal from '../AIResumeModal';

// Constants
const CITY_OPTIONS = ['New York', 'London', 'Tokyo', 'San Francisco', 'Berlin', 'Singapore', 'Remote', 'Shanghai', 'Beijing', 'Hangzhou', 'Shenzhen'];
const SKILL_OPTIONS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Full Stack' },
  { value: 'design', label: 'UI/UX Design' },
  { value: 'product', label: 'Product Mgmt' },
  { value: 'ai', label: 'AI/LLM' },
  { value: 'blockchain', label: 'Web3/Blockchain' },
  { value: 'mobile', label: 'Mobile Dev' },
  { value: 'data', label: 'Data Science' },
  { value: 'devops', label: 'DevOps' },
];

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  registration_start_date?: string;
  registration_end_date?: string;
}

interface EnrollmentWithHackathon {
  id: number;
  status: string;
  joined_at: string;
  hackathon: Hackathon;
}

interface User {
  id: number;
  email: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  is_verified?: boolean;
  skills?: string;
  interests?: string;
  city?: string;
  phone?: string;
  personality?: string;
  bio?: string;
}

interface Team {
  id: number;
  hackathon_id: number;
  name: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  team?: Team;
}

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHackathonSelect?: (id: number, initialTab?: string) => void;
  onVerifyClick: () => void;
  onUserUpdate?: () => void;
  onTeamMatchClick?: () => void;
  onEditHackathon?: (hackathon: any) => void;
  user?: User | null;
  lang: 'zh' | 'en';
}

export default function UserDashboardModal({ isOpen, onClose, onHackathonSelect, onVerifyClick, onUserUpdate, onEditHackathon, user: initialUser, lang }: UserDashboardModalProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [myCreated, setMyCreated] = useState<Hackathon[]>([]);
  const [myJoined, setMyJoined] = useState<EnrollmentWithHackathon[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  // const [loading, setLoading] = useState(false); // Removed unused loading
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'projects' | 'profile'>('created');
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);
  const [resume, setResume] = useState('');
  
  // Profile form
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [personality, setPersonality] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMyData();
      
      // Reset animations
      if (containerRef.current) {
        gsap.set(containerRef.current, { opacity: 0, scale: 0.95 });
        gsap.to(containerRef.current, { 
          opacity: 1, 
          scale: 1, 
          duration: 0.4, 
          ease: "power3.out" 
        });
      }

      if (sidebarRef.current) {
        gsap.fromTo(sidebarRef.current.children,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, delay: 0.2, ease: "power2.out" }
        );
      }
    }
  }, [isOpen]);

  // Tab change animation
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  const fetchMyData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 0. 获取当前用户信息
      const resUser = await axios.get('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` }
      });
      setUser(resUser.data);
      // Init form data
      setNickname(resUser.data.nickname || '');
      setAvatarUrl(resUser.data.avatar_url || '');
      setSkills(resUser.data.skills || '');
      setInterests(resUser.data.interests || '');
      setCity(resUser.data.city || '');
      setPhone(resUser.data.phone || '');
      setPersonality(resUser.data.personality || '');
      setBio(resUser.data.bio || '');

      // 1. 获取我创建的活动
      const resCreated = await axios.get('/api/v1/hackathons/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyCreated(Array.isArray(resCreated.data) ? resCreated.data : []);
      
      // 2. 获取我参与的活动
      const resJoined = await axios.get('/api/v1/enrollments/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJoined(Array.isArray(resJoined.data) ? resJoined.data : []);

      // 3. Get my projects
      try {
        const resProjects = await axios.get('/api/v1/projects/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMyProjects(Array.isArray(resProjects.data) ? resProjects.data : []);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveResume = async (newBio: string, newSkills: string[]) => {
    const skillsString = newSkills.join(',');
    setBio(newBio);
    setSkills(skillsString);
    
    setSavingProfile(true);
    try {
        const token = localStorage.getItem('token');
        await axios.put('/api/v1/users/me', {
            nickname,
            avatar_url: avatarUrl,
            skills: skillsString,
            interests,
            city,
        });
    } catch (e) { console.error(e) }
  };
  return <div>Legacy UserDashboardModal</div>;
}
