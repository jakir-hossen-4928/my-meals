# Firebase Security Rules Deployment Guide

This document explains how to deploy the Firestore security rules for the Meal Tracker application.

## Prerequisites

1. Firebase CLI installed globally
2. Firebase project initialized in this directory
3. Authenticated with Firebase CLI

## Installation

If you haven't installed Firebase CLI yet:

```bash
npm install -g firebase-tools
```

## Login to Firebase

```bash
firebase login
```

## Initialize Firebase (if not already done)

```bash
firebase init
```

Select:
- Firestore
- Choose your existing project: `meal-tracker-40679`
- Accept default Firestore rules file location or specify `firestore.rules`

## Deploy Security Rules

To deploy only the Firestore security rules without deploying other resources:

```bash
firebase deploy --only firestore:rules
```

To deploy all Firebase resources:

```bash
firebase deploy
```

## Verify Deployment

After deployment, you can verify the rules in the Firebase Console:

1. Go to https://console.firebase.google.com/
2. Select your project: `meal-tracker-40679`
3. Navigate to Firestore Database > Rules
4. Verify the rules match the content in `firestore.rules`

## Security Rules Overview

The deployed rules provide:

### User Data Protection
- Users can only read/write their own data
- Profile data validation (types, sizes, ranges)
- Prevents unauthorized access to other users' data

### Meal Records
- Users can CRUD their own meal records
- Date format validation (YYYY-MM-DD)
- Boolean validation for meal status
- Support for custom meals via `customMeals` map

### Meal Configurations
- Users can manage their own meal configurations
- Timestamp validation for updates
- Supports custom meal times and costs

### Data Validation
- **groceryCost**: Must be a number
- **totalMembers**: Must be a number ≥ 1
- **mealsPerDay**: Must be a number between 1-10
- **displayName**: String with max 100 characters
- **profileImageUrl**: String with max 500 characters
- **mealTimes**: Must be a map object
- **perMealCost**: Must be a number ≥ 0

## Testing Rules

You can test the rules locally using the Firebase Emulator:

```bash
firebase emulators:start --only firestore
```

Then run your application against the local emulator by updating the Firebase configuration to use:

```javascript
if (location.hostname === "localhost") {
  connectFirestoreEmulator(db, "localhost", 8080);
}
```

## Troubleshooting

### Permission Denied Errors
- Ensure users are authenticated before accessing Firestore
- Verify the user UID matches the document path
- Check that data being written matches validation rules

### Rules Not Updating
- Clear browser cache
- Wait a few minutes for rules to propagate
- Verify deployment was successful in Firebase Console

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)
