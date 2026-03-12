import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import axios from 'axios'

// 用户数据接口
export interface UserInfo {
  id: number
  email: string
  username?: string
  full_name?: string
  avatar?: string
  bio?: string
  skills?: string
  interests?: string
  personality?: string
  github_url?: string
  website?: string
  is_superuser?: boolean
  notification_settings?: {
    activity_reminder: boolean
    new_hackathon_push: boolean
    system_announcement: boolean
    general_notification: boolean
  }
}

// Store 状态接口
interface UserState {
  // 数据
  userInfo: UserInfo | null
  isAuthenticated: boolean
  
  // 加载状态
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchUser: () => Promise<void>
  setUser: (user: UserInfo | null) => void
  updateUser: (updates: Partial<UserInfo>) => void
  clearUser: () => void
  logout: () => void
}

/**
 * User Store - 全局用户状态管理
 * 
 * 功能：
 * - 自动持久化到 localStorage
 * - fetchUser 方法调用 /users/me 获取用户信息
 * - Navbar 和路由守卫消费此状态
 */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      userInfo: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * 获取当前用户信息
       * 调用 /api/v1/users/me 接口
       */
      fetchUser: async () => {
        // 避免重复请求
        if (get().isLoading) return

        set({ isLoading: true, error: null })

        try {
          const response = await axios.get('/api/v1/users/me', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })

          const userData: UserInfo = response.data

          set({
            userInfo: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (err: any) {
          console.error('Fetch user error:', err)
          
          // 401 表示未登录或 token 过期
          if (err.response?.status === 401) {
            localStorage.removeItem('token')
            set({
              userInfo: null,
              isAuthenticated: false,
              isLoading: false,
              error: '登录已过期，请重新登录'
            })
          } else {
            set({
              isLoading: false,
              error: err.response?.data?.detail || '获取用户信息失败'
            })
          }
        }
      },

      /**
       * 直接设置用户信息
       */
      setUser: (user: UserInfo | null) => {
        set({
          userInfo: user,
          isAuthenticated: !!user,
          error: null
        })
      },

      /**
       * 更新用户信息（局部更新）
       */
      updateUser: (updates: Partial<UserInfo>) => {
        const currentUser = get().userInfo
        if (!currentUser) return

        set({
          userInfo: { ...currentUser, ...updates }
        })
      },

      /**
       * 清除用户信息（保留在持久化存储中）
       */
      clearUser: () => {
        set({
          userInfo: null,
          isAuthenticated: false,
          error: null
        })
      },

      /**
       * 登出操作
       * 清除 token 和用户信息
       */
      logout: () => {
        localStorage.removeItem('token')
        set({
          userInfo: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      }
    }),
    {
      name: 'user-storage', // localStorage 键名
      storage: createJSONStorage(() => localStorage),
      // 只持久化 userInfo 和 isAuthenticated
      partialize: (state) => ({
        userInfo: state.userInfo,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// 导出便捷 Hook
export const useUser = () => useUserStore((state) => state.userInfo)
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated)
export const useUserLoading = () => useUserStore((state) => state.isLoading)

// 路由守卫 Hook
export const useAuthGuard = () => {
  const { isAuthenticated, userInfo, fetchUser } = useUserStore()
  
  return {
    isAuthenticated,
    userInfo,
    fetchUser,
    // 检查是否已登录，未登录则尝试获取
    checkAuth: async () => {
      if (!isAuthenticated) {
        await fetchUser()
      }
      return useUserStore.getState().isAuthenticated
    }
  }
}
