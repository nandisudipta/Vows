import { invoke } from '@tauri-apps/api/core';
import type { Contact, CreateContact, UpdateContact } from '../types/models';

export const ContactsService = {
  list: () => invoke<Contact[]>('list_contacts'),
  get: (id: string) => invoke<Contact>('get_contact', { id }),
  create: (input: CreateContact) => invoke<Contact>('create_contact', { input }),
  update: (id: string, input: UpdateContact) => invoke<Contact>('update_contact', { id, input }),
  delete: (id: string) => invoke<void>('delete_contact', { id }),
  search: (query: string) => invoke<Contact[]>('search_contacts', { query }),
};
