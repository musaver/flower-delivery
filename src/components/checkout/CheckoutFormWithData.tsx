'use client'

import { useState, useEffect } from 'react';
import { Truck, DollarSign, Gift, Star, User, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { GoogleMapsLocationPicker } from '@/components/maps/GoogleMapsLocationPicker';

interface LoyaltySettings {
  enabled: boolean;
  earningRate: number;
  earningBasis: string;
  redemptionValue: number;
  expiryMonths: number;
  minimumOrder: number;
  maxRedemptionPercent: number;
  redemptionMinimum: number;
}

interface CustomerPoints {
  availablePoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
}

interface CheckoutData {
  paymentMethod: 'cod';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  orderNotes: string;
  pointsToRedeem?: number;
  pointsDiscountAmount?: number;
  useAllPoints?: boolean;
}

interface CheckoutFormWithDataProps {
  total: number;
  loyaltySettings: LoyaltySettings;
  customerPoints: CustomerPoints;
  onSubmit: (data: CheckoutData) => void;
}

export function CheckoutFormWithData({ total, loyaltySettings, customerPoints, onSubmit }: CheckoutFormWithDataProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod');
  const [orderNotes, setOrderNotes] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    instructions: ''
  });
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Loyalty points state
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsDiscountAmount, setPointsDiscountAmount] = useState(0);
  const [useAllPoints, setUseAllPoints] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/settings/user');
        if (response.ok) {
          const userData = await response.json();
          
          // Auto-fill customer info
          setCustomerInfo({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || ''
          });
          
          // Auto-fill address if available
          setAddress({
            street: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.postalCode || '', // Auto-fill from postalCode
            latitude: userData.latitude ? parseFloat(userData.latitude) : undefined,
            longitude: userData.longitude ? parseFloat(userData.longitude) : undefined,
            instructions: ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle location selection from Google Maps
  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
    // Parse the Google Maps address to extract components
    const addressParts = location.address.split(', ');
    let street = '';
    let city = '';
    let state = '';
    let zipCode = '';

    if (addressParts.length >= 4) {
      street = addressParts[0];
      city = addressParts[1];
      const stateZip = addressParts[2].split(' ');
      state = stateZip[0];
      zipCode = stateZip.slice(1).join(' ');
    } else {
      // Fallback: use full address as street
      street = location.address;
    }

    setAddress({
      ...address,
      street,
      city,
      state,
      zipCode,
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

  // Calculate points that will be earned from this order
  const pointsToEarn = loyaltySettings.enabled 
    ? Math.floor((loyaltySettings.earningBasis === 'total' ? total : total) * loyaltySettings.earningRate)
    : 0;

  // Points redemption functions
  const handlePointsRedemption = (pointsToRedeem: number) => {
    if (pointsToRedeem < 0) pointsToRedeem = 0;
    if (pointsToRedeem > customerPoints.availablePoints) {
      pointsToRedeem = customerPoints.availablePoints;
    }

    // Calculate discount amount based on points
    const discountAmount = pointsToRedeem * loyaltySettings.redemptionValue;
    
    // Calculate subtotal (total - tax)
    const subtotal = total; // No tax applied
    const maxAllowedDiscount = subtotal * (loyaltySettings.maxRedemptionPercent / 100);
    
    const finalDiscountAmount = Math.min(discountAmount, maxAllowedDiscount);
    const finalPointsToRedeem = Math.floor(finalDiscountAmount / loyaltySettings.redemptionValue);

    setPointsToRedeem(finalPointsToRedeem);
    setPointsDiscountAmount(finalDiscountAmount);
    setUseAllPoints(false);
  };

  const handleUseAllPoints = () => {
    if (useAllPoints) {
      setPointsToRedeem(0);
      setPointsDiscountAmount(0);
      setUseAllPoints(false);
    } else {
      const maxPointsBasedOnPercent = Math.floor((total * loyaltySettings.maxRedemptionPercent / 100) / loyaltySettings.redemptionValue);
      const pointsToUse = Math.min(customerPoints.availablePoints, maxPointsBasedOnPercent);
      
      if (pointsToUse >= loyaltySettings.redemptionMinimum) {
        setPointsToRedeem(pointsToUse);
        setPointsDiscountAmount(pointsToUse * loyaltySettings.redemptionValue);
        setUseAllPoints(true);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const checkoutData: CheckoutData = {
      paymentMethod,
      customerInfo,
      deliveryAddress: address,
      orderNotes,
      pointsToRedeem,
      pointsDiscountAmount,
      useAllPoints
    };

    onSubmit(checkoutData);
  };

  const finalTotal = total - pointsDiscountAmount;
  const canUsePoints = loyaltySettings.enabled && 
                       customerPoints.availablePoints >= loyaltySettings.redemptionMinimum &&
                       total >= loyaltySettings.minimumOrder;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>$0.00</span>
          </div>
          {pointsDiscountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Points Discount (-{pointsToRedeem} pts)</span>
              <span>-${pointsDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Points Section */}
      {loyaltySettings.enabled && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Star className="h-5 w-5" />
              Loyalty Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Points Available */}
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Available Points</p>
                <p className="text-sm text-muted-foreground">
                  Worth ${(customerPoints.availablePoints * loyaltySettings.redemptionValue).toFixed(2)} in rewards
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {customerPoints.availablePoints}
              </Badge>
            </div>

            {/* Points to Earn */}
            {pointsToEarn > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <Gift className="h-4 w-4" />
                  <span className="font-medium">You'll earn {pointsToEarn} points from this order!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Points will be available when your order is completed (${(pointsToEarn * loyaltySettings.redemptionValue).toFixed(2)} reward value)
                </p>
              </div>
            )}

            {/* Points Redemption */}
            {canUsePoints && (
              <div className="space-y-3">
                <Label htmlFor="pointsToRedeem">Redeem Points (Min: {loyaltySettings.redemptionMinimum})</Label>
                <div className="flex gap-2">
                  <Input
                    id="pointsToRedeem"
                    type="number"
                    min="0"
                    max={customerPoints.availablePoints}
                    value={pointsToRedeem}
                    onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseAllPoints}
                    className="whitespace-nowrap"
                  >
                    {useAllPoints ? 'Clear' : 'Use Max'}
                  </Button>
                </div>
                {pointsToRedeem > 0 && (
                  <p className="text-sm text-green-600">
                    💰 You'll save ${pointsDiscountAmount.toFixed(2)} with {pointsToRedeem} points
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max {loyaltySettings.maxRedemptionPercent}% of order value (${(total * loyaltySettings.maxRedemptionPercent / 100).toFixed(2)})
                </p>
              </div>
            )}

            {!canUsePoints && customerPoints.availablePoints > 0 && (
              <div className="text-sm text-muted-foreground">
                {customerPoints.availablePoints < loyaltySettings.redemptionMinimum 
                  ? `Need ${loyaltySettings.redemptionMinimum} points minimum to redeem`
                  : `Minimum order of $${loyaltySettings.minimumOrder} required for points redemption`
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              value={customerInfo.name}
              className="bg-gray-100 cursor-not-allowed"
              readOnly
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                className="pl-10 bg-gray-100 cursor-not-allowed"
                value={customerInfo.email}
                readOnly
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                required
                className="pl-10 bg-gray-100 cursor-not-allowed"
                value={customerInfo.phone}
                readOnly
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Address
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              {showLocationPicker ? 'Manual Entry' : 'Use Map'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showLocationPicker ? (
            <div className="space-y-4">
              {address.latitude && address.longitude && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="font-medium text-green-700 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Using Your Saved Location
                  </div>
                  <div className="text-green-600">{address.street}</div>
                  {address.city && <div className="text-green-600">{address.city}, {address.state} {address.zipCode}</div>}
                  <div className="text-green-500 text-xs mt-1">
                    Coordinates: {address.latitude?.toFixed(6)}, {address.longitude?.toFixed(6)}
                  </div>
                </div>
              )}
              <GoogleMapsLocationPicker
                onLocationSelect={handleLocationSelect}
                initialAddress={address.street + (address.city ? `, ${address.city}` : '') + (address.state ? `, ${address.state}` : '') + (address.zipCode ? ` ${address.zipCode}` : '')}
                initialLatitude={address.latitude}
                initialLongitude={address.longitude}
                height="350px"
              />
            </div>
          ) : (
            <>
              {address.latitude && address.longitude && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="font-medium text-green-700 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Using Your Saved Location
                  </div>
                  <div className="text-green-600">GPS coordinates available for accurate delivery</div>
                </div>
              )}
              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="NY"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  required
                  value={address.zipCode}
                  onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="instructions">Delivery Instructions</Label>
            <Textarea
              id="instructions"
              value={address.instructions}
              onChange={(e) => setAddress({ ...address, instructions: e.target.value })}
              placeholder="Leave at door, ring bell, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cod')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod">Cash on Delivery</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Order Notes 
      <Card>
        <CardHeader>
          <CardTitle>Order Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special instructions for your order..."
          />
        </CardContent>
      </Card>*/}

      {/* Submit Button */}
      <Button type="submit" className="w-full" size="lg">
        Place Order - ${finalTotal.toFixed(2)}
        {pointsToEarn > 0 && (
          <span className="ml-2 text-xs">
            (+{pointsToEarn} pts)
          </span>
        )}
      </Button>
    </form>
  );
}