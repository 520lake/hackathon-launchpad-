import React from 'react';

interface Hackathon {
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
  status: string;
  organizer_id: number;
  organizer_name?: string;
  format?: 'online' | 'offline';
  registration_type?: 'individual' | 'team';
  awards_detail?: string;
}

interface HackathonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number | null;
  onEdit?: (hackathon: Hackathon) => void;
  onTeamMatch?: () => void;
  lang?: 'zh' | 'en';
  initialTab?: string;
}

const HackathonDetailModal: React.FC<HackathonDetailModalProps> = ({ isOpen, onClose, hackathonId, onEdit, onTeamMatch, lang, initialTab }) => {
  if (!isOpen) return null;

  // Placeholder usage to resolve TS6133 errors
  console.log(onEdit, onTeamMatch, lang, initialTab);

  return (
    <div className="hackathon-detail-modal">
      <h2>Hackathon Details</h2>
      <p>Hackathon ID: {hackathonId}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default HackathonDetailModal;
