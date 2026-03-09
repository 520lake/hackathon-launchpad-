import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface InvitationCode {
  id: number
  code: string
  is_used: boolean
  used_by_user_id: number | null
  created_at: string
  expires_at: string | null
}

interface User {
  id: number
  email: string
  full_name: string | null
  is_superuser: boolean
  can_create_hackathon: boolean
  is_active: boolean
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'codes' | 'users'>('codes')
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setAuthError('请先登录')
      navigate('/')
      return
    }
    try {
      const res = await axios.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.data.is_superuser) {
        setAuthError('您没有管理员权限')
        navigate('/')
        return
      }
      fetchData()
    } catch (e: any) {
      console.error('Auth check failed:', e)
      setAuthError('验证失败，请重新登录')
      navigate('/')
    }
  }

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setLoading(true)
    try {
      if (activeTab === 'codes') {
        const res = await axios.get('/api/v1/users/invitation-codes', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCodes(res.data)
      } else {
        const res = await axios.get('/api/v1/users/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUsers(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const generateCode = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setGenerating(true)
    try {
      await axios.post('/api/v1/generate-invitation-codes', { count: 1 }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchData()
    } catch (e: any) {
      console.error(e)
      alert('生成失败：' + (e.response?.data?.detail || e.message))
    } finally {
      setGenerating(false)
    }
  }

  const toggleUserPermission = async (userId: number, field: 'is_superuser' | 'can_create_hackathon', currentValue: boolean) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await axios.patch(`/api/v1/users/${userId}`, { [field]: !currentValue }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: !currentValue } : u))
    } catch (e: any) {
      console.error(e)
      alert('操作失败：' + (e.response?.data?.detail || e.message))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← 返回
            </button>
            <h1 className="text-2xl font-bold text-white">管理面板</h1>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'codes' 
                ? 'bg-brand text-black' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            邀请码管理
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-brand text-black' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            用户管理
          </button>
        </div>

        {activeTab === 'codes' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={generateCode}
                disabled={generating}
                className="px-4 py-2 bg-brand text-black font-medium rounded-md hover:bg-white transition-colors disabled:opacity-50"
              >
                {generating ? '生成中...' : '生成新邀请码'}
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">邀请码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {codes.map(code => (
                    <tr key={code.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-gray-400">{code.id}</td>
                      <td className="px-4 py-3 text-sm text-brand font-mono">{code.code}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          code.is_used 
                            ? 'bg-gray-700 text-gray-400' 
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {code.is_used ? '已使用' : '未使用'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(code.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {codes.length === 0 && (
                <div className="p-8 text-center text-gray-500">暂无邀请码</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">邮箱</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">组织者</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">超级管理员</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-400">{user.id}</td>
                    <td className="px-4 py-3 text-sm text-white">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.full_name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        user.is_active 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {user.is_active ? '活跃' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserPermission(user.id, 'can_create_hackathon', user.can_create_hackathon)}
                        className={`px-2 py-1 text-xs rounded ${
                          user.can_create_hackathon 
                            ? 'bg-brand/20 text-brand' 
                            : 'bg-gray-700 text-gray-500'
                        }`}
                      >
                        {user.can_create_hackathon ? '✓ 是' : '✗ 否'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserPermission(user.id, 'is_superuser', user.is_superuser)}
                        className={`px-2 py-1 text-xs rounded ${
                          user.is_superuser 
                            ? 'bg-purple-900/30 text-purple-400' 
                            : 'bg-gray-700 text-gray-500'
                        }`}
                      >
                        {user.is_superuser ? '✓ 是' : '✗ 否'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
