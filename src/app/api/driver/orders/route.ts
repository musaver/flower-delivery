import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, user, drivers } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First get the driver ID from userId
    const driverData = await db
      .select({ driverId: drivers.id })
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (driverData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    const driverId = driverData[0].driverId;

    // Get orders assigned to this driver
    const driverOrders = await db
      .select({
        order: orders,
        customer: user
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(eq(orders.assignedDriverId, driverId))
      .orderBy(desc(orders.createdAt));

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      driverOrders.map(async (orderData) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderData.order.id));

        return {
          id: orderData.order.id,
          orderNumber: orderData.order.orderNumber,
          userId: orderData.order.userId || '',
          items: items.map(item => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
            totalPrice: parseFloat(item.totalPrice.toString())
          })),
          total: parseFloat(orderData.order.totalAmount.toString()),
          status: orderData.order.status,
          deliveryStatus: orderData.order.deliveryStatus || 'pending',
          paymentMethod: 'cod', // Default since paymentMethod field doesn't exist in schema
          paymentStatus: orderData.order.paymentStatus,
          orderNotes: orderData.order.notes,
          deliveryAddress: {
            street: orderData.order.shippingAddress1 || '',
            city: orderData.order.shippingCity || '',
            state: orderData.order.shippingState || '',
            zipCode: orderData.order.shippingPostalCode || '',
            instructions: orderData.order.shippingAddress2 || '',
            latitude: orderData.order.shippingLatitude ? parseFloat(orderData.order.shippingLatitude.toString()) : undefined,
            longitude: orderData.order.shippingLongitude ? parseFloat(orderData.order.shippingLongitude.toString()) : undefined
          },
          createdAt: orderData.order.createdAt?.toISOString() || new Date().toISOString(),
          customerName: orderData.customer?.name || 'Customer',
          customerPhone: orderData.customer?.phone || ''
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: ordersWithItems
    });

  } catch (error) {
    console.error('Error fetching driver orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch driver orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}