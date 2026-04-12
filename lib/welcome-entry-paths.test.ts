import { ROUTES } from '@/constants/routes';
import { getWelcomeEntryHrefs } from '@/lib/welcome-entry-paths';

describe('getWelcomeEntryHrefs', () => {
  it('maps guest entry to unified sign-in and create-account routes', () => {
    const paths = getWelcomeEntryHrefs();
    expect(paths.signIn).toBe(ROUTES.AUTH.SIGN_IN);
    expect(paths.createAccount).toBe(ROUTES.AUTH.CREATE_ACCOUNT);
  });
});
