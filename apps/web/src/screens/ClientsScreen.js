import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import ClientFormModal from '../components/modals/ClientFormModal';
import AlertDialog from '../components/AlertDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const ClientsScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const { token } = useAuthStore();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isViewOnly, setIsViewOnly] = useState(false);

    // Dialogs
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [confirmConfig, setConfirmConfig] = useState({ visible: false, title: '', message: '', onConfirm: () => { }, danger: false });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_URL}/clients`, config);
            setClients(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClient = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (editingClient) {
                await axios.put(`${API_URL}/clients/${editingClient.id}`, data, config);
                setAlertConfig({ visible: true, title: 'Success', message: 'Client updated successfully', type: 'success' });
            } else {
                await axios.post(`${API_URL}/clients`, data, config);
                setAlertConfig({ visible: true, title: 'Success', message: 'Client created successfully', type: 'success' });
            }
            fetchClients(true);
        } catch (error) {
            setAlertConfig({ visible: true, title: 'Error', message: error.response?.data?.message || 'Failed to save client', type: 'error' });
        }
    };

    const handleDeleteClient = (client) => {
        setConfirmConfig({
            visible: true,
            title: 'Delete Client',
            message: `Are you sure you want to delete ${client.name}?`,
            danger: true,
            onConfirm: async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.delete(`${API_URL}/clients/${client.id}`, config);
                    fetchClients(true);
                    setAlertConfig({ visible: true, title: 'Deleted', message: 'Client has been removed', type: 'success' });
                } catch (error) {
                    setAlertConfig({ visible: true, title: 'Error', message: 'Failed to delete client', type: 'error' });
                }
            }
        });
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout navigation={navigation} title="Client Management">
            <View style={styles.container}>
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.filterTitle}>Filter by Client</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => { setEditingClient(null); setIsViewOnly(false); setModalVisible(true); }}
                        >
                            <MaterialCommunityIcons name="plus" size={20} color="white" />
                            <Text style={styles.addButtonText}>New Client</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Show all..."
                            value={searchQuery}
                            onChangeText={(text) => { setSearchQuery(text); setCurrentPage(1); }}
                            placeholderTextColor="#94a3b8"
                        />
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <View style={styles.tableWrapper}>
                        <ScrollView contentContainerStyle={styles.list}>
                            <View style={styles.tableContainer}>
                                {/* Table Header */}
                                {!isMobile && (
                                    <View style={styles.tableHeader}>
                                        <View style={[styles.headerCell, { flex: 2.5 }]}>
                                            <Text style={styles.headerCellText}>CLIENT NAME</Text>
                                        </View>
                                        <View style={[styles.headerCell, { flex: 1.2 }]}>
                                            <Text style={styles.headerCellText}>COMPANY CODE</Text>
                                        </View>
                                        <View style={[styles.headerCell, { flex: 1 }]}>
                                            <Text style={styles.headerCellText}>COMPANIES</Text>
                                        </View>
                                        <View style={[styles.headerCell, { flex: 1 }]}>
                                            <Text style={styles.headerCellText}>STAFF LIMIT</Text>
                                        </View>
                                        <View style={[styles.headerCell, { flex: 1 }]}>
                                            <Text style={styles.headerCellText}>ASSET LIMIT</Text>
                                        </View>
                                        <View style={[styles.headerCell, { flex: 1 }]}>
                                            <Text style={styles.headerCellText}>STATUS</Text>
                                        </View>
                                        <View style={[styles.headerCell, { flex: 1, alignItems: 'center' }]}>
                                            <Text style={styles.headerCellText}>ACTION</Text>
                                        </View>
                                    </View>
                                )}

                                {filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((client) => (
                                    <View key={client.id} style={styles.tableRow}>
                                        {/* Client Identity */}
                                        <View style={[styles.cell, { flex: 2.5, flexDirection: 'row', alignItems: 'center' }]}>
                                            <View style={styles.clientIconSmall}>
                                                <MaterialCommunityIcons name="domain" size={18} color="#f97316" />
                                            </View>
                                            <Text style={styles.clientNameText} numberOfLines={1}>{client.name}</Text>
                                        </View>

                                        {/* Code */}
                                        <View style={[styles.cell, { flex: 1.2 }]}>
                                            <Text style={styles.cellText}>{client.company_code || '-'}</Text>
                                        </View>

                                        {/* Usage Stats - Companies */}
                                        <View style={[styles.cell, { flex: 1 }]}>
                                            <View style={styles.usageContainer}>
                                                <Text style={styles.cellText}>{client.companies_count || 0}</Text>
                                                <Text style={styles.cellTextLabel}>/ {client.max_companies}</Text>
                                            </View>
                                        </View>

                                        {/* Staff Limit */}
                                        <View style={[styles.cell, { flex: 1 }]}>
                                            <Text style={styles.cellText}>{client.max_employees}</Text>
                                        </View>

                                        {/* Asset Limit */}
                                        <View style={[styles.cell, { flex: 1 }]}>
                                            <Text style={styles.cellText}>{client.max_assets}</Text>
                                        </View>

                                        {/* Status */}
                                        <View style={[styles.cell, { flex: 1 }]}>
                                            <View style={[styles.statusBadgeSmall, client.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
                                                <Text style={[styles.statusTextSmall, { color: client.status === 'ACTIVE' ? '#16a34a' : '#ef4444' }]}>
                                                    {client.status}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Actions */}
                                        <View style={[styles.cell, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 16 }]}>
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    try {
                                                        const config = { headers: { Authorization: `Bearer ${token}` } };
                                                        const res = await axios.get(`${API_URL}/clients/${client.id}`, config);
                                                        setEditingClient(res.data.data);
                                                        setIsViewOnly(true);
                                                        setModalVisible(true);
                                                    } catch (e) {
                                                        setEditingClient(client);
                                                        setIsViewOnly(true);
                                                        setModalVisible(true);
                                                    }
                                                }}
                                            >
                                                <MaterialCommunityIcons name="eye" size={20} color="#64748b" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    try {
                                                        const config = { headers: { Authorization: `Bearer ${token}` } };
                                                        const res = await axios.get(`${API_URL}/clients/${client.id}`, config);
                                                        setEditingClient(res.data.data);
                                                        setIsViewOnly(false);
                                                        setModalVisible(true);
                                                    } catch (e) {
                                                        setEditingClient(client);
                                                        setIsViewOnly(false);
                                                        setModalVisible(true);
                                                    }
                                                }}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={20} color="#6c7ae0" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteClient(client)}
                                            >
                                                <MaterialCommunityIcons name="trash-can" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                            {filteredClients.length === 0 && (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="domain-off" size={64} color="#e2e8f0" />
                                    <Text style={styles.emptyTitle}>No Clients Found</Text>
                                    <Text style={styles.emptySubtitle}>Try adjusting your search or add a new client.</Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Pagination Bar */}
                        {filteredClients.length > 0 && (
                            <View style={styles.paginationBar}>
                                <Text style={styles.paginationInfo}>
                                    Showing {Math.min(filteredClients.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredClients.length, currentPage * itemsPerPage)} of {filteredClients.length}
                                </Text>
                                <View style={styles.paginationControls}>
                                    <TouchableOpacity
                                        style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                        onPress={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <MaterialCommunityIcons name="chevron-double-left" size={20} color={currentPage === 1 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                        onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <MaterialCommunityIcons name="chevron-left" size={20} color={currentPage === 1 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>

                                    {[...Array(Math.ceil(filteredClients.length / itemsPerPage))].map((_, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.pageNumberBtn, currentPage === i + 1 && styles.pageNumberBtnActive]}
                                            onPress={() => setCurrentPage(i + 1)}
                                        >
                                            <Text style={[styles.pageNumberText, currentPage === i + 1 && styles.pageNumberTextActive]}>
                                                {i + 1}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                    <TouchableOpacity
                                        style={[styles.pageBtn, currentPage === Math.ceil(filteredClients.length / itemsPerPage) && styles.pageBtnDisabled]}
                                        onPress={() => setCurrentPage(prev => Math.min(Math.ceil(filteredClients.length / itemsPerPage), prev + 1))}
                                        disabled={currentPage === Math.ceil(filteredClients.length / itemsPerPage)}
                                    >
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={currentPage === Math.ceil(filteredClients.length / itemsPerPage) ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.pageBtn, currentPage === Math.ceil(filteredClients.length / itemsPerPage) && styles.pageBtnDisabled]}
                                        onPress={() => setCurrentPage(Math.ceil(filteredClients.length / itemsPerPage))}
                                        disabled={currentPage === Math.ceil(filteredClients.length / itemsPerPage)}
                                    >
                                        <MaterialCommunityIcons name="chevron-double-right" size={20} color={currentPage === Math.ceil(filteredClients.length / itemsPerPage) ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </View>

            <ClientFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveClient}
                client={editingClient}
                readOnly={isViewOnly}
            />

            <AlertDialog
                visible={alertConfig.visible}
                onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

            <ConfirmDialog
                visible={confirmConfig.visible}
                onDismiss={() => setConfirmConfig({ ...confirmConfig, visible: false })}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                danger={confirmConfig.danger}
            />
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1e293b',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    list: {
        flexGrow: 1,
    },
    tableWrapper: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 0,
        shadowColor: '#6c7ae0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        overflow: 'hidden',
    },
    tableContainer: {
        flex: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#6c7ae0',
        paddingHorizontal: 24,
        paddingVertical: 18,
    },
    headerCell: {
        justifyContent: 'center',
    },
    headerCellText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
        borderStyle: 'dashed',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    cell: {
        // Vertical centering is handled by tableRow (alignItems: center)
    },
    clientIconSmall: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    clientNameText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    cellText: {
        fontSize: 14,
        color: '#475569',
    },
    cellTextBold: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    cellTextLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginLeft: 4,
    },
    usageContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statusBadgeSmall: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusActive: {
        backgroundColor: '#f0fdf4',
    },
    statusInactive: {
        backgroundColor: '#fef2f2',
    },
    statusTextSmall: {
        fontSize: 11,
        fontWeight: '700',
    },
    paginationBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: 'white',
    },
    paginationInfo: {
        fontSize: 13,
        color: '#64748b',
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pageBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    pageBtnDisabled: {
        opacity: 0.5,
    },
    pageNumberBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    pageNumberBtnActive: {
        backgroundColor: '#6c7ae0',
    },
    pageNumberText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    pageNumberTextActive: {
        color: 'white',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#475569',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#94a3b8',
        marginTop: 8,
    }
});

export default ClientsScreen;
