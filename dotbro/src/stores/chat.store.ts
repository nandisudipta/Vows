import { create } from 'zustand';
import type { Conversation, Message } from '../types/models';
import { ConversationsService } from '../services/conversations.service';
import { MessagesService } from '../services/messages.service';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  loadConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (
    conversationId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
  ) => Promise<Message>;
  setStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,

  loadConversations: async () => {
    try {
      const conversations = await ConversationsService.list();
      set({ conversations });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setActiveConversation: async (id) => {
    set({ activeConversationId: id, messages: [], isLoading: !!id });
    if (id) {
      try {
        const messages = await MessagesService.list(id);
        set({ messages, isLoading: false });
      } catch (e) {
        set({ error: String(e), isLoading: false });
      }
    }
  },

  createConversation: async (title) => {
    const conv = await ConversationsService.create({
      title: title || 'New Chat',
    });
    set((state) => ({ conversations: [conv, ...state.conversations] }));
    return conv;
  },

  renameConversation: async (id, title) => {
    await ConversationsService.rename(id, title);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c,
      ),
    }));
  },

  deleteConversation: async (id) => {
    await ConversationsService.delete(id);
    const { activeConversationId } = get();
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        activeConversationId === id ? null : activeConversationId,
      messages: activeConversationId === id ? [] : state.messages,
    }));
  },

  addMessage: async (conversationId, role, content) => {
    const msg = await MessagesService.create({
      conversation_id: conversationId,
      role,
      content,
    });
    set((state) => ({ messages: [...state.messages, msg] }));
    return msg;
  },

  setStreaming: (streaming) =>
    set({ isStreaming: streaming, streamingContent: streaming ? '' : '' }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  setError: (error) => set({ error }),
}));
