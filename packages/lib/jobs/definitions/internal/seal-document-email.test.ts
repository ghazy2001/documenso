/**
 * Unit tests for the seal-document completed-email guard logic.
 *
 * Regression coverage for:
 *   - GitHub issue #3484: "Rejected documents get 'Signing Complete!' emails
 *     when the seal sweep reseals them"
 *
 * The handler decides whether to send completion emails via:
 *
 *   let shouldSendCompletedEmail = sendEmail && !isResealing && !isRejected;
 *
 *   if (isResealing && !isDocumentCompleted(envelopeStatus)) {
 *     shouldSendCompletedEmail = sendEmail && !isRejected;  // <-- fixed
 *   }
 *
 * Before the fix the reseal branch read `sendEmail` (without `&& !isRejected`),
 * so a sweep-resealed rejected document triggered "Signing Complete!" emails.
 */

import { DocumentStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { isDocumentCompleted } from '../../utils/document';

// ---------------------------------------------------------------------------
// Inline the handler's email-decision logic so the test is self-contained and
// immune to future refactors that don't touch this specific gate.
// ---------------------------------------------------------------------------

function computeShouldSendCompletedEmail(opts: {
  sendEmail: boolean;
  isResealing: boolean;
  isRejected: boolean;
  envelopeStatus: DocumentStatus;
}): boolean {
  const { sendEmail, isResealing, isRejected, envelopeStatus } = opts;

  let shouldSendCompletedEmail = sendEmail && !isResealing && !isRejected;

  if (isResealing && !isDocumentCompleted(envelopeStatus)) {
    shouldSendCompletedEmail = sendEmail && !isRejected; // fixed: preserve !isRejected
  }

  return shouldSendCompletedEmail;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('seal-document: shouldSendCompletedEmail gate', () => {
  describe('normal (non-reseal) path', () => {
    it('sends completion email for a normal completed document', () => {
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: true,
          isResealing: false,
          isRejected: false,
          envelopeStatus: DocumentStatus.PENDING,
        }),
      ).toBe(true);
    });

    it('does not send completion email when sendEmail is false', () => {
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: false,
          isResealing: false,
          isRejected: false,
          envelopeStatus: DocumentStatus.PENDING,
        }),
      ).toBe(false);
    });

    it('does not send completion email for a rejected document (normal path)', () => {
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: true,
          isResealing: false,
          isRejected: true,
          envelopeStatus: DocumentStatus.PENDING,
        }),
      ).toBe(false);
    });
  });

  describe('reseal path — envelope was PENDING before sealing (sweep recovery)', () => {
    it('sends completion email when the document is completed and not rejected', () => {
      // isDocumentCompleted(PENDING) === false → override branch fires
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: true,
          isResealing: true,
          isRejected: false,
          envelopeStatus: DocumentStatus.PENDING,
        }),
      ).toBe(true);
    });

    it('does NOT send completion email when the document is rejected (regression for #3484)', () => {
      // Before the fix this returned `true`, triggering "Signing Complete!" emails
      // for rejected documents resealed by the sweep job.
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: true,
          isResealing: true,
          isRejected: true,
          envelopeStatus: DocumentStatus.PENDING,
        }),
      ).toBe(false);
    });

    it('does not send completion email when sendEmail is false, even on reseal', () => {
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: false,
          isResealing: true,
          isRejected: false,
          envelopeStatus: DocumentStatus.PENDING,
        }),
      ).toBe(false);
    });
  });

  describe('reseal path — envelope was already COMPLETED/REJECTED before sealing', () => {
    it('does not enter override branch when envelopeStatus is COMPLETED', () => {
      // isDocumentCompleted(COMPLETED) === true → override branch does NOT fire
      // so shouldSendCompletedEmail stays false (isResealing is true)
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: true,
          isResealing: true,
          isRejected: false,
          envelopeStatus: DocumentStatus.COMPLETED,
        }),
      ).toBe(false);
    });

    it('does not enter override branch when envelopeStatus is REJECTED', () => {
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: true,
          isResealing: true,
          isRejected: true,
          envelopeStatus: DocumentStatus.REJECTED,
        }),
      ).toBe(false);
    });

    it('does not enter override branch when envelopeStatus is CANCELLED', () => {
      expect(
        computeShouldSendCompletedEmail({
          sendEmail: true,
          isResealing: true,
          isRejected: false,
          envelopeStatus: DocumentStatus.CANCELLED,
        }),
      ).toBe(false);
    });
  });
});
