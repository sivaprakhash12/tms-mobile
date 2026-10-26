import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STAT_CARDS = [
  { key: 'total',       label: 'Total',       emoji: '📊', color: '#007bff' },
  { key: 'pending',     label: 'Pending',     emoji: '⏳', color: '#fd7e14' },
  { key: 'assigned',    label: 'Assigned',    emoji: '👤', color: '#17a2b8' },
  { key: 'inProgress',  label: 'In-Progress', emoji: '🔧', color: '#6f42c1' },
  { key: 'onHold',      label: 'On-Hold',     emoji: '⏸',  color: '#dc3545' },
  { key: 'completed',   label: 'Completed',   emoji: '✅', color: '#28a745' },
  { key: 'incomplete',  label: 'Incomplete',  emoji: '❌', color: '#c0392b' },
];

const DashboardScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const staffId = route?.params?.staffId;
  const staffName = route?.params?.staffName;

  const fetchDashboard = async () => {
    try {
      setError('');
      const endpoint = staffId ? `/complaints/dashboard?staffId=${staffId}` : '/complaints/dashboard';
      const res = await api.get(endpoint);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          {staffName ? (
            <>
              <Text style={styles.welcomeTitle}>Dashboard for</Text>
              <Text style={styles.welcomeName}>{staffName}</Text>
              <Text style={styles.welcomeRole}>Staff Member</Text>
            </>
          ) : (
            <>
              <Text style={styles.welcomeTitle}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{user?.username || 'User'} 👋</Text>
              <Text style={styles.welcomeRole}>{user?.role}</Text>
            </>
          )}
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {/* Stat Cards Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={[styles.statCard, { borderTopColor: card.color }]}
              onPress={() => navigation.navigate('ComplaintList', { 
                initialFilter: card.key === 'total' ? 'All' : (card.key === 'verificationPending' ? 'Verification Pending' : card.label),
                staffFilterId: staffId 
              })}
            >
              <Text style={styles.statEmoji}>{card.emoji}</Text>
              <Text style={[styles.statCount, { color: card.color }]}>
                {stats[card.key] ?? 0}
              </Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#007bff' }]}
            onPress={() => navigation.navigate('RaiseComplaint')}
          >
            <Text style={styles.actionBtnEmoji}>📝</Text>
            <Text style={styles.actionBtnText}>Raise Complaint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#17a2b8' }]}
            onPress={() => navigation.navigate('ComplaintList', { staffFilterId: staffId })}
          >
            <Text style={styles.actionBtnEmoji}>📋</Text>
            <Text style={styles.actionBtnText}>View Complaints</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  container: { padding: 16, paddingBottom: 32 },
  welcomeBanner: {
    backgroundColor: '#007bff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  welcomeTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  welcomeName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginVertical: 2 },
  welcomeRole: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: { color: '#c0392b', fontSize: 14 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderTopWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statEmoji: { fontSize: 28, marginBottom: 6 },
  statCount: { fontSize: 32, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 2, fontWeight: '500' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionBtnEmoji: { fontSize: 28, marginBottom: 6 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
});

export default DashboardScreen;
