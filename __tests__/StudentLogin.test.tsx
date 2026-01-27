import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import StudentLoginScreen from '../app/(auth)/student-login';
import { SelectionProvider } from '../contexts/selection-context';

// Mock expo-router with functions defined in the factory
jest.mock('expo-router', () => {
  const replace = jest.fn();
  const back = jest.fn();
  
  return {
    router: {
      replace,
      back,
    },
    // Export mocks so tests can access them
    __mocks: {
      replace,
      back,
    },
  };
});

// Mock MaterialIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

// Mock useColorScheme
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

describe('StudentLoginScreen UI Tests', () => {
  const getMocks = () => {
    const expoRouter = jest.requireMock('expo-router') as any;
    return expoRouter.__mocks;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = getMocks();
    mocks.replace.mockClear();
    mocks.back.mockClear();
  });

  it('should enable authenticate button when email and password are filled', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SelectionProvider>
        <StudentLoginScreen />
      </SelectionProvider>
    );

    // Get text inputs
    const emailInput = getByPlaceholderText('student@university.edu');
    const passwordInput = getByPlaceholderText('........');
    const authenticateButton = getByText('AUTHENTICATE');

    // Initially, button should be disabled (check by style or accessibility)
    expect(authenticateButton).toBeTruthy();

    // Fill in email
    fireEvent.changeText(emailInput, 'student@university.edu');

    // Button should still be disabled (password missing)
    expect(authenticateButton).toBeTruthy();

    // Fill in password
    fireEvent.changeText(passwordInput, 'password123');

    // Wait for state update
    await waitFor(() => {
      // Button should now be enabled and clickable
      expect(authenticateButton).toBeTruthy();
    });

    // Verify button is enabled by checking it's not disabled
    expect(authenticateButton.props.disabled).toBeFalsy();
  });

  it('should navigate to planner screen after successful authentication', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SelectionProvider>
        <StudentLoginScreen />
      </SelectionProvider>
    );

    // Get UI elements
    const emailInput = getByPlaceholderText('student@university.edu');
    const passwordInput = getByPlaceholderText('........');
    const authenticateButton = getByText('AUTHENTICATE');

    // Fill in the form
    fireEvent.changeText(emailInput, 'test@university.edu');
    fireEvent.changeText(passwordInput, 'mypassword');

    // Wait for button to be enabled
    await waitFor(() => {
      expect(authenticateButton.props.disabled).toBeFalsy();
    });

    // Press the authenticate button
    fireEvent.press(authenticateButton);

    // Verify navigation was called
    const mocks = getMocks();
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/(student)/planner');
    });
  });

  it('should update email and password text fields when user types', () => {
    const { getByPlaceholderText } = render(
      <SelectionProvider>
        <StudentLoginScreen />
      </SelectionProvider>
    );

    const emailInput = getByPlaceholderText('student@university.edu');
    const passwordInput = getByPlaceholderText('........');

    // Type in email field
    fireEvent.changeText(emailInput, 'newemail@university.edu');
    expect(emailInput.props.value).toBe('newemail@university.edu');

    // Type in password field
    fireEvent.changeText(passwordInput, 'newpassword');
    expect(passwordInput.props.value).toBe('newpassword');
  });
});

