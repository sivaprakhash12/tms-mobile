import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';

/**
 * CustomPicker - A React Native replacement for HTML <select>.
 *
 * Props:
 *  - label: string          — form label above the picker
 *  - value: any             — currently selected value
 *  - onChange: fn(value)    — called when a new item is chosen
 *  - items: [{ label, value }] — list of options
 *  - disabled: bool         — greys out the picker when true
 *  - placeholder: string    — text shown when no value selected
 *  - onAddAction: fn        — optional function to call when user clicks an 'Add' button in the picker
 *  - addActionLabel: string — text for the 'Add' button (default: '+ Add New')
 */
const CustomPicker = ({ label, value, onChange, items = [], disabled = false, placeholder = 'Select…', onAddAction, addActionLabel = '+ Add New' }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === value);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const handleSelect = (item) => {
    onChange(item.value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => { if (!disabled) setModalVisible(true); }}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.triggerText, !selectedItem && styles.placeholderText]} numberOfLines={1}>
          {displayText}
        </Text>
        <Text style={styles.arrow}>{disabled ? '⬤' : '▼'}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <FlatList
              data={items}
              keyExtractor={(item, idx) => String(item.value ?? idx)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No options available</Text>
                </View>
              }
              style={{ maxHeight: 320 }}
            />
            {!!onAddAction && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setModalVisible(false);
                  onAddAction();
                }}
              >
                <Text style={styles.addBtnText}>{addActionLabel}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 10 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dde2e8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fafbfc',
    minHeight: 46,
  },
  triggerDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
    opacity: 0.7,
  },
  triggerText: { fontSize: 14, color: '#333', flex: 1, marginRight: 8 },
  placeholderText: { color: '#aaa' },
  arrow: { fontSize: 11, color: '#888' },
  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', flex: 1, marginRight: 8 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#555', fontWeight: 'bold' },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionItemSelected: { backgroundColor: '#e8f0fe' },
  optionText: { fontSize: 14, color: '#333', flex: 1 },
  optionTextSelected: { color: '#007bff', fontWeight: '600' },
  checkmark: { color: '#007bff', fontSize: 16, fontWeight: 'bold' },
  emptyList: { padding: 24, alignItems: 'center' },
  emptyListText: { color: '#aaa', fontSize: 14 },
  addBtn: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  addBtnText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default CustomPicker;
