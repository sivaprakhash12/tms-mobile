import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import CustomPicker from '../../components/CustomPicker';

const RoomsScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProg, setSelectedProg] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [roomsRes, deptsRes, progsRes, blocksRes] = await Promise.all([
        api.get('/masters/rooms'),
        api.get('/masters/departments'),
        api.get('/masters/programmes'),
        api.get('/masters/blocks'),
      ]);
      setRooms(roomsRes.data);
      setDepartments(deptsRes.data);
      setProgrammes(progsRes.data);
      setBlocks(blocksRes.data);
    } catch (_) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setSelectedProg(null);
    setSelectedBlock(null);
    setFilteredProgrammes(programmes.filter((p) => {
      const pDeptId = p.department?._id || p.department?.id || p.department || p.departmentId || p.department_id;
      return !pDeptId || String(pDeptId) === String(deptId);
    }));
    setFilteredBlocks(blocks.filter((b) => {
      const bDeptId = b.department?._id || b.department?.id || b.department || b.departmentId || b.department_id;
      return !bDeptId || String(bDeptId) === String(deptId);
    }));
  };

  const handleProgChange = (progId) => {
    setSelectedProg(progId);
    setSelectedBlock(null);
    setFilteredBlocks(blocks.filter((b) => {
      const bProgId = b.programme?._id || b.programme?.id || b.programme || b.programmeId || b.programme_id;
      return !bProgId || String(bProgId) === String(progId);
    }));
  };

  const handleSave = async () => {
    if (!selectedDept || !roomNumber.trim()) { setError('Department and room number are required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { roomNumber, department: selectedDept, programme: selectedProg || null, block: selectedBlock || null };
      if (editingId) {
        await api.put(`/masters/rooms/${editingId}`, payload);
        setSuccess('Room updated.');
      } else {
        await api.post('/masters/rooms', payload);
        setSuccess('Room added.');
      }
      resetForm(); fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (room) => {
    setEditingId(room._id || room.id);
    setRoomNumber(room.roomNumber || room.name || '');
    const blockId = room.block?._id || room.block?.id || room.block || room.blockId || room.block_id;
    setSelectedBlock(blockId);
    const block = blocks.find((b) => (b._id || b.id) === blockId);
    if (block) {
      const progId = block.programme?._id || block.programme?.id || block.programme || block.programmeId || block.programme_id;
      setSelectedProg(progId);
      setFilteredBlocks(blocks.filter((b) => {
        const bProgId = b.programme?._id || b.programme?.id || b.programme || b.programmeId || b.programme_id;
        return !bProgId || String(bProgId) === String(progId);
      }));
      const prog = programmes.find((p) => (p._id || p.id) === progId);
      if (prog) {
        const deptId = prog.department?._id || prog.department?.id || prog.department || prog.departmentId || prog.department_id;
        setSelectedDept(deptId);
        setFilteredProgrammes(programmes.filter((p) => {
          const pDeptId = p.department?._id || p.department?.id || p.department || p.departmentId || p.department_id;
          return !pDeptId || String(pDeptId) === String(deptId);
        }));
      }
    }
    setError(''); setSuccess('');
  };

  const handleDelete = (room) => {
    Alert.alert('Delete Room', `Delete "${room.roomNumber || room.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/masters/rooms/${room._id || room.id}`);
            fetchAll();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Delete failed.');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setSelectedDept(null); setSelectedProg(null); setSelectedBlock(null);
    setRoomNumber(''); setEditingId(null);
    setFilteredProgrammes([]); setFilteredBlocks([]);
  };

  const deptItems = departments.map((d) => ({ label: d.name, value: d._id || d.id }));
  const progItems = filteredProgrammes.map((p) => ({ label: p.name, value: p._id || p.id }));
  const blockItems = filteredBlocks.map((b) => ({ label: b.name, value: b._id || b.id }));

  const getBlockName = (id) => {
    if (!id) return 'General / No Block';
    const b = blocks.find((b) => (b._id || b.id) === id);
    return b ? b.name : id;
  };

  const renderItem = ({ item }) => (
    <View style={styles.listRow}>
      <View style={styles.listRowInfo}>
        <Text style={styles.listRowName}>{item.roomNumber || item.name}</Text>
        <Text style={styles.listRowSub}>{getBlockName(item.blockId || item.block_id)}</Text>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
        <Text style={styles.editBtnText}>✏</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <Text style={styles.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Rooms</Text>

          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}
          {!!success && <View style={styles.successBox}><Text style={styles.successText}>✅ {success}</Text></View>}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingId ? 'Edit Room' : 'Add Room'}</Text>
            <CustomPicker label="Department *" placeholder="Select Department" items={deptItems} value={selectedDept} onChange={handleDeptChange} />
            <CustomPicker label="Programme (Optional)" placeholder={selectedDept ? 'Select Programme' : 'Select Department first'} items={progItems} value={selectedProg} onChange={handleProgChange} disabled={!selectedDept || filteredProgrammes.length === 0} />
            <CustomPicker label="Block (Optional)" placeholder={selectedDept ? 'Select Block' : 'Select Department first'} items={blockItems} value={selectedBlock} onChange={setSelectedBlock} disabled={!selectedDept || filteredBlocks.length === 0} />
            <Text style={styles.label}>Room Number *</Text>
            <TextInput style={styles.input} placeholder="e.g. 101" value={roomNumber} onChangeText={setRoomNumber} placeholderTextColor="#aaa" />
            <View style={styles.formBtns}>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Add'}</Text>}
              </TouchableOpacity>
              {editingId && <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>}
            </View>
          </View>

          <Text style={styles.listTitle}>All Rooms ({rooms.length})</Text>
          {loading ? <ActivityIndicator color="#007bff" size="large" style={{ marginTop: 20 }} /> : (
            <FlatList data={rooms} keyExtractor={(item) => String(item._id || item.id)} renderItem={renderItem} scrollEnabled={false} ListEmptyComponent={<Text style={styles.emptyText}>No rooms found.</Text>} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f8' },
  container: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#dde2e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#333', backgroundColor: '#fafbfc' },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: '#007bff', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#6aabf7' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { flex: 1, backgroundColor: '#6c757d', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  listTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  listRowInfo: { flex: 1 },
  listRowName: { fontSize: 14, fontWeight: '600', color: '#333' },
  listRowSub: { fontSize: 12, color: '#777', marginTop: 2 },
  editBtn: { backgroundColor: '#fff3cd', borderRadius: 8, padding: 8, marginRight: 6 },
  editBtnText: { fontSize: 16 },
  deleteBtn: { backgroundColor: '#fdecea', borderRadius: 8, padding: 8 },
  deleteBtnText: { fontSize: 16 },
  errorBox: { backgroundColor: '#fdecea', borderRadius: 8, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#dc3545' },
  errorText: { color: '#c0392b', fontSize: 14 },
  successBox: { backgroundColor: '#eafaf1', borderRadius: 8, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#28a745' },
  successText: { color: '#1e7e34', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
});

export default RoomsScreen;
