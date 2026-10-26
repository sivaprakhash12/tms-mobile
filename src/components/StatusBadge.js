import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG = {
  Pending:     { bg: '#fff3e0', text: '#e65100', border: '#ff9800' },
  Assigned:    { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' },
  'In-Progress': { bg: '#f3e5f5', text: '#6a1b9a', border: '#9c27b0' },
  'On-Hold':   { bg: '#fdecea', text: '#c62828', border: '#f44336' },
  'Verification Pending': { bg: '#e0f7fa', text: '#006064', border: '#00acc1' },
  'User Feedback Pending': { bg: '#fff8e1', text: '#ff6f00', border: '#ffb300' },
  Completed:   { bg: '#e8f5e9', text: '#1b5e20', border: '#4caf50' },
  Incomplete:  { bg: '#ffebee', text: '#b71c1c', border: '#e53935' },
};

/**
 * StatusBadge - Displays a color-coded badge for complaint status.
 * Props:
 *  - status: string — one of Pending, Assigned, In-Progress, On-Hold, Completed
 */
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { bg: '#f5f5f5', text: '#666', border: '#ccc' };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{status || 'Unknown'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default StatusBadge;
