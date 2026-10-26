
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axios';
import CustomPicker from '../components/CustomPicker';

const RaiseComplaintScreen = ({ route, navigation }) => {
  const editData = route.params?.editData;

  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [complaintTypes, setComplaintTypes] = useState([]);

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProg, setSelectedProg] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedComplaintType, setSelectedComplaintType] = useState(null);
  const [remarks, setRemarks] = useState('');

  const [filteredProgrammes, setFilteredProgrammes] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchMetaData();
    }, [editData])
  );

  // Normalize department names so M.Sc. and MSc are treated equally.
  const normalizeDepartmentName = (name) =>
    String(name || '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');

  // Only these exact department names are allowed.
  const allowedDepartments = [
    'msccs',
    'mba',
    'mca',
    'mscmicrobiology',
    'batamil',
    'baenglish',
    'matamil',
    'maenglish',
  ];

  const fetchMetaData = async () => {
    setFetchingMeta(true);
    setError('');

    try {
      const [
        deptsRes,
        progsRes,
        blocksRes,
        roomsRes,
        typesRes,
      ] = await Promise.all([
        api.get('/masters/departments'),
        api.get('/masters/programmes'),
        api.get('/masters/blocks'),
        api.get('/masters/rooms'),
        api.get('/masters/complaint-types'),
      ]);

      const depts = Array.isArray(deptsRes.data)
        ? deptsRes.data
        : [];
      const progs = Array.isArray(progsRes.data)
        ? progsRes.data
        : [];
      const blks = Array.isArray(blocksRes.data)
        ? blocksRes.data
        : [];
      const rms = Array.isArray(roomsRes.data)
        ? roomsRes.data
        : [];
      const types = Array.isArray(typesRes.data)
        ? typesRes.data
        : [];

      // Exclude MA Arabic, MSc Physics, BA Tamil, BA English,
      // and every other department not in the allowed list.
      const filteredDepartments = depts.filter((d) => {
        const departmentName =
          d.name || d.departmentName || d.title || '';

        const normalizedName =
          normalizeDepartmentName(departmentName);

        return allowedDepartments.includes(normalizedName);
      });

      setDepartments(filteredDepartments);
      setProgrammes(progs);
      setBlocks(blks);
      setRooms(rms);
      setComplaintTypes(types);

      if (editData) {
        const dId =
          editData.department?._id || editData.department;
        const pId =
          editData.programme?._id || editData.programme;
        const bId =
          editData.block?._id || editData.block;
        const rId =
          editData.room?._id || editData.room;
        const tId =
          editData.complaintType?._id ||
          editData.complaintType;

        if (dId) {
          setSelectedDept(dId);

          setFilteredProgrammes(
            progs.filter(
              (p) =>
                String(p.department?._id || p.department) ===
                String(dId)
            )
          );

          setFilteredBlocks(
            blks.filter(
              (b) =>
                String(b.department?._id || b.department) ===
                String(dId)
            )
          );

          setFilteredRooms(
            rms.filter(
              (r) =>
                String(r.department?._id || r.department) ===
                String(dId)
            )
          );
        }

        if (pId) {
          setSelectedProg(pId);

          setFilteredBlocks(
            blks.filter(
              (b) =>
                String(b.programme?._id || b.programme) ===
                String(pId)
            )
          );

          setFilteredRooms(
            rms.filter(
              (r) =>
                String(r.programme?._id || r.programme) ===
                String(pId)
            )
          );
        }

        if (bId) {
          setSelectedBlock(bId);

          setFilteredRooms(
            rms.filter(
              (r) =>
                String(r.block?._id || r.block) ===
                String(bId)
            )
          );
        }

        if (rId) setSelectedRoom(rId);
        if (tId) setSelectedComplaintType(tId);
        if (editData.remarks) setRemarks(editData.remarks);
      } else {
        setSelectedDept(null);
        setSelectedProg(null);
        setSelectedBlock(null);
        setSelectedRoom(null);
        setSelectedComplaintType(null);
        setRemarks('');
        setFilteredProgrammes([]);
        setFilteredBlocks([]);
        setFilteredRooms([]);
      }
    } catch (err) {
      setError('Failed to load form data.');
    } finally {
      setFetchingMeta(false);
    }
  };

  useEffect(() => {
    const progs = selectedDept
      ? programmes.filter((p) => {
          const pDeptId =
            p.department?._id ||
            p.department?.id ||
            p.department ||
            p.departmentId ||
            p.department_id;

          return String(pDeptId) === String(selectedDept);
        })
      : [];

    setFilteredProgrammes(progs);

    const blks = blocks.filter((b) => {
      if (selectedDept) {
        const bDeptId =
          b.department?._id ||
          b.department?.id ||
          b.department ||
          b.departmentId ||
          b.department_id;

        if (
          bDeptId &&
          String(bDeptId) !== String(selectedDept)
        ) {
          return false;
        }
      }

      if (selectedProg) {
        const bProgId =
          b.programme?._id ||
          b.programme?.id ||
          b.programme ||
          b.programmeId ||
          b.programme_id;

        if (
          bProgId &&
          String(bProgId) !== String(selectedProg)
        ) {
          return false;
        }
      }

      return true;
    });

    setFilteredBlocks(blks);

    const rms = rooms.filter((r) => {
      if (selectedDept) {
        const rDeptId =
          r.department?._id ||
          r.department?.id ||
          r.department ||
          r.departmentId ||
          r.department_id;

        if (
          rDeptId &&
          String(rDeptId) !== String(selectedDept)
        ) {
          return false;
        }
      }

      if (selectedProg) {
        const rProgId =
          r.programme?._id ||
          r.programme?.id ||
          r.programme ||
          r.programmeId ||
          r.programme_id;

        if (
          rProgId &&
          String(rProgId) !== String(selectedProg)
        ) {
          return false;
        }
      }

      if (selectedBlock) {
        const rBlockId =
          r.block?._id ||
          r.block?.id ||
          r.block ||
          r.blockId ||
          r.block_id;

        if (
          rBlockId &&
          String(rBlockId) !== String(selectedBlock)
        ) {
          return false;
        }
      }

      return true;
    });

    setFilteredRooms(rms);
  }, [
    selectedDept,
    selectedProg,
    selectedBlock,
    programmes,
    blocks,
    rooms,
  ]);

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setSelectedProg(null);
    setSelectedBlock(null);
    setSelectedRoom(null);
  };

  const handleProgChange = (progId) => {
    setSelectedProg(progId);
    setSelectedBlock(null);
    setSelectedRoom(null);
  };

  const handleBlockChange = (blockId) => {
    setSelectedBlock(blockId);
    setSelectedRoom(null);
  };

  const handleSubmit = async () => {
    const isProgRequired = filteredProgrammes.length > 0;
    const isBlockRequired = filteredBlocks.length > 0;
    const isRoomRequired = filteredRooms.length > 0;

    if (
      !selectedDept ||
      (isProgRequired && !selectedProg) ||
      (isBlockRequired && !selectedBlock) ||
      (isRoomRequired && !selectedRoom) ||
      !selectedComplaintType
    ) {
      setError(
        'Please fill all required fields, including Problem Type.'
      );
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        departmentId: selectedDept,
        programmeId: selectedProg || null,
        blockId: selectedBlock || null,
        roomId: selectedRoom || null,
        complaintTypeId: selectedComplaintType,
        remarks: remarks,
      };

      if (editData) {
        await api.put(
          `/complaints/${editData._id || editData.id}`,
          payload
        );

        setSuccess('✅ Complaint updated successfully!');
      } else {
        await api.post('/complaints', payload);

        setSuccess('✅ Complaint raised successfully!');

        setSelectedDept(null);
        setSelectedProg(null);
        setSelectedBlock(null);
        setSelectedRoom(null);
        setSelectedComplaintType(null);
        setRemarks('');

        setFilteredProgrammes([]);
        setFilteredBlocks([]);
        setFilteredRooms([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to submit complaint.'
      );
    } finally {
      setLoading(false);
    }
  };

  const deptItems = departments.map((d) => ({
    label: d.name || d.departmentName || d.title,
    value: d._id || d.id,
  }));

  const progItems = filteredProgrammes.map((p) => ({
    label: p.name,
    value: p._id || p.id,
  }));

  const blockItems = filteredBlocks.map((b) => ({
    label: b.name,
    value: b._id || b.id,
  }));

  const roomItems = filteredRooms.map((r) => ({
    label: r.roomNumber || r.name,
    value: r._id || r.id,
  }));

  const typeItems = complaintTypes.map((t) => ({
    label: t.name,
    value: t._id || t.id,
  }));

  if (fetchingMeta) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading form…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>
            {editData ? 'Edit Complaint' : 'Raise a Complaint'}
          </Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {!!success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          <View style={styles.card}>
            <CustomPicker
              label="Problem Type *"
              placeholder="Select Problem Type (e.g. Plumbing)"
              items={typeItems}
              value={selectedComplaintType}
              onChange={setSelectedComplaintType}
            />

            <CustomPicker
              label="Department *"
              placeholder="Select Department"
              items={deptItems}
              value={selectedDept}
              onChange={handleDeptChange}
            />

            <CustomPicker
              label={
                filteredProgrammes.length > 0
                  ? 'Programme *'
                  : 'Programme (Optional)'
              }
              placeholder={
                selectedDept
                  ? filteredProgrammes.length === 0
                    ? 'No programmes available'
                    : 'Select Programme'
                  : 'Select Department first'
              }
              items={progItems}
              value={selectedProg}
              onChange={handleProgChange}
              disabled={
                !selectedDept || filteredProgrammes.length === 0
              }
            />

            <CustomPicker
              label="Block *"
              placeholder="Select Block"
              items={blockItems}
              value={selectedBlock}
              onChange={handleBlockChange}
            />

            <CustomPicker
              label="Room *"
              placeholder="Select Room"
              items={roomItems}
              value={selectedRoom}
              onChange={setSelectedRoom}
            />

            <Text style={styles.label}>Remarks</Text>

            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue in detail…"
              placeholderTextColor="#aaa"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                loading && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {editData
                    ? 'Update Complaint'
                    : 'Submit Complaint'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
  },
  successBox: {
    backgroundColor: '#eafaf1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  successText: {
    color: '#1e7e34',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 14,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#dde2e8',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafbfc',
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  submitBtnDisabled: {
    backgroundColor: '#6aabf7',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RaiseComplaintScreen;
