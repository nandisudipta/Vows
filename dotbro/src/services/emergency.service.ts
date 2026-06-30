import { invoke } from '@tauri-apps/api/core';
import type { Message } from '../types/models';

export const EmergencyService = {
  send: (peerIp: string, content: string, conversationId: string) =>
    invoke<Message>('send_emergency_message', { peerIp, content, conversationId }),
};
