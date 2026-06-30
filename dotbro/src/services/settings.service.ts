import { invoke } from '@tauri-apps/api/core';
import type { Setting } from '../types/models';

export const SettingsService = {
  get: (key: string) => invoke<Setting>('get_setting', { key }),
  getAll: () => invoke<Setting[]>('get_all_settings'),
  set: (key: string, value: string) => invoke<Setting>('set_setting', { key, value }),
};
