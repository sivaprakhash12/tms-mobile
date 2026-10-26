import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';

const RolesScreen = () => {
  const [roles, setRoles] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/masters/roles');
      setRoles(res.data);
    } catch (_) {
      setError('Failed to load roles.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!roleName.trim()) { setError('Role name is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      if (editingId) {
        await api.put(`/masters/roles/${editingId}`, { name: roleName });
        setSuccess('Role updated.');
      } else {
        await api.post('/masters/roles', { name: roleName });
        setSuccess('Role added.');
      }
      setRoleName(''); setEditingId(null);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role) => {
    setEditingId(role._id || role.id);
    setRoleName(role.name || '');
    setError(''); setSuccess('');
  };

  const handleDelete = (role) => {
    Alert.alert('Delete Role', `Delete "${role.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/masters/roles/${role._id || role.id}`);
            fetchRoles();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Delete failed.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.listRow}>
      <Text style={styles.listRowName}>{item.name}</Text>
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
          <Text style={styles.heading}>Roles</Text>

          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}
          {!!success && <View style={styles.successBox}><Text style={styles.successText}>✅ {success}</Text></View>}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingId ? 'Edit Role' : 'Add Role'}</Text>
            <Text style={styles.label}>Role Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Staff" value={roleName} onChangeText={setRoleName} placeholderTextColor="#aaa" />
            <View style={styles.formBtns}>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Add'}</Text>}
              </TouchableOpacity>
              {editingId && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingId(null); setRoleName(''); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.listTitle}>All Roles ({roles.length})</Text>
          {loading ? <ActivityIndicator color="#007bff" size="large" style={{ marginTop: 20 }} /> : (
            <FlatList data={roles} keyExtractor={(item) => String(item._id || item.id)} renderItem={renderItem} scrollEnabled={false} ListEmptyComponent={<Text style={styles.emptyText}>No roles found.</Text>} />
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
  listRowName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
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

export default RolesScreen;
