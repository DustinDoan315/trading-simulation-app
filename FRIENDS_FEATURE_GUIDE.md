# Friends Feature Implementation Guide

This guide explains how to implement and use the friends feature in your trading simulation app.

## Overview

The friends feature allows users to:

- Add friends using invite codes
- Search and send friend requests to other users
- View friends' trading performance on a dedicated leaderboard
- Share invite codes with friends

## Database Setup

### 1. Run the Migration

First, run the database migration to create the necessary tables:

```sql
-- Run this in your Supabase SQL Editor
-- Copy the contents of database/migration_create_friends_table.sql
```

This creates:

- `friends` table - stores friend relationships
- `friend_invitations` table - stores invite codes
- Database functions for managing invitations
- Row Level Security policies

### 2. Verify Tables Created

Check that the following tables exist in your Supabase dashboard:

- `friends`
- `friend_invitations`

## Features Implemented

### 1. Friends Management

#### Add Friends

- **Invite Code**: Users can generate and share invite codes
- **Search Users**: Search for users by username or display name
- **Send Requests**: Send friend requests to other users

#### Friend Requests

- **Accept/Reject**: Handle incoming friend requests
- **Pending Requests**: View pending friend requests
- **Remove Friends**: Remove existing friends

### 2. Friends Leaderboard

- **Dedicated Tab**: Friends tab in the leaderboard screen
- **Real-time Updates**: Friends' rankings update in real-time
- **Performance Stats**: View friends' P&L, portfolio value, and global rank

### 3. Sharing & Invitations

- **Generate Codes**: Create unique invite codes
- **Share Codes**: Share via native sharing
- **Accept Codes**: Enter codes to become friends
- **Usage Limits**: Codes can be used multiple times (configurable)

## How to Use

### For Users

#### Adding Friends

1. **Using Invite Codes**:

   - Tap "Share" in the Friends tab to generate an invite code
   - Share the code with friends via message, social media, etc.
   - Friends enter the code in the "Add Friends" modal

2. **Searching Users**:
   - Tap "Add" in the Friends tab
   - Search for users by username or display name
   - Tap "Add" next to a user to send a friend request

#### Managing Friends

1. **View Friends**: See all your friends in the Friends tab
2. **Remove Friends**: Long press on a friend to remove them
3. **View Performance**: See friends' trading stats and rankings

#### Friends Leaderboard

1. **Switch to Friends Tab**: In the leaderboard screen, tap "Friends"
2. **View Rankings**: See your friends ranked by performance
3. **Real-time Updates**: Rankings update automatically

### For Developers

#### Using the FriendsService

```typescript
import { FriendsService } from "@/services/FriendsService";

// Create an invitation
const inviteCode = await FriendsService.createInvitation({
  created_by: userId,
  max_uses: 10,
});

// Accept an invitation
await FriendsService.acceptInvitation({
  invite_code: code,
  user_id: userId,
});

// Get friends list
const friends = await FriendsService.getFriends(userId);

// Send friend request
await FriendsService.sendFriendRequest({
  user_id: userId,
  friend_id: friendId,
  message: "Hi! I'd like to add you as a friend.",
});
```

#### Using the useFriendsData Hook

```typescript
import { useFriendsData } from "@/hooks/useFriendsData";

const {
  friends,
  pendingRequests,
  isLoading,
  refresh,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} = useFriendsData(userId);
```

#### Components Available

- `FriendsList` - Display list of friends
- `AddFriendModal` - Search and add friends
- `ShareInviteModal` - Generate and share invite codes

## Database Schema

### Friends Table

```sql
CREATE TABLE friends (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    friend_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    invited_by UUID REFERENCES users(id),
    invite_code VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    accepted_at TIMESTAMP,
    UNIQUE(user_id, friend_id)
);
```

### Friend Invitations Table

```sql
CREATE TABLE friend_invitations (
    id UUID PRIMARY KEY,
    invite_code VARCHAR(20) UNIQUE,
    created_by UUID REFERENCES users(id),
    max_uses INTEGER DEFAULT 10,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Security Features

### Row Level Security (RLS)

- Users can only view their own friend relationships
- Users can only manage their own invitations
- Proper access controls for all operations

### Invitation Security

- Unique invite codes with collision detection
- Usage limits and expiration dates
- Automatic deactivation when limits reached

## Integration Points

### Leaderboard Integration

The friends feature integrates with the existing leaderboard system:

- Friends appear in a dedicated "Friends" tab
- Real-time updates when friends' rankings change
- Uses existing leaderboard ranking calculations

### User Context Integration

- Integrates with existing user authentication
- Uses UserContext for current user information
- Maintains consistency with existing user management

## Error Handling

The implementation includes comprehensive error handling:

- Network errors during API calls
- Invalid invite codes
- Duplicate friend relationships
- Expired invitations
- User-friendly error messages

## Performance Considerations

- Efficient database queries with proper indexing
- Real-time updates using Supabase subscriptions
- Optimized friend list rendering
- Minimal API calls with proper caching

## Future Enhancements

Potential improvements for the friends feature:

1. **Friend Activity Feed**: Show friends' recent trades
2. **Friend Challenges**: Create trading challenges between friends
3. **Friend Groups**: Create groups of friends for competitions
4. **Friend Notifications**: Notify when friends make trades
5. **Friend Analytics**: Compare performance with friends over time

## Troubleshooting

### Common Issues

1. **Invite codes not working**:

   - Check if the code has expired
   - Verify the code hasn't reached usage limit
   - Ensure the code is entered correctly

2. **Friends not appearing in leaderboard**:

   - Verify the friendship is accepted (status = 'ACCEPTED')
   - Check if friends have trading activity
   - Ensure leaderboard rankings are calculated

3. **Friend requests not showing**:
   - Check pending requests in the database
   - Verify RLS policies are correct
   - Ensure proper user authentication

### Debug Commands

```sql
-- Check friend relationships
SELECT * FROM friends WHERE user_id = 'your-user-id';

-- Check pending requests
SELECT * FROM friends WHERE friend_id = 'your-user-id' AND status = 'PENDING';

-- Check invite codes
SELECT * FROM friend_invitations WHERE created_by = 'your-user-id';

-- Check leaderboard rankings for friends
SELECT lr.*, u.username
FROM leaderboard_rankings lr
JOIN users u ON lr.user_id = u.id
WHERE lr.user_id IN (
  SELECT friend_id FROM friends WHERE user_id = 'your-user-id' AND status = 'ACCEPTED'
);
```

## Support

For issues or questions about the friends feature:

1. Check the database logs in Supabase
2. Verify all migrations have been applied
3. Test with a fresh user account
4. Check the browser console for errors
