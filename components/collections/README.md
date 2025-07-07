# InviteCodeScanner Component

A comprehensive invite code input component with both manual entry and QR code scanning capabilities.

## Features

- **Dual Mode Support**: Toggle between manual input and camera scanning
- **QR Code Scanning**: Real-time QR code detection using device camera
- **Clipboard Integration**: Paste invite codes directly from clipboard
- **Camera Permissions**: Automatic permission handling with user-friendly prompts
- **Responsive Design**: Beautiful UI with gradient backgrounds and animations
- **Error Handling**: Comprehensive error handling for various scenarios

## Usage

```tsx
import InviteCodeScanner from "@/components/collections/InviteCodeScanner";

const MyComponent = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCodeScanned = async (code: string) => {
    setLoading(true);
    try {
      // Process the invite code
      await joinCollection(code);
      setShowScanner(false);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <InviteCodeScanner
      visible={showScanner}
      onCodeScanned={handleCodeScanned}
      onClose={() => setShowScanner(false)}
      loading={loading}
    />
  );
};
```

## Props

| Prop            | Type                     | Required | Description                           |
| --------------- | ------------------------ | -------- | ------------------------------------- |
| `visible`       | `boolean`                | Yes      | Controls modal visibility             |
| `onCodeScanned` | `(code: string) => void` | Yes      | Callback when code is scanned/entered |
| `onClose`       | `() => void`             | Yes      | Callback when modal is closed         |
| `loading`       | `boolean`                | No       | Shows loading state during processing |

## User Flow

### Manual Input Mode

1. User opens the scanner modal
2. Defaults to manual input mode
3. User can:
   - Type invite code manually
   - Paste from clipboard using the "Paste from Clipboard" button
   - Submit the code for processing

### Camera Scanning Mode

1. User taps the camera icon in the header to switch to scan mode
2. Camera permission is requested if not granted
3. Camera view opens with QR code scanning overlay
4. User positions QR code within the scanning frame
5. Code is automatically detected and processed

### Mode Switching

- Toggle between manual and camera modes using the header button
- Manual mode: Shows keyboard icon
- Camera mode: Shows camera icon

## Technical Details

### Dependencies

- `expo-camera`: For QR code scanning functionality
- `expo-clipboard`: For clipboard integration
- `expo-linear-gradient`: For gradient backgrounds
- `@expo/vector-icons`: For icons

### Camera Permissions

The component automatically handles camera permissions:

- Requests permission when switching to camera mode
- Shows permission prompt if access is denied
- Gracefully falls back to manual mode if camera is unavailable

### QR Code Validation

- Scanned codes must be at least 6 characters long
- Invalid codes show an error message
- Valid codes are automatically processed

### Error Handling

- Camera mount errors
- Permission denied scenarios
- Invalid QR code content
- Clipboard access errors

## Styling

The component uses a consistent design system with:

- Dark theme with gradient backgrounds
- Rounded corners and shadows
- Smooth animations and transitions
- Responsive layout that adapts to keyboard visibility

## Accessibility

- Proper focus management
- Clear visual feedback
- Descriptive error messages
- Touch-friendly button sizes
