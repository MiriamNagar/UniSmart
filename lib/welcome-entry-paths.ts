import { ROUTES } from '@/constants/routes';
import type { Href } from 'expo-router';

/** Stable targets for the guest welcome screen (Story 1.11 + unified auth entry). */
export function getWelcomeEntryHrefs(): {
  signIn: Href;
  createAccount: Href;
} {
  return {
    signIn: ROUTES.AUTH.SIGN_IN,
    createAccount: ROUTES.AUTH.CREATE_ACCOUNT,
  };
}
