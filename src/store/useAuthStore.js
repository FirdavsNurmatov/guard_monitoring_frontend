import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create()(
  persist(
    (set) => ({
      user: {},
      token: null,
      setUser: (user) => set({ user: user }),
      setToken: (token) => set({ token }),
      resetAuth: () => set({
        user: {},
        token: null,
      }),
    }),
    {
      name: "auth",
    }
  )
);
