import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import CustomPicker from '../components/CustomPicker';
import StatusBadge from '../components/StatusBadge';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Assigned', value: 'Assigned' },
  { label: 'In-Progress', value: 'In-Progress' },
  { label: 'On-Hold', value: 'On-Hold' },
  { label: 'Completed', value: 'Completed' },
];

const ReportScreen = ({ navigation }) => {
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const [filteredProgrammes, setFilteredProgrammes] = useState([]);

  const [filterDept, setFilterDept] = useState('');
  const [filterProg, setFilterProg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(true);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    setFetchingMeta(true);
    try {
      const [deptsRes, progsRes, staffRes] = await Promise.all([
        api.get('/masters/departments'),
        api.get('/masters/programmes'),
        api.get('/masters/users?role=Staff'),
      ]);
      setDepartments(deptsRes.data);
      setProgrammes(progsRes.data);
      setStaffList(staffRes.data);
    } catch (_) {
      setError('Failed to load filter options.');
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleDeptChange = (deptId) => {
    setFilterDept(deptId);
    setFilterProg('');
    setFilteredProgrammes(
      deptId
        ? programmes.filter((p) => {
            const pDeptId = p.department?._id || p.department?.id || p.department || p.departmentId || p.department_id;
            return String(pDeptId) === String(deptId);
          })
        : programmes
    );
  };

  const resetFilters = () => {
    setFilterDept('');
    setFilterProg('');
    setFilterStatus('');
    setFilterAssignee('');
    setFilteredProgrammes([]);
    setReports([]);
    setHasSearched(false);
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const params = {};
      if (filterDept) params.department = filterDept;
      if (filterProg) params.programme = filterProg;
      if (filterStatus) params.status = filterStatus;
      if (filterAssignee) params.assignee = filterAssignee;

      const res = await api.get('/complaints/reports', { params });
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${datePart}, ${hours}:${mins} ${ampm}`;
  };

  const deptItems = [{ label: 'All Departments', value: '' }, ...departments.map((d) => ({ label: d.name, value: d._id || d.id }))];
  const progItems = [{ label: 'All Programmes', value: '' }, ...(filteredProgrammes.length ? filteredProgrammes : programmes).map((p) => ({ label: p.name, value: p._id || p.id }))];
  const staffItems = [{ label: 'All Assignees', value: '' }, ...staffList.map((s) => ({ label: s.username || s.name, value: s._id || s.id }))];

  const renderReportItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[styles.reportRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
      onPress={() => navigation.navigate('ComplaintList')}
    >
      <Text style={[styles.rowCell, { width: 80 }]}>{formatDate(item.createdAt)}</Text>
      <Text style={[styles.rowCell, { width: 90 }]}>{item.user?.username || 'N/A'}</Text>
      <Text style={[styles.rowCell, { width: 100 }]}>{item.department?.name || 'N/A'}</Text>
      <Text style={[styles.rowCell, { width: 100 }]}>
        {`${item.block?.name || ''} - ${item.room?.roomNumber || ''}`}
      </Text>
      <Text style={[styles.rowCell, { width: 90 }]}>{item.assignedTo?.username || 'None'}</Text>
      <View style={[styles.rowCell, { width: 90 }]}>
        <StatusBadge status={item.status} />
      </View>
      <Text style={[styles.rowCell, { width: 120 }]} numberOfLines={2}>{item.staffMessage || 'N/A'}</Text>
    </TouchableOpacity>
  );

  if (fetchingMeta) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Reports</Text>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {/* Filters */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔍 Filters</Text>
          <CustomPicker label="Department" placeholder="All Departments" items={deptItems} value={filterDept} onChange={handleDeptChange} />
          <CustomPicker label="Programme" placeholder="All Programmes" items={progItems} value={filterProg} onChange={setFilterProg} />
          <CustomPicker label="Status" placeholder="All Statuses" items={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
          <CustomPicker label="Assignee" placeholder="All Assignees" items={staffItems} value={filterAssignee} onChange={setFilterAssignee} />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetBtnText}>↺ Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.generateBtn, loading && styles.btnDisabled]}
              onPress={generateReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.generateBtnText}>📊 Generate Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {reports.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Results ({reports.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                {/* Table Header */}
                <View style={[styles.reportRow, styles.tableHeader]}>
                  {['Date', 'User', 'Dept', 'Location', 'Assignee', 'Status', 'Staff Remarks'].map((h) => (
                    <Text key={h} style={[styles.headerCell, { width: h === 'Staff Remarks' ? 120 : h === 'Status' ? 90 : h === 'Location' ? 100 : 90 }]}>{h}</Text>
                  ))}
                </View>
                <FlatList
                  data={reports}
                  keyExtractor={(item) => String(item._id || item.id)}
                  renderItem={renderReportItem}
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          </View>
        )}

        {!loading && reports.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>{hasSearched ? 'No reports found matching these filters.' : 'Apply filters and generate a report.'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  errorBox: {
    backgroundColor: '#fdecea', borderRadius: 8, padding: 12, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: '#dc3545',
  },
  errorText: { color: '#c0392b', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  resetBtn: {
    flex: 1, backgroundColor: '#6c757d', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  resetBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  generateBtn: {
    flex: 2, backgroundColor: '#007bff', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#6aabf7' },
  generateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  resultsSection: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2 },
  tableHeader: { backgroundColor: '#007bff' },
  headerCell: {
    color: '#fff', fontWeight: 'bold', fontSize: 12, padding: 8, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.3)',
  },
  reportRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f8f9fa' },
  rowCell: { fontSize: 12, padding: 8, color: '#333', borderRightWidth: 1, borderRightColor: '#eee' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#999', textAlign: 'center' },
});

export default ReportScreen;
