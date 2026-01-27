# UI Tests

This directory contains UI tests for the React Native application, written using React Native Testing Library (the React Native equivalent of Espresso for Android).

## Test Files

### 1. `StudentLogin.test.tsx`
Tests the student login screen UI interactions:
- **Text Field Interactions**: Verifies that email and password text fields update correctly when users type
- **Button State**: Tests that the authenticate button becomes enabled when both email and password fields are filled
- **Navigation**: Verifies that pressing the authenticate button navigates to the planner screen

### 2. `WelcomeScreen.test.tsx`
Tests the welcome screen UI interactions:
- **Button Interactions**: Tests that both "Student Entrance" and "Admin Credentials" buttons are present and clickable
- **Navigation**: Verifies that button presses navigate to the correct screens based on the current mode (sign-in vs sign-up)
- **UI State**: Confirms that all expected UI elements (title, subtitle, buttons) are displayed correctly

## Running the Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm test -- --watch
```

To run a specific test file:
```bash
npm test -- StudentLogin.test.tsx
```

## Test Requirements Met

✅ **Test interactions with UI elements**: Both tests interact with buttons and text fields
✅ **Verify UI state after interaction**: Tests verify navigation occurs and button states change correctly

