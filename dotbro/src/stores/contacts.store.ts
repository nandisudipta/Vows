import { create } from 'zustand';
import type { Contact, CreateContact, UpdateContact } from '../types/models';
import { ContactsService } from '../services/contacts.service';

interface ContactsState {
  contacts: Contact[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  loadContacts: () => Promise<void>;
  searchContacts: (query: string) => Promise<void>;
  createContact: (input: CreateContact) => Promise<Contact>;
  updateContact: (id: string, input: UpdateContact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  searchQuery: '',
  isLoading: false,
  error: null,

  loadContacts: async () => {
    set({ isLoading: true });
    try {
      const contacts = await ContactsService.list();
      set({ contacts, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  searchContacts: async (query) => {
    set({ searchQuery: query, isLoading: true });
    try {
      const contacts = query
        ? await ContactsService.search(query)
        : await ContactsService.list();
      set({ contacts, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createContact: async (input) => {
    const contact = await ContactsService.create(input);
    set((state) => ({ contacts: [...state.contacts, contact] }));
    return contact;
  },

  updateContact: async (id, input) => {
    const updated = await ContactsService.update(id, input);
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteContact: async (id) => {
    await ContactsService.delete(id);
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
