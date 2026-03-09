import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import axios from 'axios';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    markAllAsRead();
  }, []);

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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div 
      className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border-base rounded-[16px] shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-base/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">通知</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-white bg-brand px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-ink/5 text-ink-dim hover:text-ink transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-ink-dim text-sm">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            加载中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-ink-dim text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-border-base/30">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-border-base/50 bg-ink/5">
          <button
            onClick={() => {
              markAllAsRead();
              onClose();
            }}
            className="w-full text-center text-xs text-brand hover:text-brand/80 transition-colors py-1"
          >
            标记全部已读
          </button>
        </div>
      )}
    </div>
  );
}
