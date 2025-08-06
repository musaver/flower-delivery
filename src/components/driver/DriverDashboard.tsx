'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, MessageCircle, Clock, CheckCircle, Navigation, Car, Truck, Settings } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';
import { GoogleMapsLocationPicker } from '@/components/maps/GoogleMapsLocationPicker';
import { LogoutButton } from '@/components/auth/LogoutButton';



interface DriverInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'available' | 'busy' | 'offline';
  vehicleType: string;
  vehiclePlateNumber: string;
  baseLocation: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

interface DriverDashboardProps {
  session: any;
}

export function DriverDashboard({ session }: DriverDashboardProps) {
  const router = useRouter();
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    fetchDriverInfo();
  }, [session?.user?.id]);

  const fetchDriverInfo = async () => {
    try {
      const response = await fetch(`/api/driver/info?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDriverInfo(data.driver);
        }
      }
    } catch (error) {
      console.error('Error fetching driver info:', error);
    } finally {
      setLoading(false);
    }
  };



  const updateDriverStatus = async (newStatus: 'available' | 'busy' | 'offline') => {
    if (!driverInfo) return;
    
    setUpdatingStatus(true);
    try {
      const response = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session?.user?.id, 
          status: newStatus 
        })
      });

      if (response.ok) {
        setDriverInfo({ ...driverInfo, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };



  const updateLocation = async (location: { address: string; latitude: number; longitude: number }) => {
    try {
      const response = await fetch('/api/driver/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        })
      });

      if (response.ok) {
        setDriverInfo(prev => prev ? {
          ...prev,
          currentLatitude: location.latitude,
          currentLongitude: location.longitude
        } : null);
        // Don't hide the picker immediately - let user see the updated location
        // setShowLocationPicker(false);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Driver Dashboard" />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
        <MobileNav userRole="driver" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Driver Dashboard" />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Driver Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">{driverInfo?.name || session?.user?.name}</h2>
                <p className="text-sm text-muted-foreground">{driverInfo?.email || session?.user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {driverInfo?.vehicleType} • {driverInfo?.vehiclePlateNumber}
                  </span>
                </div>
              </div>
              <Badge className={getStatusColor(driverInfo?.status || 'offline')}>
                {(driverInfo?.status || 'offline').charAt(0).toUpperCase() + (driverInfo?.status || 'offline').slice(1)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Label htmlFor="availability">Available for Orders</Label>
                <Switch
                  id="availability"
                  checked={driverInfo?.status === 'available'}
                  onCheckedChange={(checked) => 
                    updateDriverStatus(checked ? 'available' : 'offline')
                  }
                  disabled={updatingStatus}
                />
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Update Location
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location Picker */}
        {showLocationPicker && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Update Your Location
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLocationPicker(false)}
                >
                  Done
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driverInfo?.currentLatitude && driverInfo?.currentLongitude && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="font-medium text-green-700 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Current Location Set
                  </div>
                  <div className="text-green-600 text-xs">
                    Coordinates: {parseFloat(driverInfo.currentLatitude.toString()).toFixed(6)}, {parseFloat(driverInfo.currentLongitude.toString()).toFixed(6)}
                  </div>
                </div>
              )}
              <GoogleMapsLocationPicker
                onLocationSelect={updateLocation}
                initialLatitude={driverInfo?.currentLatitude ? parseFloat(driverInfo.currentLatitude.toString()) : undefined}
                initialLongitude={driverInfo?.currentLongitude ? parseFloat(driverInfo.currentLongitude.toString()) : undefined}
                height="300px"
              />
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Settings className="h-4 w-4" />
              Driver Settings
            </Button>
            
            <Separator />
            
            <LogoutButton />
          </CardContent>
        </Card>


      </main>

      <MobileNav />
    </div>
  );
}