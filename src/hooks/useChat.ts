'use client';
import { useMutation } from '@tanstack/react-query';
import { useSaveMessage } from './conversation/useConversations';
import { ChatMessage } from '@/types/types';
import { sendMessage } from '@/lib/api';

export const useChat = () => {
  const saveMessage = useSaveMessage();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      messages, 
      pendingMessageId 
    }: { 
      conversationId: string; 
      messages: ChatMessage[]; 
      pendingMessageId: string;
    }) => {
      try {
        const aiResponse = await sendMessage(messages);
        
        const assistantMessage: ChatMessage = {
          id: pendingMessageId,
          sender: 'ai',
          content: aiResponse,
          created_at: new Date().toISOString(),
          userId: messages[0]?.userId || 'placeholder-user-id',
          conversationId,
        };

        // TODO: Remove local storage call when database is integrated
        await saveMessage.mutateAsync(assistantMessage);
        
        return assistantMessage;
      } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage: ChatMessage = {
          id: pendingMessageId,
          sender: 'ai',
          content: 'Sorry, I encountered an error. Please make sure your API key is set correctly in the environment variables.',
          created_at: new Date().toISOString(),
          userId: messages[0]?.userId || 'placeholder-user-id',
          conversationId,
        };
        
        // TODO: Remove local storage call when database is integrated
        await saveMessage.mutateAsync(errorMessage);
        throw error;
      }
    },
  });
};