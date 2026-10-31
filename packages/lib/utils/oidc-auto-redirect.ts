export type ShouldAutoRedirectToOidcOptions = {
  isOIDCOnlyTransport: boolean;
  isOIDCAutoRedirectDisabled: boolean;
  hasError: boolean;
};

/**
 * Determine whether the sign-in page should automatically redirect to the OIDC provider.
 *
 * Automatic redirect only occurs when OIDC is the sole enabled transport, the opt-out
 * environment variable is not set, and there are no authentication errors (such as SIGNUP_DISABLED)
 * present in the URL query parameters.
 */
export const shouldAutoRedirectToOidc = ({
  isOIDCOnlyTransport,
  isOIDCAutoRedirectDisabled,
  hasError,
}: ShouldAutoRedirectToOidcOptions): boolean => {
  return isOIDCOnlyTransport && !isOIDCAutoRedirectDisabled && !hasError;
};
