import { invoke } from '@tauri-apps/api/core';
import type { Memory, CreateMemory, UpdateMemory } from '../types/models';

export const MemoriesService = {
  list: (category?: string) =>
    invoke<Memory[]>('list_memories', { category: category ?? null }),
  get: (id: string) => invoke<Memory>('get_memory', { id }),
  create: (input: CreateMemory) => invoke<Memory>('create_memory', { input }),
  update: (id: string, input: UpdateMemory) => invoke<Memory>('update_memory', { id, input }),
  delete: (id: string) => invoke<void>('delete_memory', { id }),
  search: (query: string) => invoke<Memory[]>('search_memories', { query }),
};
