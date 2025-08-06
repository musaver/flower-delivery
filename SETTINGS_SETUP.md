# Settings Page Setup Guide

This guide explains how to set up the new settings page in the login-register project.

## Overview

The settings page allows users to:
- Update their profile information (Full Name, Email, Phone, Address, etc.)
- Configure notification preferences for Order Updates, Promotions, and Driver Messages
- Logout from their account

## Files Created/Modified

### New Files
- `src/app/settings/page.tsx` - Settings page route
- `src/components/settings/SettingsClient.tsx` - Main settings component
- `src/app/api/settings/user/route.ts` - API endpoints for user data
- `drizzle/migrations/add_notification_preferences.sql` - Database migration

### Modified Files
- `src/lib/schema.ts` - Added notification preference columns to user table
- `drizzle/schema.ts` - Added notification preference columns to user table
- `src/app/dashboard/page.tsx` - Added navigation to settings page

## Database Setup

1. **Run the migration script** to add notification preference columns:
```sql
-- Execute the migration file
source drizzle/migrations/add_notification_preferences.sql
```

2. **Or run manually** if the script doesn't work:
```sql
ALTER TABLE `user` 
ADD COLUMN `notify_order_updates` TINYINT DEFAULT 1,
ADD COLUMN `notify_promotions` TINYINT DEFAULT 0,
ADD COLUMN `notify_driver_messages` TINYINT DEFAULT 1;
```

## Schema Changes

Added to the user table:
- `notify_order_updates` - Boolean (default: true) - Get notified about order status changes
- `notify_promotions` - Boolean (default: false) - Receive promotional offers and discounts  
- `notify_driver_messages` - Boolean (default: true) - Get notified of driver communications

## API Endpoints

### GET `/api/settings/user`
- Fetches current user's profile and notification settings
- Requires authentication
- Returns user data including notification preferences

### PUT `/api/settings/user`
- Updates user profile and notification settings
- Requires authentication
- Accepts partial updates (only provided fields are updated)

## Features

### Profile Information
- Full Name (name field)
- First Name, Last Name (firstName, lastName fields)
- Email (email field)
- Phone Number (phone field)
- Address (address field)
- City, State, Country (city, state, country fields)

### Notification Settings
- **Order Updates**: Get notified about order status changes
- **Promotions**: Receive promotional offers and discounts
- **Driver Messages**: Get notified of driver communications

### User Experience
- Form validation and error handling
- Loading states for data fetching and saving
- Toast notifications for success/error feedback
- Responsive design matching the existing app style
- Back button navigation
- Mobile-friendly with MobileNav component

## Navigation

Users can access the settings page from:
- Dashboard → Quick Actions → Account Settings button
- Direct URL: `/settings`

## Authentication

- Settings page requires user authentication
- Redirects to `/login` if not authenticated
- Uses Next.js session management

## Styling

- Uses the same UI components as the nextjs project design
- Consistent with the app's existing design system
- Cards for organized sections
- Icons from Lucide React
- Responsive layout with proper spacing

## Dependencies

All required dependencies are already installed:
- Next.js App Router
- NextAuth for authentication
- Drizzle ORM for database operations
- UI components (Card, Input, Switch, Button, etc.)
- Lucide React for icons

## Testing

To test the settings page:
1. Ensure you have a logged-in user session
2. Navigate to `/settings` or click Account Settings from dashboard
3. Try updating profile information and notification preferences
4. Verify data is saved correctly in the database
5. Test form validation and error states