import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBadgeProps {
  unreadCount: number;
  onBellClick: () => void;
}

export default function NotificationBadge({ unreadCount, onBellClick }: NotificationBadgeProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (unreadCount > 0 && !showDropdown) {
      // Trigger shake animation
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [unreadCount, showDropdown]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 }
      });
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.post(`/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.post('/api/v1/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => {
          onBellClick();
          setShowDropdown(!showDropdown);
          if (!showDropdown && unreadCount > 0) {
            fetchNotifications();
            markAllAsRead();
          }
        }}
        className={`p-1.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 ${
          shake ? 'animate-shake' : ''
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
        
        {/* Red Dot */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-3 w-80 bg-surface border border-border-base rounded-xl shadow-xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="px-4 py-3 border-b border-border-base flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">通知</h3>
            <span className="text-xs text-ink-dim bg-ink/10 px-2 py-0.5 rounded-full">
              {unreadCount}条未读
            </span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-ink-dim text-sm">
                <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                加载中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-ink-dim text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                暂无通知
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`px-4 py-3 hover:bg-ink/5 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-brand/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        notification.type === 'error' ? 'bg-red-500' :
                        !notification.is_read ? 'bg-brand' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.is_read ? 'text-ink' : 'text-ink-dim'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-ink-dim mt-0.5 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-[10px] text-ink-dim/60 mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-1.5 h-1.5 bg-brand rounded-full mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border-base bg-ink/2">
              <button
                onClick={() => {
                  markAllAsRead();
                  setShowDropdown(false);
                }}
                className="w-full text-center text-xs text-brand hover:text-brand/80 transition-colors"
              >
                标记全部已读
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
