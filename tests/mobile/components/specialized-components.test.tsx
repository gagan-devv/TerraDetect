import React from 'react';
import { render } from '@testing-library/react-native';
import { SensorChip, HealthMeter, StatCard } from '../../../mobile/components';

describe('Specialized Components', () => {
  describe('SensorChip', () => {
    it('renders with soil type', () => {
      const { getByText } = render(
        <SensorChip label="pH" type="soil" value="6.5" />
      );
      expect(getByText('pH: 6.5')).toBeTruthy();
    });

    it('renders with weather type', () => {
      const { getByText } = render(
        <SensorChip label="Temp" type="weather" value="25°C" />
      );
      expect(getByText('Temp: 25°C')).toBeTruthy();
    });

    it('renders with nutrient type', () => {
      const { getByText } = render(
        <SensorChip label="Nitrogen" type="nutrient" value="45 mg/kg" />
      );
      expect(getByText('Nitrogen: 45 mg/kg')).toBeTruthy();
    });
  });

  describe('HealthMeter', () => {
    it('renders with pH scale values', () => {
      const { getByText } = render(
        <HealthMeter
          value={6.5}
          min={0}
          max={14}
          optimal={[6.0, 7.5]}
          label="pH Level"
        />
      );
      expect(getByText('pH Level')).toBeTruthy();
      expect(getByText('6.5')).toBeTruthy();
      expect(getByText('Optimal: 6-7.5')).toBeTruthy();
    });

    it('renders with custom range', () => {
      const { getByText } = render(
        <HealthMeter
          value={50}
          min={0}
          max={100}
          optimal={[40, 60]}
          label="Humidity"
        />
      );
      expect(getByText('Humidity')).toBeTruthy();
      expect(getByText('50.0')).toBeTruthy();
    });
  });

  describe('StatCard', () => {
    it('renders with all required elements', () => {
      const { getByText } = render(
        <StatCard
          label="Temperature"
          value="25°C"
          icon="🌡️"
          color="orange"
        />
      );
      expect(getByText('TEMPERATURE')).toBeTruthy();
      expect(getByText('25°C')).toBeTruthy();
      expect(getByText('🌡️')).toBeTruthy();
    });

    it('renders with trend indicator', () => {
      const { getByText } = render(
        <StatCard
          label="Humidity"
          value="65%"
          icon="💧"
          color="blue"
          trend="+2.1%"
        />
      );
      expect(getByText('HUMIDITY')).toBeTruthy();
      expect(getByText('65%')).toBeTruthy();
      expect(getByText('+2.1%')).toBeTruthy();
    });

    it('renders all color variants', () => {
      const colors: Array<'orange' | 'blue' | 'green' | 'purple' | 'amber'> = [
        'orange',
        'blue',
        'green',
        'purple',
        'amber',
      ];

      colors.forEach((color) => {
        const { getByText } = render(
          <StatCard label="Test" value="100" icon="✓" color={color} />
        );
        expect(getByText('TEST')).toBeTruthy();
      });
    });
  });
});
