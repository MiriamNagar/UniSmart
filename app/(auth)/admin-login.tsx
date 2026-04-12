import { ROUTES } from '@/constants/routes';
import { Redirect } from 'expo-router';

/** Legacy route: unified sign-in resolves home from Firestore `role`. */
export default function AdminLoginRedirectScreen() {
  return <Redirect href={ROUTES.AUTH.SIGN_IN} />;
}
