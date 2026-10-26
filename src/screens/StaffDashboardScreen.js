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
import CustomPicker from '../components/CustomPicker';

const STAT_CARDS = [
  { key: 'total',       label: 'Total Assigned',       emoji: '📋', color: '#007bff' },
  { key: 'inProgress',  label: 'In-Progress', emoji: '🔧', color: '#6f42c1' },
  { key: 'verificationPending', label: 'Verifying', emoji: '👀', color: '#e83e8c' },
  { key: 'completed',   label: 'Completed',   emoji: '✅', color: '#28a745' },
];

const StaffDashboardScreen = ({ route, navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const staffIdParam = route?.params?.staffId;
  const staffName = route?.params?.staffName;

  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(staffIdParam || '');

  const isSuperAdmin = user?.role === 'SuperAdmin' || user?.role === 'HOD';

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const targetStaff = isSuperAdmin ? selectedStaff : (user?.id || user?._id);
      const endpoint = targetStaff ? `/complaints/dashboard?staffId=${targetStaff}` : '/complaints/dashboard';
      const res = await api.get(endpoint);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStaff, isSuperAdmin, user]);

  const fetchStaffList = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await api.get('/masters/users?role=Staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff list', err);
    }
  }, [isSuperAdmin]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      fetchStaffList();
    }, [fetchDashboard, fetchStaffList])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading && !stats.total && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading staff dashboard…</Text>
      </View>
    );
  }

  const staffItems = [{ label: 'My Dashboard (If Staff)', value: '' }, ...staffList.map((s) => ({ label: s.username || s.name, value: s._id || s.id }))];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeBanner}>
          {isSuperAdmin && (staffName || selectedStaff) ? (
            <>
              <Text style={styles.welcomeTitle}>Dashboard for</Text>
              <Text style={styles.welcomeName}>{staffName || staffItems.find(s => s.value === selectedStaff)?.label || 'Staff'}</Text>
              <Text style={styles.welcomeRole}>Staff Member</Text>
            </>
          ) : (
            <>
              <Text style={styles.welcomeTitle}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{user?.username || 'Staff'} 👋</Text>
              <Text style={styles.welcomeRole}>{user?.role || 'Staff Member'}</Text>
            </>
          )}
        </View>

        {isSuperAdmin && !staffIdParam && (
          <View style={styles.pickerContainer}>
            <CustomPicker
              label="Select Staff Member"
              placeholder="Select Staff"
              items={staffItems}
              value={selectedStaff}
              onChange={(val) => {
                setSelectedStaff(val);
                setLoading(true);
              }}
            />
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>My Tasks Overview</Text>
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={[styles.statCard, { borderTopColor: card.color }]}
              onPress={() => navigation.navigate('ComplaintList', { 
                initialFilter: card.key === 'total' ? 'All' : (card.key === 'verificationPending' ? 'Verification Pending' : card.label),
                staffFilterId: isSuperAdmin ? selectedStaff : (user?.id || user?._id)
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

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#17a2b8' }]}
            onPress={() => navigation.navigate('ComplaintList', { staffFilterId: isSuperAdmin ? selectedStaff : (user?.id || user?._id) })}
          >
            <Text style={styles.actionBtnEmoji}>📋</Text>
            <Text style={styles.actionBtnText}>View My Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#dc3545' }]}
            onPress={() => {
              if (logout) logout();
            }}
          >
            <Text style={styles.actionBtnEmoji}>🚪</Text>
            <Text style={styles.actionBtnText}>Logout</Text>
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
  pickerContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    width: '48%', // Fits 2 cards per row
    marginBottom: 12,
    alignItems: 'center',
    borderTopWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statCount: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2, fontWeight: '500', textAlign: 'center' },
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

export default StaffDashboardScreen;
