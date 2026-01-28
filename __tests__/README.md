# UI Tests

This directory contains UI tests for the React Native application, written using React Native Testing Library (the React Native equivalent of Espresso for Android).

## Test Files

### 1. `StudentLogin.test.tsx`

Tests the student login screen UI interactions:

- **Text Field Interactions**: Verifies that email and password text fields update correctly when users type
- **Button State**: Tests that the authenticate button becomes enabled when both email and password fields are filled
- **Navigation**: Verifies that pressing the authenticate button navigates to the planner screen

#### Example-style explanation (like the assignment)

TypeScript

```ts
it('should enable authenticate button when email and password are filled', async () => {
  const { getByPlaceholderText, getByText } = render(
    <SelectionProvider>
      <StudentLoginScreen />
    </SelectionProvider>
  );

  const emailInput = getByPlaceholderText('student@university.edu');
  const passwordInput = getByPlaceholderText('........');
  const authenticateButton = getByText('AUTHENTICATE');

  fireEvent.changeText(emailInput, 'student@university.edu');
  fireEvent.changeText(passwordInput, 'password123');

  await waitFor(() => {
    expect(authenticateButton.props.disabled).toBeFalsy();
  });
});
```

**Explanation**

- **Simulated Login Form**: This test simulates filling in the email and password fields on the `StudentLoginScreen`.
- **Interaction**: It performs text input actions on both fields.
- **Verification**: Finally, it checks that the "AUTHENTICATE" button becomes enabled (`disabled === false`) when both fields are filled.

### 2. `WelcomeScreen.test.tsx`

Tests the welcome screen UI interactions:

- **Button Interactions**: Tests that both "Student Entrance" and "Admin Credentials" buttons are present and clickable
- **Navigation**: Verifies that button presses navigate to the correct screens based on the current mode (sign-in vs sign-up)
- **UI State**: Confirms that all expected UI elements (title, subtitle, buttons) are displayed correctly

#### Example-style explanation (like the assignment)

TypeScript

```ts
it('should navigate to student login when Student Entrance button is pressed in sign-in mode', async () => {
  const mocks = getMocks();
  mocks.useLocalSearchParams.mockReturnValue({ mode: 'signin' });

  const { getByText } = render(<WelcomeScreen />);

  const studentButton = getByText('Student Entrance');
  fireEvent.press(studentButton);

  await waitFor(() => {
    expect(mocks.push).toHaveBeenCalledWith('/(auth)/student-login');
  });
});
```

**Explanation**

- **Simulated Navigation Flow**: This test simulates the user flow from the `WelcomeScreen` in **sign-in** mode.
- **Interaction**: It presses the "Student Entrance" button.
- **Verification**: It checks that the mocked router `push` function was called with the student login route (`'/(auth)/student-login'`).

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

- **Test interactions with UI elements**: Both tests interact with buttons and text fields  
- **Verify UI state after interaction**: Tests verify navigation occurs and button states change correctly
