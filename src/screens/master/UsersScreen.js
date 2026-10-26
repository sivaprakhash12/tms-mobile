
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import CustomPicker from '../../components/CustomPicker';

const UsersScreen = ({ route, navigation }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState([]);

  const roleFilter = route?.params?.roleFilter;

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProg, setSelectedProg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAll();
  }, [roleFilter]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      let endpoint = '/masters/users';

      if (roleFilter === 'Staff') {
        endpoint += '?role=Staff';
      } else if (roleFilter === 'User') {
        endpoint += '?role=User';
      }

      const [usersRes, rolesRes, deptsRes, progsRes] =
        await Promise.all([
          api.get(endpoint),
          api.get('/masters/roles'),
          api.get('/masters/departments'),
          api.get('/masters/programmes'),
        ]);

      setUsers(usersRes.data);
      setRoles(rolesRes.data);

      // Only allow these five departments in the dropdown.
      const allowedDepartments = [
        'msc',
        'mca',
        'mba',
        'matamil',
        'maenglish',
      ];

      const filteredDepartments = deptsRes.data.filter((d) => {
        const normalizedName = String(d.name || '')
          .toLowerCase()
          .replace(/[^a-z]/g, '');

        return allowedDepartments.includes(normalizedName);
      });

      setDepartments(filteredDepartments);
      setProgrammes(progsRes.data);
    } catch (_) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setSelectedProg(null);

    setFilteredProgrammes(
      programmes.filter((p) => {
        const pDeptId =
          p.department?._id ||
          p.department?.id ||
          p.department ||
          p.departmentId ||
          p.department_id;

        return String(pDeptId) === String(deptId);
      })
    );
  };

  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      setError('Username and email are required.');
      return;
    }

    let finalRoleName = selectedRole;

    if (roleFilter === 'User') {
      finalRoleName = 'User';
    } else {
      if (!selectedRole) {
        setError('Role is required.');
        return;
      }

      const roleObj = roles.find(
        (r) => (r._id || r.id) === selectedRole
      );

      finalRoleName = roleObj ? roleObj.name : selectedRole;
    }

    if (!editingId && !password.trim()) {
      setError('Password is required for new users.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        username,
        phoneNumber: phone,
        email,
        role: finalRoleName,
        department: selectedDept,
        programme: selectedProg,
      };

      if (password) {
        payload.password = password;
      }

      if (editingId) {
        await api.put(`/masters/users/${editingId}`, payload);
        setSuccess('User updated.');
      } else {
        await api.post('/masters/users', payload);
        setSuccess('User added.');
      }

      resetForm();
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user._id || user.id);
    setUsername(user.username || user.name || '');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setPassword('');
    setSelectedRole(user.roleId || user.role_id || null);

    const deptId =
      user.department?._id ||
      user.department?.id ||
      user.department ||
      user.departmentId ||
      user.department_id;

    setSelectedDept(deptId);

    if (deptId) {
      setFilteredProgrammes(
        programmes.filter((p) => {
          const pDeptId =
            p.department?._id ||
            p.department?.id ||
            p.department ||
            p.departmentId ||
            p.department_id;

          return String(pDeptId) === String(deptId);
        })
      );
    }

    const progId =
      user.programme?._id ||
      user.programme?.id ||
      user.programme ||
      user.programmeId ||
      user.programme_id;

    setSelectedProg(progId);
    setError('');
    setSuccess('');
  };

  const handleDelete = (user) => {
    Alert.alert(
      'Delete User',
      `Delete "${user.username || user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(
                `/masters/users/${user._id || user.id}`
              );
              fetchAll();
            } catch (err) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Delete failed.'
              );
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setUsername('');
    setPhone('');
    setEmail('');
    setPassword('');
    setSelectedRole(null);
    setSelectedDept(null);
    setSelectedProg(null);
    setEditingId(null);
    setFilteredProgrammes([]);
  };

  const roleItems = roles.map((r) => ({
    label: r.name,
    value: r._id || r.id,
  }));

  const deptItems = departments.map((d) => ({
    label: d.name,
    value: d._id || d.id,
  }));

  const progItems = filteredProgrammes.map((p) => ({
    label: p.name,
    value: p._id || p.id,
  }));

  const getRoleName = (id) => {
    const r = roles.find((r) => (r._id || r.id) === id);
    return r ? r.name : 'N/A';
  };

  const renderItem = ({ item }) => (
    <View style={styles.listRow}>
      <View style={styles.listRowInfo}>
        <Text style={styles.listRowName}>
          {item.username || item.name}
        </Text>
        <Text style={styles.listRowSub}>
          {item.email} · {getRoleName(item.roleId || item.role_id)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.editBtn, { backgroundColor: '#d1ecf1' }]}
        onPress={() =>
          navigation.navigate(
            roleFilter === 'Staff' ? 'StaffDashboard' : 'Dashboard',
            {
              staffId: item._id || item.id,
              staffName: item.username || item.name,
            }
          )
        }
      >
        <Text style={styles.editBtnText}>🏠</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => handleEdit(item)}
      >
        <Text style={styles.editBtnText}>✏</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
      >
        <Text style={styles.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>
            {roleFilter === 'Staff' ? 'Staff Members' : 'Normal Users'}
          </Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {!!success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ {success}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {editingId ? 'Edit User' : 'Add User'}
            </Text>

            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>
              Password {editingId ? '(leave blank to keep current)' : '*'}
            </Text>

            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#aaa"
              />

              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((p) => !p)}
              >
                <Text>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            {roleFilter !== 'User' && (
              <>
                <CustomPicker
                  label="Role *"
                  placeholder="Select Role"
                  items={roleItems}
                  value={selectedRole}
                  onChange={setSelectedRole}
                />

                <CustomPicker
                  label="Department"
                  placeholder="Select Department"
                  items={deptItems}
                  value={selectedDept}
                  onChange={handleDeptChange}
                />

                <CustomPicker
                  label="Programme"
                  placeholder={
                    selectedDept
                      ? 'Select Programme'
                      : 'Select Department first'
                  }
                  items={progItems}
                  value={selectedProg}
                  onChange={setSelectedProg}
                  disabled={!selectedDept}
                />
              </>
            )}

            <View style={styles.formBtns}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingId ? 'Update' : 'Add'}
                  </Text>
                )}
              </TouchableOpacity>

              {editingId && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={resetForm}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.listTitle}>
            {roleFilter === 'Staff' ? 'All Staff Members' : 'All Users'} (
            {users.length})
          </Text>

          {loading ? (
            <ActivityIndicator
              color="#007bff"
              size="large"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => String(item._id || item.id)}
              renderItem={renderItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No users found.</Text>
              }
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
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dde2e8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafbfc',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  eyeBtn: {
    borderWidth: 1,
    borderColor: '#dde2e8',
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#fafbfc',
  },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#6aabf7' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  listTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
  },
  listRowInfo: { flex: 1 },
  listRowName: { fontSize: 14, fontWeight: '600', color: '#333' },
  listRowSub: { fontSize: 12, color: '#777', marginTop: 2 },
  editBtn: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 8,
    marginRight: 6,
  },
  editBtnText: { fontSize: 16 },
  deleteBtn: { backgroundColor: '#fdecea', borderRadius: 8, padding: 8 },
  deleteBtnText: { fontSize: 16 },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: { color: '#c0392b', fontSize: 14 },
  successBox: {
    backgroundColor: '#eafaf1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  successText: { color: '#1e7e34', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
});

export default UsersScreen;
