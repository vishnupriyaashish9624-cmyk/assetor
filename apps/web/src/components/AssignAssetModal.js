import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button, TextInput, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/client';

const AssignAssetModal = ({ visible, onClose, onAssign, asset }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchEmployees();
            setSelectedEmployee('');
            setNotes('');
        }
    }, [visible]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await api.get('/employees');
            if (res.data.success) {
                setEmployees(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = () => {
        if (!selectedEmployee) {
            alert('Please select an employee');
            return;
        }
        onAssign(asset.id, selectedEmployee, notes);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Surface style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <MaterialCommunityIcons name="account-arrow-right" size={24} color="#4F46E5" style={{ marginRight: 8 }} />
                            <Text style={styles.headerTitle}>Assign Asset</Text>
                        </View>
                        <IconButton icon="close" size={20} onPress={onClose} style={{ margin: 0 }} />
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <View style={styles.assetCard}>
                            <Text style={styles.assetLabel}>Selected Asset</Text>
                            <Text style={styles.assetValue}>{asset?.name || '---'}</Text>
                            <Text style={styles.assetSubValue}>{asset?.asset_code}</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Assign to Employee *</Text>
                            {loading ? (
                                <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 12 }} />
                            ) : (
                                <View style={styles.pickerWrapper}>
                                    <select
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        style={styles.picker}
                                    >
                                        <option value="">-- Select Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} {emp.position ? `(${emp.position})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Assignment Notes (Optional)</Text>
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="e.g. Assigned for remote work use"
                                multiline
                                numberOfLines={3}
                                mode="outlined"
                                outlineColor="#E2E8F0"
                                activeOutlineColor="#4F46E5"
                                style={styles.textArea}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button mode="outlined" onPress={onClose} style={styles.cancelBtn} labelStyle={{ color: '#475569' }}>
                            Cancel
                        </Button>
                        <Button mode="contained" onPress={handleAssign} style={styles.saveBtn} buttonColor="#4F46E5">
                            Assign Now
                        </Button>
                    </View>
                </Surface>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxWidth: 460, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', elevation: 5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    body: { padding: 20 },
    assetCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
    assetLabel: { fontSize: 12, color: '#64748B', fontWeight: '500', textTransform: 'uppercase', marginBottom: 4 },
    assetValue: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
    assetSubValue: { fontSize: 13, color: '#64748B', marginTop: 2 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 8 },
    pickerWrapper: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', backgroundColor: 'white' },
    picker: { height: 44, paddingHorizontal: 12, border: 'none', width: '100%', fontSize: 15, color: '#1E293B' },
    textArea: { backgroundColor: 'white', fontSize: 14 },
    footer: { flexDirection: 'row', padding: 16, gap: 12, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    cancelBtn: { borderRadius: 8, borderColor: '#E2E8F0' },
    saveBtn: { borderRadius: 8 }
});

export default AssignAssetModal;
