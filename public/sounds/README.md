# Notification Sounds Setup Guide

This directory contains notification sound files for the admin panel appointment notifications.

## Currently Supported Sounds

The system supports the following sound types:

1. **notification.mp3** - Main appointment notification sound
2. **success.mp3** - Success/confirmation sounds
3. **error.mp3** - Error notification sounds

## Adding Custom Sound Files

### Option 1: Using Custom Audio Files (Recommended)

1. Place your MP3 files in this directory with the names:
   - `notification.mp3` - Main notification sound
   - `success.mp3` - Success sound
   - `error.mp3` - Error sound

2. The system will automatically detect and use these files

3. If audio files are not found, the system will fall back to Web Audio API-generated sounds

### Option 2: Web Audio API Generated Sounds (Default)

If you don't provide audio files, the system uses Web Audio API to generate pleasant notification sounds:

- **Appointment Notification**: A pleasant two-tone sound (850Hz → 1100Hz)
- **Success Sound**: Upward three-tone chord (600Hz, 800Hz, 1000Hz)
- **Error Sound**: Downward two-tone sound (900Hz → 600Hz)

## Sound File Specifications

For best results, use these specifications for your audio files:

```
Format: MP3
Sample Rate: 44.1 kHz or higher
Channels: Mono or Stereo
Duration: 0.5 - 1 second (recommended)
Bit Rate: 128 kbps or higher
Volume Level: -3dB to -6dB average loudness
```

## Managing Sound Settings

Users can:

1. **Mute/Unmute Notifications**: Click the speaker icon in the top-left corner of the admin panel
2. **Volume Control**: Adjust browser volume or system volume
3. **Mute Status**: The mute status is saved in browser localStorage

## Recommended Sound Sources

Free and open-source sound libraries:
- [Freesound.org](https://freesound.org/)
- [Notification Sounds](https://notificationsounds.com/)
- [Zapsplat](https://www.zapsplat.com/)
- [Pixabay Music](https://pixabay.com/music/)

## Troubleshooting

### No sound is playing:

1. Check browser console for errors (F12 → Console)
2. Ensure browser hasn't blocked audio auto-play
3. Check system volume settings
4. Verify the mute toggle is not enabled (speaker icon)
5. Try a different browser

### Audio files not loading:

1. Ensure MP3 files are in `/public/sounds/` directory
2. Check file names are exact: `notification.mp3`, `success.mp3`, `error.mp3`
3. Verify files are not corrupted
4. Check browser Network tab for 404 errors

### Web Audio API fallback issues:

The Web Audio API fallback is built-in and should work on all modern browsers. If issues persist, check the browser console for specific error messages.

## Code Integration

The sound system is managed through the `soundManager` utility located at:
```
src/app/admin/utils/soundManager.js
```

### Usage in Components:

```javascript
import { soundManager } from '../utils/soundManager';

// Play appointment notification
soundManager.playAppointmentSound();

// Play success sound
soundManager.playSuccessSound();

// Play error sound
soundManager.playErrorSound();

// Get mute status
const isMuted = soundManager.isSoundMuted();

// Toggle mute
soundManager.toggleMute();
```

## Browser Support

- Chrome/Chromium: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14.5+)
- Edge: ✅ Full support
- Opera: ✅ Full support

The system uses modern Web Audio API and HTML5 Audio elements with automatic fallbacks for maximum compatibility.
