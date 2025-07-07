# Collections Components

This directory contains reusable components for the collections feature.

## Components

### CollectionItem

Displays individual collection information with join/leave actions.

### DiscoverCollectionItem

Displays collection information in the discovery view with join functionality.

### EmptyState

Shows when there are no collections to display.

## Invite Code Screens

The invite code functionality has been moved to dedicated screen files:

- `app/(modals)/invite-code-input.tsx` - Manual invite code entry
- `app/(modals)/invite-code-scanner.tsx` - QR code scanning with camera support

### Navigation

To use these screens, navigate to them using:

```tsx
import { router } from "expo-router";

// For manual input
router.push("/(modals)/invite-code-input");

// For QR scanner
router.push("/(modals)/invite-code-scanner");
```

### Features

Both screens include:

- Beautiful gradient UI design
- Keyboard handling and animations
- Error handling and validation
- Loading states
- Automatic navigation back to previous screen

The scanner screen also includes:

- Camera integration with QR code scanning
- Permission handling
- Mode switching between manual input and camera scanning
- Clipboard integration
