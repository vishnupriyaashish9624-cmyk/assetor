import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import { Card, Text, Button, DataTable, IconButton, TextInput } from 'react-native-paper';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

const AssetMaintenanceScreen = ({ navigation }) => {
    const [tasks] = useState([
        { id: 'MNT-01', asset_name: 'Macbook Pro (IT-043)', fault: 'Battery Battery expanding', cost: '$120.00', status: 'IN_REPAIR', date: '2026-03-18' },
        { id: 'MNT-02', asset_name: 'Ford Transit (VEH-002)', fault: 'Oil leak', cost: 'Pending', status: 'PENDING', date: '2026-03-17' },
        { id: 'MNT-03', asset_name: 'Office AC (ROOM-2)', fault: 'Not cooling', cost: '$45.00', status: 'RESOLVED', date: '2026-03-15' }
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const [categories, setCategories] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({ asset_name: '', fault_description: '', priority: 'MEDIUM', cost_estimate: '', employee_id: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, empRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/employees')
                ]);
                if (catRes.data.success) setCategories(catRes.data.data);
                if (empRes.data.success) setEmployees(empRes.data.data);
            } catch (err) {
                console.error('Error fetching maintenance data:', err);
            }
        };
        fetchData();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'RESOLVED': return { bg: '#DCFCE7', text: '#166534' };
            case 'IN_REPAIR': return { bg: '#DBEAFE', text: '#1E3A8A' };
            default: return { bg: '#FEF3C7', text: '#92400E' };
        }
    };

    return (
        <AppLayout navigation={navigation}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Asset Maintenance</Text>
                        <Text style={styles.subtitle}>Manage repairs, servicing, and logs</Text>
                    </View>
                    <Button mode="contained" icon="wrench" style={styles.createBtn} buttonColor="#4F46E5" onPress={() => setModalVisible(true)}>
                        Log Repair
                    </Button>
                </View>

                <Card style={styles.tableCard}>
                    <DataTable>
                        <DataTable.Header style={styles.tableHeader}>
                            <DataTable.Title>ID</DataTable.Title>
                            <DataTable.Title style={{ flex: 1.5 }}>Asset & Fault</DataTable.Title>
                            <DataTable.Title>Est. Cost</DataTable.Title>
                            <DataTable.Title>Status</DataTable.Title>
                            <DataTable.Title numeric>Actions</DataTable.Title>
                        </DataTable.Header>

                        {tasks.map((item) => {
                            const colors = getStatusStyle(item.status);
                            return (
                                <DataTable.Row key={item.id} style={styles.tableRow}>
                                    <DataTable.Cell><Text style={styles.idText}>{item.id}</Text></DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 1.5 }}>
                                        <View style={{ paddingVertical: 4 }}>
                                            <Text style={styles.assetName}>{item.asset_name}</Text>
                                            <Text style={styles.faultText}>{item.fault}</Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell><Text style={styles.costText}>{item.cost}</Text></DataTable.Cell>
                                    <DataTable.Cell>
                                        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                                            <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <View style={{ flexDirection: 'row', gap: 4 }}>
                                            <IconButton icon="dots-vertical" size={18} iconColor="#64748B" />
                                        </View>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            );
                        })}
                    </DataTable>
                </Card>

                {/* Maintenance Modal */}
                <Modal visible={modalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Log Maintenance/Repair</Text>
                                <IconButton icon="close" size={20} onPress={() => setModalVisible(false)} />
                            </View>

                            <ScrollView style={{ padding: 20 }}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Select Asset Category</Text>
                                    <View style={styles.pickerWrapper}>
                                        <select
                                            style={styles.picker}
                                            onChange={(e) => setFormData(p => ({ ...p, asset_name: e.target.value }))}
                                        >
                                            <option value="">-- Choose Category --</option>
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Employee / Reported By *</Text>
                                    <View style={styles.pickerWrapper}>
                                        <select
                                            style={styles.picker}
                                            value={formData.employee_id || ''}
                                            onChange={(e) => setFormData(p => ({ ...p, employee_id: e.target.value }))}
                                        >
                                            <option value="">-- Choose Employee --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Fault / Issue Description *</Text>
                                    <TextInput
                                        mode="outlined"
                                        placeholder="e.g. Screen flickering, leak, won't start"
                                        value={formData.fault_description}
                                        onChangeText={v => setFormData(p => ({ ...p, fault_description: v }))}
                                        activeOutlineColor="#4F46E5"
                                        multiline numberOfLines={3}
                                        style={styles.input}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Approximate Cost Estimate (Optional)</Text>
                                    <TextInput
                                        mode="outlined"
                                        placeholder="e.g. $50"
                                        value={formData.cost_estimate}
                                        onChangeText={v => setFormData(p => ({ ...p, cost_estimate: v }))}
                                        activeOutlineColor="#4F46E5"
                                        style={styles.input}
                                    />
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <Button mode="outlined" onPress={() => setModalVisible(false)}>Cancel</Button>
                                <Button mode="contained" buttonColor="#4F46E5" onPress={() => setModalVisible(false)}>Submit Log</Button>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC', padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
    createBtn: { borderRadius: 8 },
    tableCard: { backgroundColor: 'white', borderRadius: 12, elevation: 2, overflow: 'hidden' },
    tableHeader: { backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    tableRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    idText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    assetName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    faultText: { fontSize: 12, color: '#DC2626', marginTop: 2 },
    costText: { fontSize: 14, color: '#334155' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
    statusText: { fontSize: 11, fontWeight: '700' },
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    modalContent: { width: '90%', maxWidth: 450, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    modalFooter: { flexDirection: 'row', padding: 16, gap: 12, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 6 },
    input: { backgroundColor: 'white', fontSize: 14 },
    pickerWrapper: { height: 48, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, justifyContent: 'center', backgroundColor: 'white' },
    picker: { width: '100%', height: '100%', borderStyle: 'none', borderWidth: 0, outline: 'none', backgroundColor: 'transparent', paddingLeft: 10, fontSize: 14 }
});

export default AssetMaintenanceScreen;
