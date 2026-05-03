import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'

export interface User {
  id: string
  username: string
  name: string
  role: string
  department: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function clearToken() {
    token.value = null
    localStorage.removeItem('token')
  }

  function setUser(newUser: User) {
    user.value = newUser
  }

  function clearUser() {
    user.value = null
  }

  async function login(username: string, password: string): Promise<void> {
    const response = await authApi.login(username, password)
    setToken(response.token)
    setUser(response.user)
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } finally {
      clearToken()
      clearUser()
    }
  }

  async function getCurrentUser(): Promise<User> {
    const response = await authApi.getCurrentUser()
    setUser(response)
    return response
  }

  function initializeFromStorage() {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    clearToken,
    setUser,
    clearUser,
    login,
    logout,
    getCurrentUser,
    initializeFromStorage
  }
})
