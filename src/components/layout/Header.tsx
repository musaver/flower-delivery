'use client'

import { Search, Bell, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  notifications?: number;
  onMenuClick?: () => void;
  showBack?: boolean;
}

export function Header({ title, showSearch = false, notifications = 0, onMenuClick, showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-card backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {onMenuClick && !showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {showSearch && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 w-64"
                />
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                  {notifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {showSearch && (
          <div className="mt-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 w-full"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}