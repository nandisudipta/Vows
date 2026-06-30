import { create } from 'zustand';
import type { OllamaStatus, OllamaModel } from '../types/models';
import { SettingsService } from '../services/settings.service';
import { AiService } from '../services/ai.service';

interface SettingsState {
  settings: Record<string, string>;
  ollamaStatus: OllamaStatus | null;
  availableModels: OllamaModel[];
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
  loadModels: () => Promise<void>;

  // Getters
  getOllamaUrl: () => string;
  getOllamaModel: () => string;
  getTheme: () => string;
  getFontSize: () => string;
  getSenderName: () => string;
  getEmergencyPsk: () => string;
  getEmergencyPort: () => string;
  getEmergencyPeers: () => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  ollamaStatus: null,
  availableModels: [],
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const allSettings = await SettingsService.getAll();
      const settings: Record<string, string> = {};
      for (const s of allSettings) {
        settings[s.key] = s.value;
      }
      set({ settings, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  updateSetting: async (key, value) => {
    try {
      await SettingsService.set(key, value);
      set((state) => ({
        settings: { ...state.settings, [key]: value },
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  checkOllamaStatus: async () => {
    try {
      const status = await AiService.checkStatus();
      set({ ollamaStatus: status });
    } catch (e) {
      set({
        ollamaStatus: {
          available: false,
          url: get().getOllamaUrl(),
          version: undefined,
        },
      });
    }
  },

  loadModels: async () => {
    try {
      const models = await AiService.listModels();
      set({ availableModels: models });
    } catch {
      set({ availableModels: [] });
    }
  },

  getOllamaUrl: () => get().settings['ollama_url'] || 'http://localhost:11434',
  getOllamaModel: () => get().settings['ollama_model'] || 'llama3.2',
  getTheme: () => get().settings['theme'] || 'dark',
  getFontSize: () => get().settings['font_size'] || '14',
  getSenderName: () => get().settings['sender_name'] || 'Ron',
  getEmergencyPsk: () => get().settings['emergency_psk'] || 'dotbro_default_secure_passphrase_2026',
  getEmergencyPort: () => get().settings['emergency_port'] || '8765',
  getEmergencyPeers: () => get().settings['emergency_peers'] || '127.0.0.1',
}));
