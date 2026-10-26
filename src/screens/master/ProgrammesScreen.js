import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import CustomPicker from '../../components/CustomPicker';

const ProgrammesScreen = () => {
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selectedDept, setSelectedDept] = useState(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [progsRes, deptsRes] = await Promise.all([
        api.get('/masters/programmes'),
        api.get('/masters/departments'),
      ]);
      setProgrammes(progsRes.data);
      setDepartments(deptsRes.data);
    } catch (_) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDept || !name.trim() || !shortName.trim()) { setError('Department, name, and short name are required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { name, shortName, department: selectedDept };
      if (editingId) {
        await api.put(`/masters/programmes/${editingId}`, payload);
        setSuccess('Programme updated.');
      } else {
        await api.post('/masters/programmes', payload);
        setSuccess('Programme added.');
      }
      resetForm();
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prog) => {
    setEditingId(prog._id || prog.id);
    setName(prog.name || '');
    setShortName(prog.shortName || '');
    const deptId = prog.department?._id || prog.department?.id || prog.department || prog.departmentId || prog.department_id || null;
    setSelectedDept(deptId);
    setError(''); setSuccess('');
  };

  const handleDelete = (prog) => {
    Alert.alert('Delete Programme', `Delete "${prog.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/masters/programmes/${prog._id || prog.id}`);
            fetchAll();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Delete failed.');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setSelectedDept(null); setName(''); setShortName(''); setEditingId(null);
  };

  const deptItems = departments.map((d) => ({ label: d.name, value: d._id || d.id }));

  const getDeptName = (id) => {
    const d = departments.find((d) => (d._id || d.id) === (id?._id || id?.id || id));
    return d ? d.name : id;
  };

  const renderItem = ({ item }) => (
    <View style={styles.listRow}>
      <View style={styles.listRowInfo}>
        <Text style={styles.listRowName}>{item.name}</Text>
        <Text style={styles.listRowSub}>{getDeptName(item.departmentId || item.department_id)}</Text>
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
          <Text style={styles.heading}>Programmes</Text>

          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}
          {!!success && <View style={styles.successBox}><Text style={styles.successText}>✅ {success}</Text></View>}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingId ? 'Edit Programme' : 'Add Programme'}</Text>

            <CustomPicker label="Department *" placeholder="Select Department" items={deptItems} value={selectedDept} onChange={setSelectedDept} />

            <Text style={styles.label}>Programme Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. B.Tech" value={name} onChangeText={setName} placeholderTextColor="#aaa" />

            <Text style={styles.label}>Short Name</Text>
            <TextInput style={styles.input} placeholder="e.g. BT" value={shortName} onChangeText={setShortName} placeholderTextColor="#aaa" />

            <View style={styles.formBtns}>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Add'}</Text>}
              </TouchableOpacity>
              {editingId && (
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.listTitle}>All Programmes ({programmes.length})</Text>
          {loading ? (
            <ActivityIndicator color="#007bff" size="large" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={programmes}
              keyExtractor={(item) => String(item._id || item.id)}
              renderItem={renderItem}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No programmes found.</Text>}
            />
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

export default ProgrammesScreen;
