import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatConversations, chatMessages, user, orders } from '@/lib/schema';
import { eq, and, or, desc, ne, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';

// GET - Get all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/chat/conversations called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);
    if (!session?.user?.id) {
      console.log('No session found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get conversations where user is either customer or driver (simplified query first)
    console.log('Querying conversations for user:', userId);
    const conversations = await db
      .select({
        id: chatConversations.id,
        customerId: chatConversations.customerId,
        driverId: chatConversations.driverId,
        orderId: chatConversations.orderId,
        agoraChannelName: chatConversations.agoraChannelName,
        isActive: chatConversations.isActive,
        lastMessageAt: chatConversations.lastMessageAt,
        createdAt: chatConversations.createdAt,
      })
      .from(chatConversations)
      .where(
        and(
          or(
            eq(chatConversations.customerId, userId),
            eq(chatConversations.driverId, userId)
          ),
          eq(chatConversations.isActive, true)
        )
      )
      .orderBy(desc(chatConversations.createdAt));
    
    console.log('Found conversations:', conversations.length);

    // Get the last message for each conversation (simplified)
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        try {
          console.log('Processing conversation:', conversation.id);
          
          // Get last message
          const lastMessage = await db
            .select({
              id: chatMessages.id,
              message: chatMessages.message,
              senderId: chatMessages.senderId,
              createdAt: chatMessages.createdAt,
            })
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, conversation.id))
            .orderBy(desc(chatMessages.createdAt))
            .limit(1);

          // Get unread message count (messages not sent by current user and not read)
          const unreadResult = await db
            .select({
              count: count(chatMessages.id),
            })
            .from(chatMessages)
            .where(
              and(
                eq(chatMessages.conversationId, conversation.id),
                ne(chatMessages.senderId, userId), // Not sent by current user
                eq(chatMessages.isRead, false) // Not read yet
              )
            );
          
          const unreadCount = unreadResult[0]?.count || 0;

          // Get user names and order number
          let customerName = null;
          let driverName = null;
          let orderNumber = null;
          
          if (conversation.customerId) {
            try {
              const customer = await db
                .select({ name: user.name })
                .from(user)
                .where(eq(user.id, conversation.customerId))
                .limit(1);
              customerName = customer[0]?.name || 'Unknown Customer';
            } catch (error) {
              console.error('Error fetching customer:', error);
              customerName = 'Unknown Customer';
            }
          }
          
          if (conversation.driverId) {
            try {
              const driver = await db
                .select({ name: user.name })
                .from(user)
                .where(eq(user.id, conversation.driverId))
                .limit(1);
              driverName = driver[0]?.name || 'Unknown Driver';
            } catch (error) {
              console.error('Error fetching driver:', error);
              driverName = 'Unknown Driver';
            }
          }

          // Get order number if orderId exists
          if (conversation.orderId) {
            try {
              const order = await db
                .select({ orderNumber: orders.orderNumber })
                .from(orders)
                .where(eq(orders.id, conversation.orderId))
                .limit(1);
              orderNumber = order[0]?.orderNumber || null;
            } catch (error) {
              console.error('Error fetching order:', error);
              orderNumber = null;
            }
          }

          return {
            id: conversation.id || '',
            customerId: conversation.customerId || '',
            driverId: conversation.driverId || '',
            orderId: conversation.orderId || null,
            agoraChannelName: conversation.agoraChannelName || '',
            isActive: conversation.isActive || false,
            lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
            createdAt: conversation.createdAt || new Date().toISOString(),
            customerName: customerName || 'Unknown Customer',
            driverName: driverName || 'Unknown Driver',
            customerEmail: null,
            driverEmail: null,
            lastMessage: lastMessage[0] || null,
            unreadCount: unreadCount,
            orderNumber: orderNumber, // Include order number
          };
        } catch (error) {
          console.error('Error processing conversation:', conversation.id, error);
          // Return a safe default
          return {
            id: conversation.id || '',
            customerId: conversation.customerId || '',
            driverId: conversation.driverId || '',
            orderId: conversation.orderId || null,
            agoraChannelName: conversation.agoraChannelName || '',
            isActive: conversation.isActive || false,
            lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
            createdAt: conversation.createdAt || new Date().toISOString(),
            customerName: 'Unknown Customer',
            driverName: 'Unknown Driver',
            customerEmail: null,
            driverEmail: null,
            lastMessage: null,
            unreadCount: 0,
            orderNumber: null, // Include order number in error case too
          };
        }
      })
    );

    console.log('Successfully returning conversations:', conversationsWithLastMessage.length);
    return NextResponse.json({ conversations: conversationsWithLastMessage });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId, customerId: requestCustomerId, orderId } = await request.json();
    const currentUserId = session.user.id;

    // Determine if current user is customer or driver
    let finalCustomerId: string;
    let finalDriverId: string;

    if (requestCustomerId) {
      // Driver is initiating chat with customer (both driverId and customerId provided)
      finalCustomerId = requestCustomerId;
      finalDriverId = currentUserId;
    } else if (driverId) {
      // Customer is initiating chat with driver (only driverId provided)
      finalCustomerId = currentUserId;
      finalDriverId = driverId;
    } else {
      return NextResponse.json(
        { error: 'Either driverId or customerId is required' },
        { status: 400 }
      );
    }

    // Verify that both customer and driver exist in the user table
    const customerExists = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, finalCustomerId))
      .limit(1);

    const driverExists = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, finalDriverId))
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (driverExists.length === 0) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Require orderId for all conversations - make it mandatory for order-based chats
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required for creating conversations' },
        { status: 400 }
      );
    }

    // Check if conversation already exists for this specific order
    console.log(`Looking for existing conversation for order: ${orderId}`);
    const existingConversation = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.orderId, orderId),
          eq(chatConversations.isActive, true)
        )
      )
      .limit(1);

    if (existingConversation.length > 0) {
      console.log(`Found existing conversation: ${existingConversation[0].id}`);
      
      // Update lastMessageAt to indicate recent activity
      await db
        .update(chatConversations)
        .set({ 
          lastMessageAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(chatConversations.id, existingConversation[0].id));
      
      return NextResponse.json({ 
        conversation: {
          ...existingConversation[0],
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Create new conversation for this specific order
    console.log(`Creating new conversation for order: ${orderId} between customer: ${finalCustomerId} and driver: ${finalDriverId}`);
    const conversationId = uuidv4();
    const agoraChannelName = `chat_${conversationId.replace(/-/g, '_')}`;

    const newConversation = {
      id: conversationId,
      customerId: finalCustomerId,
      driverId: finalDriverId,
      orderId: orderId, // Always required now
      agoraChannelName,
      isActive: true,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(chatConversations).values(newConversation);
    console.log(`Successfully created new conversation: ${conversationId}`);

    return NextResponse.json({ conversation: newConversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}