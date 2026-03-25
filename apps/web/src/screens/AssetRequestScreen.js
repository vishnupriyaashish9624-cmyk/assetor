import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import { Card, Text, Button, DataTable, IconButton, TextInput } from 'react-native-paper';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

const AssetRequestScreen = ({ navigation }) => {
    const [requests] = useState([
        { id: 'REQ-01', asset_name: 'Macbook Pro 14"', request_by: 'Vishnu Priya', department: 'IT Support', status: 'PENDING', date: '2026-03-18' },
        { id: 'REQ-02', asset_name: 'Ergonomic Office Chair', request_by: 'Ashish Kumar', department: 'HR Operations', status: 'APPROVED', date: '2026-03-15' },
        { id: 'REQ-03', asset_name: 'Logitech MX Master 3', request_by: 'Rahul S.', department: 'Sales', status: 'REJECTED', date: '2026-03-14' }
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ asset_name: '', request_by: '', department: '', notes: '', category_id: '' });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                if (res.data.success) setCategories(res.data.data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => {
                const pId = (!item.parent_id || item.parent_id === 'null' || item.parent_id === '0') ? null : Number(item.parent_id);
                const matchId = (!parentId || parentId === 'null' || parentId === '0') ? null : Number(parentId);
                return pId === matchId;
            })
            .map(item => ({ ...item, children: buildTree(items, item.id) }));
    };

    const flattenTreeForDropdown = (tree, depth = 0) => {
        let result = [];
        tree.forEach(node => {
            result.push({ id: node.id, name: node.name, depth });
            if (node.children && node.children.length > 0) {
                result = result.concat(flattenTreeForDropdown(node.children, depth + 1));
            }
        });
        return result;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return { bg: '#DCFCE7', text: '#166534' };
            case 'REJECTED': return { bg: '#FEE2E2', text: '#991B1B' };
            default: return { bg: '#FEF3C7', text: '#92400E' };
        }
    };

    const handleCreateRequest = () => {
        if (!formData.asset_name || !formData.request_by) {
            alert('Please fill required fields');
            return;
        }
        setModalVisible(false);
        setFormData({ asset_name: '', request_by: '', department: '', notes: '' });
    };

    return (
        <AppLayout navigation={navigation}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Asset Requests</Text>
                        <Text style={styles.subtitle}>Manage and approve asset procurement requests</Text>
                    </View>
                    <Button mode="contained" icon="plus" style={styles.createBtn} buttonColor="#4F46E5" onPress={() => setModalVisible(true)}>
                        New Request
                    </Button>
                </View>

                <Card style={styles.tableCard}>
                    <DataTable>
                        <DataTable.Header style={styles.tableHeader}>
                            <DataTable.Title>Request ID</DataTable.Title>
                            <DataTable.Title style={{ flex: 1.5 }}>Asset Name</DataTable.Title>
                            <DataTable.Title>Requested By</DataTable.Title>
                            <DataTable.Title>Status</DataTable.Title>
                            <DataTable.Title numeric>Actions</DataTable.Title>
                        </DataTable.Header>

                        {requests.map((item) => {
                            const colors = getStatusStyle(item.status);
                            return (
                                <DataTable.Row key={item.id} style={styles.tableRow}>
                                    <DataTable.Cell><Text style={styles.idText}>{item.id}</Text></DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 1.5 }}>
                                        <View>
                                            <Text style={styles.assetName}>{item.asset_name}</Text>
                                            <Text style={styles.dateText}>{item.date}</Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell>
                                        <View>
                                            <Text style={styles.userName}>{item.request_by}</Text>
                                            <Text style={styles.deptText}>{item.department}</Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell>
                                        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                                            <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <View style={{ flexDirection: 'row', gap: 4 }}>
                                            <IconButton icon="eye-outline" size={18} iconColor="#64748B" style={{ margin: 0 }} />
                                            {item.status === 'PENDING' && (
                                                <>
                                                    <IconButton icon="check-bold" size={18} iconColor="#10B981" style={{ margin: 0 }} />
                                                    <IconButton icon="close-thick" size={18} iconColor="#EF4444" style={{ margin: 0 }} />
                                                </>
                                            )}
                                        </View>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            );
                        })}
                    </DataTable>
                </Card>

                {/* Create Request Modal */}
                <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Create Asset Request</Text>
                                <IconButton icon="close" size={20} onPress={() => setModalVisible(false)} />
                            </View>

                            <ScrollView style={{ padding: 20 }}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Asset Category *</Text>
                                    <View style={styles.pickerWrapper}>
                                        <select
                                            value={formData.category_id || ''}
                                            onChange={(e) => {
                                                const selectedCat = categories.find(c => c.id.toString() === e.target.value);
                                                setFormData(p => ({ ...p, category_id: e.target.value, asset_name: selectedCat ? selectedCat.name : '' }));
                                            }}
                                            style={styles.picker}
                                        >
                                            <option value="">Select a category...</option>
                                            {(() => {
                                                const tree = buildTree(categories);
                                                return flattenTreeForDropdown(tree).map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {'\u00A0'.repeat(c.depth * 4)}{c.depth > 0 ? '↳ ' : ''}{c.name}
                                                    </option>
                                                ));
                                            })()}
                                        </select>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Requested By *</Text>
                                    <TextInput
                                        mode="outlined"
                                        placeholder="Your Name"
                                        value={formData.request_by}
                                        onChangeText={(v) => setFormData(p => ({ ...p, request_by: v }))}
                                        activeOutlineColor="#4F46E5"
                                        style={styles.input}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Department</Text>
                                    <TextInput
                                        mode="outlined"
                                        placeholder="Your Department"
                                        value={formData.department}
                                        onChangeText={(v) => setFormData(p => ({ ...p, department: v }))}
                                        activeOutlineColor="#4F46E5"
                                        style={styles.input}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Notes / Reason</Text>
                                    <TextInput
                                        mode="outlined"
                                        placeholder="Reason for request..."
                                        value={formData.notes}
                                        onChangeText={(v) => setFormData(p => ({ ...p, notes: v }))}
                                        activeOutlineColor="#4F46E5"
                                        multiline
                                        numberOfLines={3}
                                        style={styles.input}
                                    />
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <Button mode="outlined" onPress={() => setModalVisible(false)} style={{ borderRadius: 8 }}>Cancel</Button>
                                <Button mode="contained" onPress={handleCreateRequest} buttonColor="#4F46E5" style={{ borderRadius: 8 }}>Submit Request</Button>
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
    tableRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 8 },
    idText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    assetName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    userName: { fontSize: 14, color: '#334155', fontWeight: '500' },
    dateText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    deptText: { fontSize: 12, color: '#64748B' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
    statusText: { fontSize: 11, fontWeight: '700' },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    modalContent: { width: '90%', maxWidth: 450, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    modalFooter: { flexDirection: 'row', padding: 16, gap: 12, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 6 },
    input: { backgroundColor: 'white', fontSize: 14 },
    pickerWrapper: { height: 48, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, justifyContent: 'center', backgroundColor: 'white' },
    picker: { width: '100%', height: '100%', borderStyle: 'none', borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 10, fontSize: 14 }
});

export default AssetRequestScreen;
