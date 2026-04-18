import { Redirect } from 'expo-router';
import { useAdminLoginViewModel } from '@/view-models/use-admin-login-view-model';

/** Legacy route: unified sign-in resolves home from Firestore `role`. */
export default function AdminLoginRedirectScreen() {
  const { redirectHref } = useAdminLoginViewModel();
  return <Redirect href={redirectHref} />;
}
