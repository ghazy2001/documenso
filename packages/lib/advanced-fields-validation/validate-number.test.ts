import { parseFormattedNumber, validateNumberField } from './validate-number';

describe('parseFormattedNumber', () => {
  it('parses numbers with comma as thousands separator and period as decimal', () => {
    expect(parseFormattedNumber('5,000', '123,456,789.00')).toBe(5000);
    expect(parseFormattedNumber('1,500.25', '123,456,789.00')).toBe(1500.25);
    expect(parseFormattedNumber('123,456,789.00', '123,456,789.00')).toBe(123456789);
  });

  it('parses numbers with period as thousands separator and comma as decimal', () => {
    expect(parseFormattedNumber('1.234,56', '123.456.789,00')).toBe(1234.56);
    expect(parseFormattedNumber('12,5', '123.456.789,00')).toBe(12.5);
    expect(parseFormattedNumber('123.456.789,00', '123.456.789,00')).toBe(123456789);
  });

  it('parses numbers with 123456,789.00 format', () => {
    expect(parseFormattedNumber('123456,789.00', '123456,789.00')).toBe(123456789);
  });

  it('falls back to standard parseFloat when no format is specified', () => {
    expect(parseFormattedNumber('500')).toBe(500);
    expect(parseFormattedNumber('0.75')).toBe(0.75);
    expect(parseFormattedNumber('')).toBeNaN();
  });
});

describe('validateNumberField', () => {
  it('enforces maxValue correctly with thousands separators in 123,456,789.00 format (#3456)', () => {
    const errorsExceeding = validateNumberField('5,000', {
      numberFormat: '123,456,789.00',
      maxValue: 1000,
    });
    expect(errorsExceeding).toContain('Value 5,000 is greater than the maximum value of 1000');

    const errorsWithin = validateNumberField('500', {
      numberFormat: '123,456,789.00',
      maxValue: 1000,
    });
    expect(errorsWithin).toHaveLength(0);
  });

  it('enforces minValue correctly with thousands separators in 123,456,789.00 format (#3456)', () => {
    const errorsValid = validateNumberField('1,500', {
      numberFormat: '123,456,789.00',
      minValue: 10,
    });
    expect(errorsValid).toHaveLength(0);

    const errorsBelow = validateNumberField('5', {
      numberFormat: '123,456,789.00',
      minValue: 10,
    });
    expect(errorsBelow).toContain('Value 5 is less than the minimum value of 10');
  });

  it('enforces min and max correctly in European 123.456.789,00 format', () => {
    const errorsExceeding = validateNumberField('1.234,56', {
      numberFormat: '123.456.789,00',
      maxValue: 1000,
    });
    expect(errorsExceeding).toContain('Value 1.234,56 is greater than the maximum value of 1000');

    const errorsValid = validateNumberField('12,5', {
      numberFormat: '123.456.789,00',
      minValue: 10,
      maxValue: 20,
    });
    expect(errorsValid).toHaveLength(0);
  });

  it('validates readOnly numbers correctly with thousands separators', () => {
    const errors = validateNumberField('1,000', {
      numberFormat: '123,456,789.00',
      readOnly: true,
    });
    expect(errors).toHaveLength(0);

    const errorsZero = validateNumberField('0', {
      readOnly: true,
    });
    expect(errorsZero).toContain('A read-only field must have a value greater than 0');
  });
});
