import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import CustomPicker from '../components/CustomPicker';

const ComplaintListScreen = ({ route, navigation }) => {
  const { user, logout, login } = useAuth();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isHOD = user?.role === 'HOD' || user?.role === 'Admin';
  const STAFF_ROLES = [
    'Staff', 'Networking Staff', 'Plumber', 'Electrician', 'Software Developer',
    'Library Staff', 'Cleaning Staff', 'Department Faculty Staff',
    'MSc Staff', 'MCA Staff', 'MSc Physics Staff'
  ];
  const isStaff = STAFF_ROLES.includes(user?.role);

  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState('');
  const [modalMode, setModalMode] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState({});

  const [addStaffModalVisible, setAddStaffModalVisible] = useState(false);


  const [newStaff, setNewStaff] = useState({ username: '', email: '', phoneNumber: '', password: '', role: 'Staff' });
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignComplaintId, setAssignComplaintId] = useState(null);
  const [assignMessage, setAssignMessage] = useState('');

  const fetchComplaints = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    if (!isSuperAdmin && !isHOD) return;
    try {
      const res = await api.get('/masters/users?role=Staff');
      setStaffList(res.data);
    } catch (_) {}
  }, [isSuperAdmin]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
      fetchStaff();
    }, [fetchComplaints, fetchStaff])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleAssign = async (complaintId, staffId) => {
    if (!staffId || !complaintId) return;
    setAssignModalVisible(false);
    setActionLoading(complaintId);
    try {
      await api.patch(`/complaints/assign/${complaintId}`, { staffId, assignMessage });
      fetchComplaints();
      Alert.alert('Success', 'Complaint assigned successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to assign complaint.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (complaintId, payload) => {
    setActionLoading(complaintId);
    try {
      await api.patch(`/complaints/status/${complaintId}`, payload);
      fetchComplaints();
      
      let successMsg = 'Report sent successfully!';
      if (payload.status === 'Verification Pending') {
        successMsg = 'Alert sent to Superadmin successfully!';
      } else if (['Completed', 'Incomplete', 'On-Hold', 'In-Progress'].includes(payload.status)) {
        successMsg = 'Alert sent to User successfully!';
      }
      
      Alert.alert(
        'Success',
        successMsg,
        [
          {
            text: 'OK',
            onPress: () => {
              if (isStaff) {
                navigation.navigate('Dashboard');
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const openStatusModal = (complaintId, targetStatus, defaultMessage = '', mode = '') => {
    setSelectedComplaintId(complaintId);
    setPendingStatusUpdate(targetStatus);
    setStatusMessage(defaultMessage);
    setModalMode(mode);
    setStatusModalVisible(true);
  };

  const submitStatusUpdate = () => {
    if (!pendingStatusUpdate) {
      Alert.alert('Validation', 'Please select an option from the dropdown.');
      return;
    }

    let finalStatus = pendingStatusUpdate;
    if (modalMode === 'staff') finalStatus = 'Verification Pending';

    const isUserRole = !isSuperAdmin && !isHOD && !isStaff;
    
    if (!statusMessage.trim() && !isUserRole) {
      Alert.alert('Validation', 'Please enter a message for the user/admin.');
      return;
    }
    setStatusModalVisible(false);
    
    const payload = { status: finalStatus };
    
    if (modalMode === 'staff') {
      payload.staffMessage = `[${pendingStatusUpdate}] ${statusMessage.trim()}`;
    } else if (modalMode === 'admin') {
      payload.adminMessage = statusMessage.trim() || undefined;
    }
    
    handleStatusChange(selectedComplaintId, payload);
  };

  const handleEdit = (complaint) => {
    navigation.navigate('RaiseComplaint', { editData: complaint });
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this complaint?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/complaints/${id}`);
            fetchComplaints();
            Alert.alert('Success', 'Complaint deleted successfully.');
          } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to delete complaint';
            console.log("Delete error: ", err);
            Alert.alert('Error', errorMsg);
          }
      }},
    ]);
  };

  const handleAddStaff = async () => {
    if (!newStaff.username || !newStaff.password || !newStaff.email) {
      Alert.alert('Validation', 'Please enter name, email, and password.');
      return;
    }
    setAddStaffLoading(true);
    try {
      const generatedPhone = '0000000000';
      
      const userRes = await api.post('/masters/users', {
        username: newStaff.username,
        email: newStaff.email,
        phoneNumber: generatedPhone,
        password: newStaff.password,
        role: newStaff.role || 'Staff'
      });
      
      const newStaffId = userRes.data._id || userRes.data.id;

      if (assignComplaintId) {
        await api.patch(`/complaints/assign/${assignComplaintId}`, { 
          staffId: newStaffId, 
          assignMessage: assignMessage || 'Please resolve this complaint.' 
        });
      }

      setAddStaffModalVisible(false);
      setAssignModalVisible(false);
      setNewStaff({ username: '', email: '', phoneNumber: '', password: '', role: 'Staff' });
      fetchStaff();
      fetchComplaints();
      Alert.alert(
        'Staff Registered Successfully', 
        'Staff account has been created. The staff can now login with their email and password to view their dashboard.'
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add staff.');
    } finally {
      setAddStaffLoading(false);
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

  const staffItems = staffList.map((s) => ({
    label: s.username || s.name,
    value: s._id || s.id,
  }));

  const renderComplaint = ({ item }) => {
    const isActioning = actionLoading === (item._id || item.id);
    return (
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>📅 {formatDate(item.createdAt)}</Text>
          <View style={styles.headerRight}>
            <StatusBadge status={item.status} />
            {(isSuperAdmin || ((item.user?._id === user?.id || item.user === user?.id) && item.status === 'Pending')) && (
               <View style={styles.editDeleteActions}>
                 <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                   <Text style={{ fontSize: 16 }}>✏️</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => handleDelete(item._id || item.id)} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                   <Text style={{ fontSize: 16 }}>🗑️</Text>
                 </TouchableOpacity>
               </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <InfoRow label="Reported By" value={item.user?.username || item.user?.name || 'N/A'} />
        <InfoRow
          label="Department/Programme"
          value={`${item.department?.name || item.departmentId || ''} / ${item.programme?.name || item.programmeId || ''}`}
        />

        <InfoRow
          label="Location"
          value={`${item.block?.name || ''} - ${item.room?.roomNumber || item.room?.name || ''}`}
        />
        {item.complaintType ? <InfoRow label="Problem Type" value={item.complaintType?.name || 'N/A'} /> : null}
        {item.remarks ? <InfoRow label="Remarks" value={item.remarks} /> : null}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned To:</Text>
          {item.assignedTo ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
              <Text style={[styles.infoValue, { color: '#333', fontWeight: 'bold' }]}>
                {item.assignedTo.username || item.assignedTo.name}
              </Text>
            </View>
          ) : (
            <Text style={styles.infoValue}>Unassigned</Text>
          )}
        </View>

        {/* 🚨 Alert Superadmin for NEW complaints */}
        {item.status === 'Pending' && (isSuperAdmin || isHOD) && (
          <View style={[styles.alertBox, { backgroundColor: '#fff3cd', borderLeftColor: '#ffc107' }]}>
            <Text style={[styles.alertTitle, { color: '#856404' }]}>🚨 New Complaint Alert!</Text>
            <Text style={[styles.alertText, { color: '#856404' }]}>User {item.user?.username || item.user?.name || 'someone'} has raised a new complaint. Please assign it to a staff member.</Text>
          </View>
        )}

        {item.assignMessage && (isSuperAdmin || isHOD || isStaff) && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>🔔 Admin Alert to Staff:</Text>
            <Text style={styles.alertText}>{item.assignMessage}</Text>
          </View>
        )}
        
        {item.staffMessage && (isSuperAdmin || isHOD || isStaff) && (
          <View style={[styles.alertBox, { backgroundColor: '#d1ecf1', borderLeftColor: '#17a2b8' }]}>
            <Text style={[styles.alertTitle, { color: '#0c5460' }]}>📝 Alert from Staff to Superadmin:</Text>
            <Text style={[styles.alertText, { color: '#0c5460' }]}>{item.staffMessage}</Text>
          </View>
        )}

        {item.adminMessage && (
          <View style={[
            styles.alertBox, 
            { 
              backgroundColor: item.status === 'Incomplete' ? '#fdecea' : (item.status === 'On-Hold' ? '#fff3cd' : (item.status === 'In-Progress' ? '#cce5ff' : '#e8f5e9')), 
              borderLeftColor: item.status === 'Incomplete' ? '#dc3545' : (item.status === 'On-Hold' ? '#ffc107' : (item.status === 'In-Progress' ? '#b8daff' : '#28a745')) 
            }
          ]}>
            <Text style={[
              styles.alertTitle, 
              { color: item.status === 'Incomplete' ? '#c0392b' : (item.status === 'On-Hold' ? '#856404' : (item.status === 'In-Progress' ? '#004085' : '#1b5e20')) }
            ]}>
              {item.status === 'Incomplete' ? '❌' : (item.status === 'On-Hold' ? '⏸️' : (item.status === 'In-Progress' ? '🚀' : '✅'))} Admin Alert to User:
            </Text>
            <Text style={[styles.alertText, { color: item.status === 'In-Progress' ? '#004085' : '#333' }]}>{item.adminMessage}</Text>
          </View>
        )}

        {/* SuperAdmin & HOD: Edit Actions */}
        {(isSuperAdmin || isHOD) && ['Pending', 'Assigned'].includes(item.status) && (
          <View style={styles.assignSection}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#007bff', alignSelf: 'stretch', alignItems: 'center' }]}
              onPress={() => {
                const cType = item.complaintType?.name || 'work';
                setAssignComplaintId(item._id || item.id);
                setAssignMessage(`Please resolve this ${cType} complaint.`);
                setAssignModalVisible(true);
              }}
              disabled={isActioning}
            >
              <Text style={styles.actionBtnText}>🚀 Assign to Staff</Text>
            </TouchableOpacity>
            {isActioning && <ActivityIndicator size="small" color="#007bff" style={{ marginTop: 6 }} />}
          </View>
        )}

        {/* Staff Only: Status Action Buttons (Report to Superadmin) */}
        {isStaff && (
          <View style={[styles.actionsRow, { marginTop: 15, flexDirection: 'column', alignItems: 'stretch' }]}>
            {['Assigned', 'In-Progress'].includes(item.status) && (
              <TouchableOpacity
                style={[styles.assignConfirmBtn, { backgroundColor: '#17a2b8', alignItems: 'center' }]}
                onPress={() => openStatusModal(item._id || item.id, '', '', 'staff')}
              >
                <Text style={styles.assignConfirmBtnText}>📝 Report to Superadmin</Text>
              </TouchableOpacity>
            )}
            {isActioning === (item._id || item.id) && <ActivityIndicator size="small" color="#007bff" style={{ marginTop: 8 }} />}
          </View>
        )}

        {/* SuperAdmin & HOD: Verify Actions */}
        {(isSuperAdmin || isHOD) && ['Verification Pending', 'On-Hold', 'In-Progress'].includes(item.status) && (
          <View style={[styles.actionsRow, { marginTop: 15, flexDirection: 'column', alignItems: 'stretch' }]}>
            <TouchableOpacity
              style={[styles.assignConfirmBtn, { backgroundColor: '#28a745', alignItems: 'center' }]}
              onPress={() => openStatusModal(item._id || item.id, '', '', 'admin')}
            >
              <Text style={styles.assignConfirmBtnText}>⚡ Superadmin Action</Text>
            </TouchableOpacity>
          </View>
        )}


      </View>
    );
  };

  const [statusFilter, setStatusFilter] = useState(route?.params?.initialFilter || 'All');

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.initialFilter) {
        setStatusFilter(route.params.initialFilter);
      }
    }, [route?.params?.initialFilter])
  );

  const filteredComplaints = complaints.filter(c => {
    let matchesStatus = true;
    if (statusFilter !== 'All') {
      matchesStatus = c.status === statusFilter;
    }
    
    let matchesStaff = true;
    if (route?.params?.staffFilterId) {
      matchesStaff = c.assignedTo && (String(c.assignedTo._id || c.assignedTo.id) === String(route.params.staffFilterId));
    }

    return matchesStatus && matchesStaff;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading complaints…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>
          {filteredComplaints.length} Complaint{filteredComplaints.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'Pending', 'Assigned', 'In-Progress', 'On-Hold', 'Completed', 'Incomplete'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={renderComplaint}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No complaints found.</Text>
          </View>
        }
      />

      {/* Status/Report Update Modal */}
      {statusModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Status / Send Message</Text>
            <Text style={styles.modalSub}>
              {modalMode === 'staff' ? 'Send a report to Superadmin:' : 'Update status and notify user:'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type your message here..."
              value={statusMessage}
              onChangeText={setStatusMessage}
              multiline
            />
            {modalMode === 'staff' && (
              <CustomPicker
                label="Report Type"
                placeholder="Select option"
                value={pendingStatusUpdate}
                onChange={setPendingStatusUpdate}
                items={[
                  { label: 'Complete', value: 'Complete' },
                  { label: 'Incomplete', value: 'Incomplete' },
                  { label: 'More Time', value: 'More Time' },
                ]}
              />
            )}
            {modalMode === 'admin' && (
              <CustomPicker
                label="Action"
                placeholder="Select Action"
                value={pendingStatusUpdate}
                onChange={setPendingStatusUpdate}
                items={[
                  { label: 'Complete', value: 'Completed' },
                  { label: 'Incomplete', value: 'Incomplete' },
                  { label: 'On Hold', value: 'On-Hold' },
                  { label: 'Progress', value: 'In-Progress' },
                ]}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={submitStatusUpdate}
              >
                <Text style={styles.modalSubmitText}>Send Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {addStaffModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register New Staff</Text>
            <Text style={styles.modalSub}>Add a new staff member</Text>

            <TextInput
              style={styles.staffModalInput}
              placeholder="Name / Username"
              value={newStaff.username}
              onChangeText={(txt) => setNewStaff({ ...newStaff, username: txt })}
            />

            <TextInput
              style={styles.staffModalInput}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={newStaff.email}
              onChangeText={(txt) => setNewStaff({ ...newStaff, email: txt })}
            />

            <TextInput
              style={styles.staffModalInput}
              placeholder="Password"
              secureTextEntry
              value={newStaff.password}
              onChangeText={(txt) => setNewStaff({ ...newStaff, password: txt })}
            />

            <View style={{ marginBottom: 16 }}>
              <CustomPicker
                label="Role"
                placeholder="Select Role"
                items={STAFF_ROLES.map(role => ({ label: role, value: role }))}
                value={newStaff.role}
                onChange={(val) => setNewStaff({ ...newStaff, role: val })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddStaffModalVisible(false)} disabled={addStaffLoading}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddStaff} disabled={addStaffLoading}>
                {addStaffLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Register</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {assignModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.assignModalContent}>
            <View style={styles.assignModalHeader}>
              <Text style={styles.modalTitle}>Select Staff Member</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} style={{ padding: 5 }}>
                <Text style={{ fontSize: 18, color: '#999' }}>✖</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Alert message for staff (optional)"
              value={assignMessage}
              onChangeText={setAssignMessage}
              multiline
            />
            <ScrollView style={{ maxHeight: 300 }}>
              {staffList.map((staff) => (
                <View key={staff._id || staff.id} style={styles.staffItem}>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.username || staff.name}</Text>
                    <Text style={styles.staffDetails}>{staff.role || 'Staff'} • {staff.email || 'No Email'}</Text>
                    {staff.phoneNumber && <Text style={styles.staffDetails}>📞 {staff.phoneNumber}</Text>}
                  </View>
                  <TouchableOpacity
                    style={styles.assignConfirmBtn}
                    onPress={() => handleAssign(assignComplaintId, staff._id || staff.id)}
                  >
                    <Text style={styles.assignConfirmBtnText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {staffList.length === 0 && (
                <Text style={{ textAlign: 'center', marginVertical: 20, color: '#666' }}>No staff available.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={{ marginTop: 15, alignSelf: 'center' }} onPress={() => { setAssignModalVisible(false); setAddStaffModalVisible(true); }}>
              <Text style={{ color: '#007bff', fontWeight: 'bold' }}>+ Register New Staff</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  refreshBtn: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#dde2e8',
  },
  filterChipActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  errorBox: {
    backgroundColor: '#fdecea',
    margin: 12,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: { color: '#c0392b', fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editDeleteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 6,
  },
  iconBtn: {
    padding: 4,
  },
  cardDate: { fontSize: 13, color: '#666' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 8 },
  infoRow: { flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginRight: 4, minWidth: 130 },
  infoValue: { fontSize: 13, color: '#333', flex: 1 },
  alertBox: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#333',
  },
  assignSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#999' },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#555', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  staffModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { padding: 10 },
  modalCancelText: { color: '#666', fontWeight: 'bold' },
  modalSubmitBtn: { backgroundColor: '#28a745', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalSubmitText: { color: '#fff', fontWeight: 'bold' },
  assignModalContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  assignModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  staffItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  staffInfo: { flex: 1, paddingRight: 10 },
  staffName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  staffDetails: { fontSize: 12, color: '#666', marginTop: 2 },
  assignConfirmBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  assignConfirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default ComplaintListScreen;
