import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WelcomeScreen from '../app/(auth)/welcome';

// Mock expo-router with functions defined in the factory
jest.mock('expo-router', () => {
  const push = jest.fn();
  const replace = jest.fn();
  const back = jest.fn();
  const useLocalSearchParams = jest.fn(() => ({}));
  
  return {
    router: {
      push,
      replace,
      back,
    },
    useLocalSearchParams,
    // Export mocks so tests can access them
    __mocks: {
      push,
      replace,
      back,
      useLocalSearchParams,
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

describe('WelcomeScreen UI Tests', () => {
  const getMocks = () => {
    const expoRouter = jest.requireMock('expo-router') as any;
    return expoRouter.__mocks;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = getMocks();
    mocks.push.mockClear();
    mocks.replace.mockClear();
    mocks.back.mockClear();
    mocks.useLocalSearchParams.mockReturnValue({});
  });

  it('should navigate to student login when Student Entrance button is pressed in sign-in mode', async () => {
    const mocks = getMocks();
    // Set up sign-in mode
    mocks.useLocalSearchParams.mockReturnValue({ mode: 'signin' });

    const { getByText } = render(<WelcomeScreen />);

    // Find and press the Student Entrance button
    const studentButton = getByText('Student Entrance');
    expect(studentButton).toBeTruthy();

    fireEvent.press(studentButton);

    // Verify navigation to student login
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/(auth)/student-login');
    });
  });

  it('should navigate to new member screen when Student Entrance button is pressed in sign-up mode', async () => {
    const mocks = getMocks();
    // Set up sign-up mode (no mode param or mode !== 'signin')
    mocks.useLocalSearchParams.mockReturnValue({});

    const { getByText } = render(<WelcomeScreen />);

    // Find and press the Student Entrance button
    const studentButton = getByText('Student Entrance');
    expect(studentButton).toBeTruthy();

    fireEvent.press(studentButton);

    // Verify navigation to new member screen with student userType
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith({
        pathname: '/(auth)/new-member',
        params: { userType: 'student' },
      });
    });
  });

  it('should display correct UI elements on welcome screen', () => {
    const { getByText } = render(<WelcomeScreen />);

    // Verify title is displayed
    const title = getByText('Academic Portal');
    expect(title).toBeTruthy();

    // Verify subtitle is displayed
    const subtitle = getByText("Who's accessing the system today?");
    expect(subtitle).toBeTruthy();

    // Verify both buttons are displayed
    const studentButton = getByText('Student Entrance');
    const adminButton = getByText('Admin Credentials');

    expect(studentButton).toBeTruthy();
    expect(adminButton).toBeTruthy();
  });

  it('should navigate to admin login when Admin Credentials button is pressed in sign-in mode', async () => {
    const mocks = getMocks();
    // Set up sign-in mode
    mocks.useLocalSearchParams.mockReturnValue({ mode: 'signin' });

    const { getByText } = render(<WelcomeScreen />);

    // Find and press the Admin Credentials button
    const adminButton = getByText('Admin Credentials');
    expect(adminButton).toBeTruthy();

    fireEvent.press(adminButton);

    // Verify navigation to admin login
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/(auth)/admin-login');
    });
  });
});

