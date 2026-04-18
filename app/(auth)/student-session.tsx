import { Redirect } from 'expo-router';
import { useStudentSessionViewModel } from '@/view-models/use-student-session-view-model';

/**
 * Legacy entry from splash / deep links: Story 1.11 routes guests to the unified welcome screen.
 */
export default function StudentSessionRedirectScreen() {
  const { redirectHref } = useStudentSessionViewModel();
  return <Redirect href={redirectHref} />;
}
