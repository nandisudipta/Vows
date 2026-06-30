import { invoke } from '@tauri-apps/api/core';
import type { Message, CreateMessage } from '../types/models';

export const MessagesService = {
  list: (conversationId: string) =>
    invoke<Message[]>('list_messages', { conversationId }),
  create: (input: CreateMessage) =>
    invoke<Message>('create_message', { input }),
  search: (query: string) =>
    invoke<Message[]>('search_messages', { query }),
};
