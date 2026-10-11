export const GUEST_DISABLED_MESSAGE =
  'Guest access is currently disabled. Please sign in or create an account.';

export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign in again.';
    case 'auth/admin-restricted-operation':
    case 'auth/operation-not-allowed':
      return GUEST_DISABLED_MESSAGE;
    case 'auth/credential-already-in-use':
      return 'This email is already linked to another account. Please sign in with it instead.';
    case 'auth/provider-already-linked':
      return 'This guest session is already linked to an account.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled before it completed. Please try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in. Please contact the site administrator.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/app-not-authorized':
    case 'auth/configuration-not-found':
      return 'Sign-in is misconfigured on this site. Please contact the site administrator.';
    default:
      // Log only the error code (never credentials) so unexpected failures are diagnosable.
      console.warn('Unhandled Firebase auth error code:', errorCode || '(none)');
      return 'An unexpected authentication error occurred. Please try again.';
  }
}
