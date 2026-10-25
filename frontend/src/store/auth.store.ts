import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, AuthUser, LoginDto, AuthTokens } from '@/types'
import { iniciarSesion, cerrarSesion, leerSesion } from '@/lib/cognito'
import { socketManager } from '@/lib/socket'

// Amplify guarda y renueva los tokens por su cuenta. api-client le pide el token vigente
// en cada llamada, asi que tokens aca es solo la copia del momento del login
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginDto) => {
        set({ isLoading: true })
        try {
          const email  = credentials.email.trim().toLowerCase()
          const sesion = await iniciarSesion(email, credentials.password)

          const tokens: AuthTokens = { accessToken: sesion.accessToken, refreshToken: '' }

          const user: AuthUser = {
            id:          sesion.userId,
            email,
            role:        sesion.role,
            isActive:    true,
            createdAt:   new Date().toISOString() as any,
            updatedAt:   new Date().toISOString() as any,
          }

          set({ user, tokens, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        cerrarSesion().catch(() => {})
        socketManager.disconnect()
        set({ user: null, tokens: null, isAuthenticated: false })
      },

      // se usa despues de crear el perfil, para que el token traiga el grupo nuevo
      refreshTokens: async () => {
        try {
          const sesion = await leerSesion(true)
          if (!sesion) return get().logout()

          const user = get().user
          set({
            tokens: { accessToken: sesion.accessToken, refreshToken: '' },
            user:   user ? { ...user, role: sesion.role } : user,
          })
        } catch {
          get().logout()
        }
      },

      setUser: (user: AuthUser) => set({ user }),
    }),
    {
      name: 'ceibbo-auth',
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
