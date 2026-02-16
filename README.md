# Velvet Luxury Salon - Admin Dashboard

This is the admin dashboard for managing Velvet Luxury Salon operations.

## Quick Start

### Prerequisites
- Node.js 16.0 or higher
- npm or pnpm package manager

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Built files will be in the `dist/` directory.

## Features

### Dashboard
- Overview of salon operations
- Quick statistics and metrics
- Recent bookings and appointments

### Appointment Management
- View all appointments
- Check-in appointments
- Cancel appointments
- Mark appointments as expired
- **Real-time notifications** with notification sounds when new appointments are received

### Staff Management
- Manage staff members
- View staff salary analytics
- Attendance tracking

### Customer Management
- View customer database
- Update customer information
- Manage customer visits

### Financial Management
- Billing management
- Salary analytics
- Revenue tracking

### Content Management
- Manage hero section content
- Update services information
- Manage contact information
- Update gallery and products

### Newsletter & Communication
- Newsletter management
- Email sending
- Newsletter content management

### Social Integration
- Manage social media links
- Update business information

## Notification Sounds

The admin panel includes a notification system that plays sounds when new appointments are received.

### Sound Management
- Click the speaker icon (top-left) to toggle notifications on/off
- Mute preference is saved in browser localStorage
- Sounds play automatically unless muted

### Supported Sounds
- **Appointment Notification:** Pleasant two-tone sound
- **Success Sound:** Upward three-tone chord
- **Error Sound:** Downward two-tone alert

### Adding Custom Sounds
Place MP3 files in the `public/sounds/` directory:
- `notification.mp3` - Appointment notification
- `success.mp3` - Success sound
- `error.mp3` - Error sound

If custom files aren't provided, the system uses Web Audio API-generated sounds.

## Project Structure

```
admin/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── components/      # Admin UI components
│   │   │   ├── pages/           # Admin pages
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── context/         # React context
│   │   │   ├── services/        # API and business logic
│   │   │   └── utils/           # Utility functions
│   │   └── styles/              # Global styles
│   ├── firebaseConfig.ts        # Firebase configuration
│   └── main.tsx                 # Entry point
├── public/
│   ├── sounds/                  # Notification sounds
│   │── manifest.json            # PWA manifest
│   └── icons/                   # App icons
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
└── README.md                   # This file
```

## Key Files

- **AdminApp.tsx** - Main admin application component
- **Appointments.jsx** - Appointment management page
- **AppointmentNotification.jsx** - Real-time appointment notifications
- **firebaseUtils.js** - Firebase operations
- **soundManager.js** - Notification sound management

## Technologies

- **React 18.3.1** - UI framework
- **Vite 6.3.5** - Build tool
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4.1.12** - Styling
- **Firebase 12.7.0** - Backend & database
- **Lucide React** - Icons
- **Recharts** - Data visualization

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Authentication

The admin panel uses Firebase Authentication. Ensure your Firebase rules allow authenticated admin users to access the necessary collections.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## API & Database

This project uses Firebase Firestore for data storage. Collections include:

- `appointments` - Appointment bookings organized by date
- `users` - User information
- `staff` - Staff members
- `services` - Service catalog
- `content` - Website content management
- `newsletter` - Newsletter subscriptions

## Troubleshooting

### Port already in use
```bash
npm run dev -- --port 3000
```

### Firebase connection issues
- Verify `.env` variables
- Check Firestore security rules
- Ensure proper authentication setup

### Notification sounds not working
- Check browser console for errors
- Verify `public/sounds/` directory exists
- Check browser audio permissions
- Ensure notifications are not globally muted

## Performance Tips

- Use React DevTools to profile components
- Enable Vite's analyze plugin for bundle size
- Lazy load components and routes when possible

## Contributing Guidelines

1. Keep component files focused and single-purpose
2. Use TypeScript for type safety
3. Follow existing code style
4. Test changes locally before committing
5. Update documentation when adding features

## License

© 2025 Velvet Luxury Salon. All rights reserved.

## Support

For questions or issues, please contact the development team or refer to the main project documentation.
