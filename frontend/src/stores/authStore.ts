import create from 'zustand';

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const LOCAL_KEY = 'promptspark_auth';

const load = (): { token: string | null; user: UserProfile | null } => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw);
  } catch (err) {
    return { token: null, user: null };
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const initial = load();
  return {
    token: initial.token,
    user: initial.user,
    setAuth: (token, user) => {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ token, user }));
      set({ token, user });
    },
    logout: () => {
      localStorage.removeItem(LOCAL_KEY);
      set({ token: null, user: null });
    }
  };
});
