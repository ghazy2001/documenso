import { describe, expect, it } from 'vitest';

import { shouldAutoRedirectToOidc } from './oidc-auto-redirect';

describe('shouldAutoRedirectToOidc', () => {
  it('allows auto-redirect when OIDC is only transport, redirect is enabled, and no error is present', () => {
    expect(
      shouldAutoRedirectToOidc({
        isOIDCOnlyTransport: true,
        isOIDCAutoRedirectDisabled: false,
        hasError: false,
      }),
    ).toBe(true);
  });

  it('suppresses auto-redirect when an error is present in the URL', () => {
    expect(
      shouldAutoRedirectToOidc({
        isOIDCOnlyTransport: true,
        isOIDCAutoRedirectDisabled: false,
        hasError: true,
      }),
    ).toBe(false);
  });

  it('suppresses auto-redirect when the opt-out flag is enabled', () => {
    expect(
      shouldAutoRedirectToOidc({
        isOIDCOnlyTransport: true,
        isOIDCAutoRedirectDisabled: true,
        hasError: false,
      }),
    ).toBe(false);
  });

  it('suppresses auto-redirect when OIDC is not the sole enabled transport', () => {
    expect(
      shouldAutoRedirectToOidc({
        isOIDCOnlyTransport: false,
        isOIDCAutoRedirectDisabled: false,
        hasError: false,
      }),
    ).toBe(false);
  });

  it('suppresses auto-redirect when both opt-out and error are present', () => {
    expect(
      shouldAutoRedirectToOidc({
        isOIDCOnlyTransport: true,
        isOIDCAutoRedirectDisabled: true,
        hasError: true,
      }),
    ).toBe(false);
  });
});
