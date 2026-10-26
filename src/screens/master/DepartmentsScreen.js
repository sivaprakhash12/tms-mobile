import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';

const DepartmentsScreen = () => {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/masters/departments');
      setDepartments(res.data);
    } catch (err) {
      setError('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Department name is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      if (editingId) {
        await api.put(`/masters/departments/${editingId}`, { name, shortName });
        setSuccess('Department updated.');
      } else {
        await api.post('/masters/departments', { name, shortName });
        setSuccess('Department added.');
      }
      resetForm();
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingId(dept._id || dept.id);
    setName(dept.name || '');
    setShortName(dept.shortName || dept.short_name || '');
    setError(''); setSuccess('');
  };

  const handleDelete = (dept) => {
    Alert.alert('Delete Department', `Delete "${dept.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/masters/departments/${dept._id || dept.id}`);
            fetchDepartments();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Delete failed.');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setName(''); setShortName(''); setEditingId(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.listRow}>
      <View style={styles.listRowInfo}>
        <Text style={styles.listRowName}>{item.name}</Text>
        {item.shortName || item.short_name ? (
          <Text style={styles.listRowSub}>{item.shortName || item.short_name}</Text>
        ) : null}
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
          <Text style={styles.heading}>Departments</Text>

          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}
          {!!success && <View style={styles.successBox}><Text style={styles.successText}>✅ {success}</Text></View>}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingId ? 'Edit Department' : 'Add Department'}</Text>

            <Text style={styles.label}>Department Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Computer Science" value={name} onChangeText={setName} placeholderTextColor="#aaa" />

            <Text style={styles.label}>Short Name</Text>
            <TextInput style={styles.input} placeholder="e.g. CS" value={shortName} onChangeText={setShortName} placeholderTextColor="#aaa" />

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

          <Text style={styles.listTitle}>All Departments ({departments.length})</Text>
          {loading ? (
            <ActivityIndicator color="#007bff" size="large" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={departments}
              keyExtractor={(item) => String(item._id || item.id)}
              renderItem={renderItem}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No departments found.</Text>}
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
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
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

export default DepartmentsScreen;
