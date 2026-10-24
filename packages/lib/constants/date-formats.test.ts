import { describe, expect, it } from 'vitest';

import {
  convertToLocalSystemFormat,
  dateFormatHasTime,
  DEFAULT_DOCUMENT_DATE_FORMAT,
} from './date-formats';
import { DEFAULT_DOCUMENT_TIME_ZONE } from './time-zones';

describe('dateFormatHasTime', () => {
  it('returns false for date-only formats', () => {
    expect(dateFormatHasTime('yyyy-MM-dd')).toBe(false);
    expect(dateFormatHasTime('dd/MM/yyyy')).toBe(false);
    expect(dateFormatHasTime('dd-MM-yyyy')).toBe(false);
    expect(dateFormatHasTime('MM/dd/yyyy')).toBe(false);
    expect(dateFormatHasTime('dd.MM.yyyy')).toBe(false);
    expect(dateFormatHasTime('yy-MM-dd')).toBe(false);
    expect(dateFormatHasTime('MMMM dd, yyyy')).toBe(false);
    expect(dateFormatHasTime('EEEE, MMMM dd, yyyy')).toBe(false);
  });

  it('returns true for formats containing time components', () => {
    expect(dateFormatHasTime(DEFAULT_DOCUMENT_DATE_FORMAT)).toBe(true);
    expect(dateFormatHasTime('yyyy-MM-dd HH:mm')).toBe(true);
    expect(dateFormatHasTime('dd/MM/yyyy hh:mm a')).toBe(true);
    expect(dateFormatHasTime('dd/MM/yyyy HH:mm')).toBe(true);
    expect(dateFormatHasTime('dd-MM-yyyy hh:mm a')).toBe(true);
    expect(dateFormatHasTime('dd-MM-yyyy HH:mm')).toBe(true);
    expect(dateFormatHasTime('MM/dd/yyyy hh:mm a')).toBe(true);
    expect(dateFormatHasTime('MM/dd/yyyy HH:mm')).toBe(true);
    expect(dateFormatHasTime('dd.MM.yyyy HH:mm')).toBe(true);
    expect(dateFormatHasTime('yyyy-MM-dd HH:mm:ss')).toBe(true);
    expect(dateFormatHasTime("yyyy-MM-dd'T'HH:mm:ss.SSSXXX")).toBe(true);
  });

  it('ignores single-quoted literal tokens', () => {
    expect(dateFormatHasTime("MM/dd/yyyy 'at'")).toBe(false);
    expect(dateFormatHasTime("yyyy-MM-dd 'hours'")).toBe(false);
    expect(dateFormatHasTime("MM/dd/yyyy 'at' HH:mm")).toBe(true);
  });
});

describe('convertToLocalSystemFormat', () => {
  it('preserves calendar date for date-only formats without shifting across timezones', () => {
    // A document signed on October 20, 2026 in UTC should display as October 20, 2026
    // regardless of the viewer's local timezone (e.g. America/Chicago, America/New_York)
    const result = convertToLocalSystemFormat('10/20/2026', 'MM/dd/yyyy', 'Etc/UTC');
    expect(result).toBe('10/20/2026');

    expect(convertToLocalSystemFormat('2026-10-20', 'yyyy-MM-dd', 'Etc/UTC')).toBe('2026-10-20');
    expect(convertToLocalSystemFormat('20/10/2026', 'dd/MM/yyyy', 'Etc/UTC')).toBe('20/10/2026');
    expect(convertToLocalSystemFormat('20.10.2026', 'dd.MM.yyyy', 'Etc/UTC')).toBe('20.10.2026');
    expect(convertToLocalSystemFormat('October 20, 2026', 'MMMM dd, yyyy', 'Etc/UTC')).toBe(
      'October 20, 2026',
    );
  });

  it('returns "Invalid date" for unparseable input', () => {
    expect(convertToLocalSystemFormat('not-a-date', 'MM/dd/yyyy', DEFAULT_DOCUMENT_TIME_ZONE)).toBe(
      'Invalid date',
    );
    expect(convertToLocalSystemFormat('', 'MM/dd/yyyy', DEFAULT_DOCUMENT_TIME_ZONE)).toBe(
      'Invalid date',
    );
  });

  it('uses default date format and timezone when null or undefined are passed', () => {
    expect(convertToLocalSystemFormat('invalid', null, null)).toBe('Invalid date');
  });
});
