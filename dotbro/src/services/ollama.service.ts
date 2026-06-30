export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export const OllamaService = {
  async *streamChat(
    url: string,
    model: string,
    messages: OllamaChatMessage[],
  ): AsyncGenerator<string> {
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('No response body from Ollama');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line) as { message?: { content?: string } };
          if (data.message?.content) {
            yield data.message.content;
          }
        } catch {
          // Skip malformed JSON lines during streaming
        }
      }
    }
  },
};
