import { SHIP_REGISTRY, getShipIcon } from './constants';
import { describe, expect, it } from 'vitest';

describe('constants', () => {
  it('should return the correct icon for ships marked with rates (1st, 2nd, etc.)', () => {
    expect(getShipIcon('HMS Victory (1ST)')).toBe('rate1.png');
    expect(getShipIcon('Ingermanland (2ND)')).toBe('rate2.png');
    expect(getShipIcon('Poltava (3RD)')).toBe('rate3.png');
    expect(getShipIcon('Surprise (4TH)')).toBe('rate4.png');
    expect(getShipIcon('La Creole (5TH)')).toBe('rate5.png');
    expect(getShipIcon('Le Serf (6TH)')).toBe('rate6.png');
    expect(getShipIcon('Pickle (7TH)')).toBe('rate7.png');
  });

  it('should return the correct icon for ships found in SHIP_REGISTRY', () => {
    expect(getShipIcon('12 Apostolov')).toBe('rate1.png');
    expect(getShipIcon('Adventure')).toBe('rate2.png');
    expect(getShipIcon('Anson')).toBe('rate3.png');
    expect(getShipIcon('Essex')).toBe('rate4.png');
    expect(getShipIcon('San Martin')).toBe('rate5.png');
    expect(getShipIcon('Phoenix')).toBe('rate6.png');
    expect(getShipIcon('Horizont')).toBe('rate7.png');
  });

  it('should return "rate7.png" for unknown ships or null input', () => {
    expect(getShipIcon(null)).toBe('rate7.png');
    expect(getShipIcon('Unknown Ship')).toBe('rate7.png');
    expect(getShipIcon('')).toBe('rate7.png');
  });

  it('should have the expected rates in SHIP_REGISTRY', () => {
    expect(Object.keys(SHIP_REGISTRY)).toEqual(['Rate 1', 'Rate 2', 'Rate 3', 'Rate 4', 'Rate 5', 'Rate 6', 'Rate 7']);
  });
});
