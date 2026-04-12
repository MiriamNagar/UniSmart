import { ROUTES } from '@/constants/routes';
import { Redirect } from 'expo-router';

/**
 * Legacy entry from splash / deep links: Story 1.11 routes guests to the unified welcome screen.
 */
export default function StudentSessionRedirectScreen() {
  return <Redirect href={ROUTES.AUTH.WELCOME} />;
}
