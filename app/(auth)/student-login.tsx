import { Redirect } from 'expo-router';
import { useStudentLoginViewModel } from '@/view-models/use-student-login-view-model';

/** Legacy route: unified sign-in resolves home from Firestore `role`. */
export default function StudentLoginRedirectScreen() {
  const { redirectHref } = useStudentLoginViewModel();
  return <Redirect href={redirectHref} />;
}
