'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, MapPin, Star } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';

interface OrderData {
  orderId: string;
  total: number;
  originalTotal?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  paymentMethod: string;
  orderNotes: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
  };
}

export default function ThankYouPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loyaltySettings, setLoyaltySettings] = useState({
    enabled: false,
    redemptionValue: 0.01, // Default: 1 point = $0.01
    earningRate: 1
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [userPoints, setUserPoints] = useState({
    availablePoints: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0
  });
  const [loadingPoints, setLoadingPoints] = useState(true);
  
  useEffect(() => {
    // Get order data from localStorage or URL params
    const savedOrderData = localStorage.getItem('lastOrder');
    if (savedOrderData) {
      try {
        const data = JSON.parse(savedOrderData);
        setOrderData(data);
        // Clear the saved order data after loading
        localStorage.removeItem('lastOrder');
      } catch (error) {
        console.error('Error loading order data:', error);
      }
    }
    
    // Clear the cart after successful order
    clearCart();
  }, []); // Empty dependency array - only run once on mount

  // Fetch loyalty settings
  useEffect(() => {
    const fetchLoyaltySettings = async () => {
      try {
        const response = await fetch('/api/loyalty/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setLoyaltySettings(data.settings);
          }
        }
      } catch (error) {
        console.error('Error fetching loyalty settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchLoyaltySettings();
  }, []);

  // Fetch user's current points balance
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!session?.user?.id) {
        setLoadingPoints(false);
        return;
      }

      try {
        const response = await fetch(`/api/loyalty/points?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.points) {
            setUserPoints({
              availablePoints: data.points.availablePoints || 0,
              totalPointsEarned: data.points.totalPointsEarned || 0,
              totalPointsRedeemed: data.points.totalPointsRedeemed || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user points:', error);
      } finally {
        setLoadingPoints(false);
      }
    };

    fetchUserPoints();
  }, [session?.user?.id]);

  // Redirect to home if no order data after 2 seconds
  useEffect(() => {
    if (!orderData) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [orderData, router]);

  // Calculate loyalty points earned based on order subtotal
  const baseAmount = orderData ? (orderData.originalTotal || orderData.total) : 0;
  const loyaltyPointsEarned = loyaltySettings.enabled ? Math.floor(baseAmount * loyaltySettings.earningRate) : 0;
  const pointsRedeemed = orderData?.pointsRedeemed || 0;
  const pointsDiscount = orderData?.pointsDiscount || 0;
  
  // Calculate total reward amount based on points earned
  const rewardAmount = loyaltyPointsEarned * loyaltySettings.redemptionValue;

  const handleTrackOrder = () => {
    router.push('/orders');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Order Confirmation" />
        
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="text-center py-12 space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Order Confirmation" />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Success Message */}
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-success-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-success">Order Confirmed!</h2>
                <p className="text-muted-foreground">Order #{orderData.orderId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Points */}
        {!loadingSettings && !loadingPoints && loyaltySettings.enabled && userPoints && (loyaltyPointsEarned > 0 || pointsRedeemed > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Loyalty Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  {loyaltyPointsEarned > 0 && (
                    <>
                      <p className="font-semibold text-lg">+{loyaltyPointsEarned} Points Earned!</p>
                      {/* <p className="text-sm text-muted-foreground">Total Balance: {userPoints?.availablePoints || 0} points</p> */}
                      <p className="text-sm text-muted-foreground">Points can be redeemed after order completion</p>
                    
                    </>
                  )}
                  {pointsRedeemed > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-lg text-purple-600">-{pointsRedeemed} Points Redeemed</p>
                      <p className="text-sm text-muted-foreground">Saved ${pointsDiscount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {loyaltyPointsEarned > 0 && (
                  <Badge className="text-lg px-3 py-1 bg-success text-success-foreground">
                    ${rewardAmount.toFixed(2)} in rewards
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderData.originalTotal && orderData.originalTotal !== orderData.total && (
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${orderData.originalTotal.toFixed(2)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-purple-600">
                <span>Points Discount ({pointsRedeemed} pts):</span>
                <span>-${pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="">Total Amount:</span>
              <span className="font-semibold">${orderData.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="capitalize">{orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : orderData.paymentMethod}</span>
            </div>
            {orderData.orderNotes && (
              <div>
                <span className="font-medium">Order Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">{orderData.orderNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p>{orderData.deliveryAddress.street}</p>
              <p>{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}</p>
              {orderData.deliveryAddress.instructions && (
                <p className="text-sm text-muted-foreground">
                  Instructions: {orderData.deliveryAddress.instructions}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Button */}
        <Button 
          onClick={handleTrackOrder} 
          size="lg" 
          className="w-full" 
          variant="premium"
        >
          Track Order
        </Button>

        {/* Next Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">What's Next?</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Your order is being prepared</p>
                <p>• A delivery driver will be assigned shortly</p>
                <p>• You'll receive updates via notifications</p>
                <p>• Track your order in the Orders section</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  );
}