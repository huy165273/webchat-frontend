import { create } from 'zustand';

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

export type Conversation = {
  id: number;
  title: string;
  createdAt: string;
};

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Message[];
  isStreaming: boolean;
  pendingMessage: string | null;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: number | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setPendingMessage: (msg: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  pendingMessage: null,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content) => set((state) => {
    const newMessages = [...state.messages];
    if (newMessages.length > 0) {
      newMessages[newMessages.length - 1].content += content;
    }
    return { messages: newMessages };
  }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setPendingMessage: (pendingMessage) => set({ pendingMessage }),
}));
