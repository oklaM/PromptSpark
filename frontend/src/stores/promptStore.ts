import { create } from 'zustand';

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  isPublic: boolean;
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PromptStore {
  prompts: Prompt[];
  currentPrompt: Prompt | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPrompts: (prompts: Prompt[]) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (id: string, prompt: Partial<Prompt>) => void;
  removePrompt: (id: string) => void;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePromptStore = create<PromptStore>((set) => ({
  prompts: [],
  currentPrompt: null,
  isLoading: false,
  error: null,

  setPrompts: (prompts) => set({ prompts }),
  addPrompt: (prompt) => set((state) => ({ prompts: [prompt, ...state.prompts] })),
  updatePrompt: (id, updates) =>
    set((state) => ({
      prompts: state.prompts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPrompt: state.currentPrompt?.id === id ? { ...state.currentPrompt, ...updates } : state.currentPrompt,
    })),
  removePrompt: (id) =>
    set((state) => ({
      prompts: state.prompts.filter((p) => p.id !== id),
      currentPrompt: state.currentPrompt?.id === id ? null : state.currentPrompt,
    })),
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
