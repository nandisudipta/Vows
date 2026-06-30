import { invoke } from '@tauri-apps/api/core';
import type { OllamaStatus, OllamaModel } from '../types/models';

export const AiService = {
  checkStatus: () => invoke<OllamaStatus>('check_ollama_status'),
  listModels: () => invoke<OllamaModel[]>('list_models'),
};
