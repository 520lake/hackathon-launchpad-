import { useState, useEffect } from 'react';
import axios from 'axios';

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
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
  is_verified: boolean;
  skills?: string;
  interests?: string;
  resume?: string;
}

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHackathonSelect: (id: number) => void;
  onVerifyClick: () => void;
}

export default function UserDashboardModal({ isOpen, onClose, onHackathonSelect, onVerifyClick }: UserDashboardModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [myCreated, setMyCreated] = useState<Hackathon[]>([]);
  const [myJoined, setMyJoined] = useState<EnrollmentWithHackathon[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'profile'>('created');
  
  // Profile form
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [resume, setResume] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyData();
    }
  }, [isOpen]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      // 0. 获取当前用户信息
      const token = localStorage.getItem('token');
      if (token) {
        const resUser = await axios.get('/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUser(resUser.data);
        // Init form data
        setSkills(resUser.data.skills || '');
        setInterests(resUser.data.interests || '');
        setResume(resUser.data.resume || '');
      }

      // 1. 获取我创建的活动
      const resCreated = await axios.get('/api/v1/hackathons/my');
      setMyCreated(resCreated.data);
      
      // 2. 获取我参与的活动
      const resJoined = await axios.get('/api/v1/enrollments/me');
      setMyJoined(resJoined.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    onVerifyClick();
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/v1/upload/file', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            setResume(res.data.url);
        } catch (err) {
            console.error(err);
            alert('Resume upload failed');
        }
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
        const token = localStorage.getItem('token');
        await axios.put('/api/v1/users/me', {
            skills,
            interests,
            resume
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert('个人资料保存成功！');
        fetchMyData();
    } catch (e) {
        console.error(e);
        alert('保存失败');
    } finally {
        setSavingProfile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-0 relative transform transition-all max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">个人中心</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* User Info & Verification */}
        {user && (
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{user.email}</div>
                    <div className="text-sm text-gray-500">ID: {user.id}</div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.is_verified ? '已实名认证' : '未认证'}
                    </span>
                    {!user.is_verified && (
                        <button 
                            onClick={handleVerify}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                        >
                            立即认证
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('created')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'created' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            我发起的活动
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'joined' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            我参与的活动
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'profile' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            个人资料 & 技能
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
          {activeTab === 'profile' && (
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">技能标签</label>
                    <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="例如: React, Python, UI/UX (用逗号分隔)"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">用于智能组队匹配</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">兴趣领域</label>
                    <input
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="例如: Web3, AI, DeFi (用逗号分隔)"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">简历上传</label>
                    <div className="flex gap-2 items-center">
                        <input type="file" onChange={handleResumeUpload} className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                        "/>
                    </div>
                    {resume && (
                        <div className="mt-2 text-sm text-blue-600">
                            <a href={resume} target="_blank" rel="noopener noreferrer">查看已上传简历</a>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                    {savingProfile ? '保存中...' : '保存资料'}
                </button>
            </div>
          )}

              {activeTab === 'created' && (
                <div className="space-y-4">
                  {myCreated.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">你还没有发起过任何活动。</p>
                  ) : (
                    myCreated.map(h => (
                      <div 
                        key={h.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex justify-between items-center cursor-pointer"
                        onClick={() => {
                          onHackathonSelect(h.id);
                          onClose();
                        }}
                      >
                        <div>
                          <h3 className="font-bold text-lg">{h.title}</h3>
                          <p className="text-sm text-gray-500">{new Date(h.start_date).toLocaleDateString()}</p>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">{h.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'joined' && (
                <div className="space-y-4">
                  {myJoined.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">你还没有参与任何活动。</p>
                  ) : (
                    myJoined.map(e => (
                      <div 
                        key={e.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex justify-between items-center cursor-pointer"
                        onClick={() => {
                          onHackathonSelect(e.hackathon.id);
                          onClose();
                        }}
                      >
                        <div>
                          <h3 className="font-bold text-lg">{e.hackathon.title}</h3>
                          <p className="text-sm text-gray-500">报名时间: {new Date(e.joined_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          e.status === 'approved' ? 'bg-green-100 text-green-700' :
                          e.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {e.status === 'pending' ? '审核中' : e.status === 'approved' ? '已通过' : '已拒绝'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
