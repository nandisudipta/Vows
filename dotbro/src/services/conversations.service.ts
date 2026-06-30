import { invoke } from '@tauri-apps/api/core';
import type { Conversation, CreateConversation } from '../types/models';

export const ConversationsService = {
  list: () => invoke<Conversation[]>('list_conversations'),
  get: (id: string) => invoke<Conversation>('get_conversation', { id }),
  create: (input: CreateConversation) => invoke<Conversation>('create_conversation', { input }),
  rename: (id: string, title: string) => invoke<Conversation>('rename_conversation', { id, title }),
  delete: (id: string) => invoke<void>('delete_conversation', { id }),
};
