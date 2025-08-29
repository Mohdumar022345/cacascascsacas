'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { createDbConversation, saveDbMessage } from '@/lib/db-api';
import { ChatMessage, Conversation } from '@/types/types';

const CONVERSATIONS_KEY = 'conversations';
const CONVERSATION_KEY = 'conversation';
const MESSAGES_KEY_PREFIX = 'conversation_messages_';

// Local storage helpers for conversations
// TODO: Remove these when database is integrated
const getStoredConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CONVERSATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const storeConversations = (conversations: Conversation[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
};

// Local storage helpers for messages
// TODO: Remove these when database is integrated
const getStoredMessages = (conversationId: string): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MESSAGES_KEY_PREFIX + conversationId);
  return stored ? JSON.parse(stored) : [];
};

const storeMessages = (conversationId: string, messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MESSAGES_KEY_PREFIX + conversationId, JSON.stringify(messages));
};

export const useConversations = () => {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: getStoredConversations, // TODO: Replace with getDbConversations when database is integrated
    initialData: [],
  });
};

export const useConversation = (id: string | null) => {
  return useQuery({
    queryKey: [CONVERSATION_KEY, id],
    queryFn: () => {
      if (!id) return null;
      // TODO: Replace with getDbConversation when database is integrated
      const conversations = getStoredConversations();
      return conversations.find(conv => conv.id === id) || null;
    },
    enabled: !!id,
  });
};

export const useMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => {
      if (!conversationId) return [];
      // TODO: Replace with getDbMessages when database is integrated
      return getStoredMessages(conversationId);
    },
    enabled: !!conversationId,
    initialData: [],
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      firstMessage 
    }: { 
      userId: string; 
      firstMessage: string; 
    }): Promise<{ conversationId: string; conversation: Conversation }> => {
      const conversationId = uuidv4();
      const now = new Date().toISOString();
      
      const userMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'user',
        content: firstMessage,
        created_at: now,
        userId,
        conversationId,
      };

      const newConversation: Conversation = {
        id: conversationId,
        userId,
        title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
        created_at: now,
      };

      // TODO: Remove local storage logic when database is integrated
      // Update conversations list in local storage
      const conversations = getStoredConversations();
      const updatedConversations = [newConversation, ...conversations];
      storeConversations(updatedConversations);

      // Store initial user message in local storage
      storeMessages(conversationId, [userMessage]);

      // Update cache immediately
      queryClient.setQueryData([CONVERSATIONS_KEY], updatedConversations);
      queryClient.setQueryData([CONVERSATION_KEY, conversationId], newConversation);
      queryClient.setQueryData(['messages', conversationId], [userMessage]);

      // Placeholder database calls - will be implemented when database is integrated
      try {
        await createDbConversation(newConversation);
        await saveDbMessage(userMessage);
      } catch (error) {
        console.log('Database not yet integrated:', error);
      }

      return { conversationId, conversation: newConversation };
    },
  });
};

export const useSaveMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: ChatMessage) => {
      const { conversationId } = message;
      
      // TODO: Remove local storage logic when database is integrated
      // Get existing messages from local storage
      const existingMessages = getStoredMessages(conversationId);
      const existingMessageIndex = existingMessages.findIndex(msg => msg.id === message.id);
      
      let updatedMessages;
      if (existingMessageIndex !== -1) {
        // Update existing message
        updatedMessages = [...existingMessages];
        updatedMessages[existingMessageIndex] = message;
      } else {
        // Add new message
        updatedMessages = [...existingMessages, message];
      }

      // Store updated messages in local storage
      storeMessages(conversationId, updatedMessages);

      // Update cache immediately
      queryClient.setQueryData(['messages', conversationId], updatedMessages);

      // Placeholder database call - will be implemented when database is integrated
      try {
        await saveDbMessage(message);
      } catch (error) {
        console.log('Database not yet integrated:', error);
      }

      return message;
    },
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      // TODO: Remove local storage logic when database is integrated
      const conversations = getStoredConversations();
      const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
      
      if (conversationIndex === -1) {
        throw new Error('Conversation not found');
      }

      const updatedConversation = {
        ...conversations[conversationIndex],
        updated_at: new Date().toISOString(),
      };

      conversations[conversationIndex] = updatedConversation;
      storeConversations(conversations);

      // Update cache immediately
      queryClient.setQueryData([CONVERSATIONS_KEY], conversations);
      queryClient.setQueryData([CONVERSATION_KEY, conversationId], updatedConversation);

      return updatedConversation;
    },
  });
};