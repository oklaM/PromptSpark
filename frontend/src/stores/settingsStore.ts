import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AiProvider = 'auto' | 'openai' | 'gemini' | 'deepseek' | 'custom';

export interface ModelConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

interface SettingsState {
  config: ModelConfig;
  setConfig: (config: Partial<ModelConfig>) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'auto',
  apiKey: '',
  baseUrl: '',
  model: '',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setConfig: (newConfig) => set((state) => ({ config: { ...state.config, ...newConfig } })),
      reset: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: 'promptspark-settings',
    }
  )
);
