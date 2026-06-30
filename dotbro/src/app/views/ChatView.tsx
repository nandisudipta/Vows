import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../stores/chat.store';
import { useSettingsStore } from '../../stores/settings.store';
import { OllamaService } from '../../services/ollama.service';
import { Button } from '../../components/ui/Button';
import { TextArea } from '../../components/ui/TextArea';
import { Plus, Trash, Send, MessageCircle, Brain } from '../../components/ui/Icons';
import { EmergencyService } from '../../services/emergency.service';
import '../../styles/views/chat.css';

export const ChatView: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    loadConversations,
    setActiveConversation,
    createConversation,
    deleteConversation,
    addMessage,
    setStreaming,
    appendStreamingContent,
    setStreamingContent,
  } = useChatStore();

  const { getOllamaUrl, getOllamaModel, checkOllamaStatus, ollamaStatus, getEmergencyPeers } = useSettingsStore();

  const [input, setInput] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    checkOllamaStatus();
  }, [loadConversations, checkOllamaStatus]);

  useEffect(() => {
    // Scroll to bottom on new message or during streaming
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');

    let conversationId = activeConversationId;
    let isNewConv = false;

    // Create a new conversation if none is active
    if (!conversationId) {
      // Create with temporary title
      const newConv = await createConversation(userText.substring(0, 30) + '...');
      conversationId = newConv.id;
      isNewConv = true;
    }

    if (!conversationId) return;

    // Set conversation active if it's a new one
    if (isNewConv) {
      await setActiveConversation(conversationId);
    }

    // Save user message to database
    await addMessage(conversationId, 'user', userText);

    if (isEmergencyMode) {
      // P2P Secure Line Transmission
      setStreaming(true);
      setStreamingContent('Initiating secure point-to-point packet handshake...');
      
      const peersRaw = getEmergencyPeers();
      const peers = peersRaw.split(',').map(p => p.trim()).filter(Boolean);
      
      if (peers.length === 0) {
        setStreaming(false);
        setStreamingContent('Error: No peer IP addresses configured in Settings.');
        return;
      }
      
      let transmissionLogs = [];
      
      for (const peer of peers) {
        setStreamingContent(`Transmitting encrypted payload to peer ${peer}...`);
        try {
          await EmergencyService.send(peer, userText, conversationId);
          transmissionLogs.push(`✔ Transmitted to ${peer} successfully.`);
        } catch (err) {
          transmissionLogs.push(`❌ Failed sending to ${peer}: ${(err as Error).message}`);
        }
      }
      
      setStreaming(false);
      // Save transmission log message to thread
      const finalSummary = `[SECURE DIRECT BROADCAST SENT]\n\n${transmissionLogs.join('\n')}`;
      await addMessage(conversationId, 'assistant', finalSummary);
      await loadConversations();
      return;
    }

    // Standard local Ollama model flow
    // Prepare message history for Ollama context
    // Fetch active conversation messages state
    const history = useChatStore.getState().messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Start streaming from local Ollama
    setStreaming(true);
    setStreamingContent('');

    const url = getOllamaUrl();
    const model = getOllamaModel();

    try {
      const generator = OllamaService.streamChat(url, model, history);
      let fullAssistantReply = '';

      for await (const chunk of generator) {
        appendStreamingContent(chunk);
        fullAssistantReply += chunk;
      }

      // Stream completed, save assistant message to database
      setStreaming(false);
      await addMessage(conversationId, 'assistant', fullAssistantReply);

      // Reload conversations to update title and times
      await loadConversations();
    } catch (err) {
      setStreaming(false);
      setStreamingContent(`Error communicating with Ollama: ${(err as Error).message}. Ensure Ollama is running at ${url} and the model '${model}' is pulled.`);
    }
  };

  const handleNewChat = async () => {
    const newConv = await createConversation('New Chat');
    await setActiveConversation(newConv.id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
      await loadConversations();
    }
  };

  return (
    <div className="chat-view">
      <div className="chat-sidebar">
        <div className="chat-sidebar__action">
          <Button variant="primary" size="md" fullWidth icon={<Plus size={16} />} onClick={handleNewChat}>
            New Chat
          </Button>
        </div>
        <div className="chat-sidebar__list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`chat-item ${activeConversationId === conv.id ? 'chat-item--active' : ''}`}
              onClick={() => setActiveConversation(conv.id)}
            >
              <div className="chat-item__info">
                <span className="chat-item__title">{conv.title}</span>
                <span className="chat-item__date">{new Date(conv.updated_at).toLocaleDateString()}</span>
              </div>
              <button className="chat-item__delete-btn" onClick={(e) => handleDelete(e, conv.id)}>
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-pane">
        {activeConversationId ? (
          <>
            <div className="chat-header">
              <span className="chat-header__title">
                {conversations.find((c) => c.id === activeConversationId)?.title || 'Chat'}
              </span>
              <div className="ollama-status-indicator">
                <span className={`status-dot ${ollamaStatus?.available ? 'status-dot--success' : 'status-dot--error'}`} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {ollamaStatus?.available ? 'Ollama Connected' : 'Ollama Offline'}
                </span>
              </div>
            </div>

            <div className="chat-messages">
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>Loading messages...</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${
                      msg.role === 'user' ? 'message-bubble--user' : 'message-bubble--assistant'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <span className="message-bubble__meta">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              {isStreaming && (
                <div className="message-bubble message-bubble--assistant">
                  <div>
                    {streamingContent}
                    <span className="cursor-blink">▍</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-bar" style={isEmergencyMode ? { borderTop: '1px dashed var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.02)' } : {}}>
              <div className="chat-input-row">
                <TextArea
                  placeholder={isEmergencyMode ? "[SECURE LINE] Send encrypted payload to peers..." : "Ask Ronvey..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onEnterPress={handleSend}
                  rows={2}
                />
                <Button 
                  variant={isEmergencyMode ? "danger" : "primary"} 
                  size="md" 
                  onClick={handleSend} 
                  disabled={isStreaming || !input.trim()}
                >
                  <Send size={16} />
                </Button>
              </div>
              <div className="chat-input-footer">
                <span className="chat-model-info">
                  {isEmergencyMode ? (
                    <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>⚡ EMERGENCY DIRECT CHANNEL ACTIVE</span>
                  ) : (
                    `Model: ${getOllamaModel()}`
                  )}
                </span>
                
                {/* Secure Line Toggle */}
                <button
                  onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                  className={`theme-btn`}
                  style={{
                    padding: '2px var(--space-3)',
                    fontSize: '11px',
                    borderColor: isEmergencyMode ? 'var(--error)' : 'var(--border)',
                    color: isEmergencyMode ? 'var(--error)' : 'var(--text-secondary)'
                  }}
                >
                  <Brain size={12} style={{ color: isEmergencyMode ? 'var(--error)' : 'currentColor' }} />
                  {isEmergencyMode ? "Switch to Local AI Chat" : "Activate Emergency Line"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MessageCircle size={48} style={{ margin: '0 auto var(--space-4) auto', display: 'block', color: 'var(--text-tertiary)' }} />
              <h3>Local AI Chat</h3>
              <p style={{ fontSize: '13px', marginTop: 'var(--space-2)' }}>Select or create a conversation to begin local inference.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ChatView;
