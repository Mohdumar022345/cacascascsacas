import { Conversation } from "@/types/types";
import { prisma } from "../prisma";

export class ConversationService {
  static async createConversation(userId: string, title: string): Promise<Conversation> {
    const newConversation = await prisma.conversation.create({
      data: {
        userId: userId,
        title: title || 'New Conversation'
      }
    });

    return {
      id: newConversation.id,
      userId: newConversation.userId,
      title: newConversation.title,
      created_at: newConversation.created_at.toISOString(),
    } as Conversation; // Cast to your Conversation type
  }

  static async getUserConversations(userId: string): Promise<Conversation[]> {
    const conversations = await prisma.conversation.findMany({
      where: { userId: userId },
      orderBy: { created_at: 'desc' }
    });

    return conversations.map(conv => ({
      id: conv.id,
      userId: conv.userId,
      title: conv.title,
      created_at: conv.created_at.toISOString(),
    })) as Conversation[]; // Cast to your Conversation[] type
  }

  static async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId: userId
      }
    });

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      created_at: conversation.created_at.toISOString(),
    } as Conversation; // Cast to your Conversation type
  }

  static async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title }
    });
  }

  static async deleteConversation(conversationId: string): Promise<void> {
    await prisma.conversation.delete({
      where: { id: conversationId }
    });
  }
}
