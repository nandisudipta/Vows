export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  category: 'note' | 'preference' | 'knowledge' | 'task' | 'relationship';
  title: string;
  content: string;
  tags: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface OllamaStatus {
  available: boolean;
  url: string;
  version?: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

// Input types
export interface CreateConversation {
  title: string;
}

export interface CreateMessage {
  conversation_id: string;
  role: string;
  content: string;
  tool_calls?: string;
}

export interface CreateContact {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  notes: string;
}

export type UpdateContact = CreateContact;

export interface CreateMemory {
  category: string;
  title: string;
  content: string;
  tags: string;
  source: string;
}

export type UpdateMemory = CreateMemory;
