import { create } from 'zustand';
import type { Memory, CreateMemory, UpdateMemory } from '../types/models';
import { MemoriesService } from '../services/memories.service';

type MemoryCategory =
  | 'note'
  | 'preference'
  | 'knowledge'
  | 'task'
  | 'relationship';

interface MemoryState {
  memories: Memory[];
  activeCategory: MemoryCategory | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  loadMemories: (category?: MemoryCategory | null) => Promise<void>;
  searchMemories: (query: string) => Promise<void>;
  createMemory: (input: CreateMemory) => Promise<Memory>;
  updateMemory: (id: string, input: UpdateMemory) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  setCategory: (category: MemoryCategory | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  activeCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  loadMemories: async (category) => {
    const cat = category !== undefined ? category : get().activeCategory;
    set({ isLoading: true, activeCategory: cat ?? null });
    try {
      const memories = await MemoriesService.list(cat ?? undefined);
      set({ memories, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  searchMemories: async (query) => {
    set({ searchQuery: query, isLoading: true });
    try {
      const memories = query
        ? await MemoriesService.search(query)
        : await MemoriesService.list(get().activeCategory ?? undefined);
      set({ memories, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createMemory: async (input) => {
    const memory = await MemoriesService.create(input);
    set((state) => ({ memories: [memory, ...state.memories] }));
    return memory;
  },

  updateMemory: async (id, input) => {
    const updated = await MemoriesService.update(id, input);
    set((state) => ({
      memories: state.memories.map((m) => (m.id === id ? updated : m)),
    }));
  },

  deleteMemory: async (id) => {
    await MemoriesService.delete(id);
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    }));
  },

  setCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
