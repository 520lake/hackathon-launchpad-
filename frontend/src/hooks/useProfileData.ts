import { useState, useEffect } from "react";
import axios from "axios";
import type { HackathonListItem } from "@/types/hackathon";

export interface Enrollment {
  id: number;
  hackathon_id: number;
  hackathon?: {
    id: number;
    title: string;
    description?: string;
    tags?: string;
    status: string;
    start_date: string;
    end_date: string;
    cover_image?: string;
    province?: string;
    city?: string;
    district?: string;
    created_by?: number;
    hosts?: { id: number; name: string; logo_url?: string | null }[];
  };
  created_at: string;
}

export function useProfileData(isLoggedIn: boolean) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [organizedHackathons, setOrganizedHackathons] = useState<
    HackathonListItem[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchMyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const enrollRes = await axios.get("/api/v1/enrollments/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(enrollRes.data || []);

      try {
        const hackRes = await axios.get("/api/v1/hackathons/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrganizedHackathons(hackRes.data || []);
      } catch (e) {
        console.log("No organized hackathons");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMyData();
    }
  }, [isLoggedIn]);

  return { enrollments, organizedHackathons, loading, refetch: fetchMyData };
}
