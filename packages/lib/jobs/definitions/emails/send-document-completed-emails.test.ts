import { describe, expect, it } from 'vitest';

import { getCompletedDocumentAttachmentFileName } from './send-document-completed-emails.handler';

describe('getCompletedDocumentAttachmentFileName', () => {
  describe('internalVersion 2 (envelope items)', () => {
    it('does not duplicate .pdf extension when envelopeItem.title already ends with .pdf', () => {
      const envelope = { internalVersion: 2, title: 'Envelope Title' };
      const envelopeItem = { title: 'contract.pdf' };

      expect(getCompletedDocumentAttachmentFileName(envelope, envelopeItem)).toBe('contract.pdf');
    });

    it('appends .pdf when envelopeItem.title lacks .pdf extension', () => {
      const envelope = { internalVersion: 2, title: 'Envelope Title' };
      const envelopeItem = { title: 'contract' };

      expect(getCompletedDocumentAttachmentFileName(envelope, envelopeItem)).toBe('contract.pdf');
    });

    it('handles titles with multiple dots correctly', () => {
      const envelope = { internalVersion: 2, title: 'Envelope Title' };
      const envelopeItemWithExt = { title: 'annual.report.2026.pdf' };
      const envelopeItemWithoutExt = { title: 'annual.report.2026' };

      expect(getCompletedDocumentAttachmentFileName(envelope, envelopeItemWithExt)).toBe('annual.report.2026.pdf');
      expect(getCompletedDocumentAttachmentFileName(envelope, envelopeItemWithoutExt)).toBe('annual.report.2026.pdf');
    });
  });

  describe('internalVersion 1 (legacy envelope title)', () => {
    it('uses envelope.title and preserves existing .pdf extension', () => {
      const envelope = { internalVersion: 1, title: 'legacy-agreement.pdf' };
      const envelopeItem = { title: 'ignored-item-title.pdf' };

      expect(getCompletedDocumentAttachmentFileName(envelope, envelopeItem)).toBe('legacy-agreement.pdf');
    });

    it('uses envelope.title and appends .pdf if missing', () => {
      const envelope = { internalVersion: 1, title: 'legacy-agreement' };
      const envelopeItem = { title: 'ignored-item-title' };

      expect(getCompletedDocumentAttachmentFileName(envelope, envelopeItem)).toBe('legacy-agreement.pdf');
    });
  });
});
