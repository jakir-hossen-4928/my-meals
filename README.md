# Meal Tracker - Hostel Meal Management System

A modern, dynamic web application for tracking hostel meals with customizable meal times, individual meal costs, and comprehensive expense management.

## 🌟 Features

### Dynamic Meal Configuration
- **Customizable Meal Times**: Set start and end times for each meal
- **Individual Meal Costs**: Track cost per meal for accurate expense calculation
- **Custom Meals**: Add unlimited custom meals (snacks, tea time, etc.)
- **Enable/Disable Meals**: Activate only the meals you need

### Meal Tracking
- **Daily Meal Logging**: Mark meals as taken/not taken for any date
- **Calendar Navigation**: View and edit meal history for any date
- **Progress Tracking**: Visual progress bars showing daily completion
- **Real-time Cost Calculation**: See daily costs based on meals consumed

### Profile & Settings
- **Profile Management**: Upload profile picture, set display name
- **Cost Calculator**: Calculate per-meal rates based on grocery costs and members
- **Meal Configuration**: Manage all meal settings in one place
- **Export Reports**: Generate PDF reports for any date range

### Security & Authentication
- **Secure Authentication**: Email/password authentication via Firebase
- **Data Protection**: Robust Firestore security rules
- **User Isolation**: Each user's data is completely isolated
- **Input Validation**: Server-side validation for all data

### Mobile-First Design
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Touch-Friendly**: Large touch targets for mobile devices
- **Progressive Web App**: Install on mobile home screen
- **Offline Support**: View cached data when offline

## 🚀 Getting Started

### Prerequisites

- Node.js v22.12.0 or higher
- npm or bun package manager
- Firebase account

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd meal-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Update `src/lib/firebase.ts` with your Firebase config
5. Deploy security rules (see below)

### Deploying Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules
```

For detailed instructions, see [FIREBASE_DEPLOYMENT.md](./FIREBASE_DEPLOYMENT.md)

## 📱 Usage

### Setting Up Your Profile

1. **Sign Up/Sign In**: Create an account or sign in
2. **Configure Meals**: Go to Profile → Meal Configuration
   - Set meal times (e.g., Breakfast: 7:00 AM - 9:00 AM)
   - Set individual meal costs
   - Add custom meals if needed
   - Save configuration
3. **Set Grocery Budget**: Enter monthly grocery cost and total members
4. **Upload Profile Picture**: Click the camera icon to upload

### Tracking Meals

1. **Select Date**: Use the calendar icon to pick a date
2. **Mark Meals**: Click on meal cards to mark as taken/not taken
3. **View Progress**: See daily progress and cost summary
4. **Review History**: Navigate to Meals page for historical data

### Generating Reports

1. Go to Profile → Export Report
2. Select date range (From - To)
3. Click "Export to PDF"
4. PDF will download with detailed meal history and statistics

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication + Firestore)
- **Routing**: React Router v6
- **State Management**: React Hooks
- **Form Handling**: React Hook Form + Zod
- **Date Handling**: date-fns
- **PDF Generation**: html2pdf.js
- **Animations**: Framer Motion

## 📂 Project Structure

```
meal-tracker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── BottomNav.tsx   # Bottom navigation
│   │   ├── MealConfigurator.tsx  # Meal configuration component
│   │   └── ProtectedRoute.tsx    # Route protection
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/                # Utilities and configurations
│   │   ├── firebase.ts     # Firebase configuration
│   │   └── utils.ts        # Helper functions
│   ├── pages/              # Page components
│   │   ├── Auth.tsx        # Authentication page
│   │   ├── Home.tsx        # Daily meal tracking
│   │   ├── Meals.tsx       # Meal history
│   │   ├── Profile.tsx     # User profile & settings
│   │   └── NotFound.tsx    # 404 page
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── firestore.rules         # Firestore security rules
├── FIREBASE_DEPLOYMENT.md  # Firebase deployment guide
└── package.json            # Dependencies
```

## 🔒 Security

The application implements comprehensive security measures:

- **Authentication Required**: All routes except login are protected
- **User Data Isolation**: Users can only access their own data
- **Input Validation**: Client and server-side validation
- **Type Safety**: TypeScript for compile-time type checking
- **Secure Rules**: Firestore security rules validate all operations

## 🎨 Features in Detail

### Meal Configurator
- Add/remove custom meals
- Set meal times with time pickers
- Configure individual meal costs
- Enable/disable meals as needed
- Real-time cost calculation
- Persistent storage in Firestore

### Dynamic Home Page
- Loads user's meal configuration
- Displays only enabled meals
- Shows meal times and costs
- Calculates daily cost based on meals taken
- Responsive grid layout
- Smooth animations and transitions

### Enhanced Profile
- Profile image upload (via ImgBB)
- Display name management
- Meal cost calculator
- Meal configuration section
- PDF report generation
- Date range selection for exports

## 📊 Data Models

### User Profile
```typescript
{
  groceryCost: number;
  totalMembers: number;
  mealsPerDay: number;
  profileImageUrl?: string;
  displayName?: string;
  updatedAt: string;
}
```

### Meal Configuration
```typescript
{
  id: string;
  name: string;
  enabled: boolean;
  startTime: string;  // HH:MM format
  endTime: string;    // HH:MM format
  cost: number;
}
```

### Meal Record
```typescript
{
  date: string;       // YYYY-MM-DD
  timestamp: string;
  [mealId: string]: boolean;  // Dynamic meal fields
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Links

- **Project URL**: https://lovable.dev/projects/a38f071a-b1d9-493c-aad3-ba8063c2df49
- **Firebase Console**: https://console.firebase.google.com/
- **Documentation**: See [FIREBASE_DEPLOYMENT.md](./FIREBASE_DEPLOYMENT.md)

## 💡 Tips

- Configure your meals once in Profile, then just track daily
- Use custom meals for snacks or special occasions
- Export monthly reports for expense tracking
- Set individual meal costs for accurate budgeting
- Enable only the meals you regularly consume

## 🐛 Troubleshooting

### Authentication Issues
- Clear browser cache and cookies
- Check Firebase console for authentication status
- Verify email/password requirements

### Data Not Saving
- Check browser console for errors
- Verify Firestore security rules are deployed
- Ensure you're authenticated

### PDF Export Not Working
- Check browser popup blocker settings
- Ensure date range has meal records
- Try a smaller date range if export is slow

## 📞 Support

For issues and questions:
1. Check existing documentation
2. Review Firebase console logs
3. Check browser console for errors
4. Open an issue on GitHub

---

Built with ❤️ using React, TypeScript, and Firebase
"# my-meals" 
# my-meals
