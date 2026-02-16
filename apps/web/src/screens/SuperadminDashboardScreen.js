import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, Image, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import KpiCard from '../components/KpiCard';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import ClientFormModal from '../components/modals/ClientFormModal';
import CompanyFormModal from '../components/modals/CompanyFormModal';
import EmployeeFormModal from '../components/modals/EmployeeFormModal';
import AlertDialog from '../components/AlertDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import AssetStatusOverviewChart from '../components/AssetStatusOverviewChart';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const SuperadminDashboardScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1200; // Layout breakpoint
    const { token } = useAuthStore();
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [globalKpis, setGlobalKpis] = useState({
        totalClients: 0,
        totalCompanies: 0,
        totalEmployees: 0,
        totalAssets: 0
    });

    // Modals
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [companyModalVisible, setCompanyModalVisible] = useState(false);
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [editingCompany, setEditingCompany] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Filter/Search
    const [clientSearch, setClientSearch] = useState('');
    const [companySearch, setCompanySearch] = useState('');

    // Dialog States
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [confirmConfig, setConfirmConfig] = useState({ visible: false, title: '', message: '', onConfirm: () => { }, danger: false });

    // Helpers
    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const showConfirm = (title, message, onConfirm, danger = false) => {
        setConfirmConfig({ visible: true, title, message, onConfirm, danger });
    };

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [clientsRes, kpisRes] = await Promise.all([
                axios.get(`${API_URL}/clients`, config),
                axios.get(`${API_URL}/clients/kpis`, config)
            ]);
            setClients(clientsRes.data?.data || []);
            setGlobalKpis(kpisRes.data?.data || { totalClients: 0, totalCompanies: 0, totalEmployees: 0, totalAssets: 0 });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    // --- Client Handlers ---

    const handleSaveClient = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (editingClient) {
                await axios.put(`${API_URL}/clients/${editingClient.id}`, data, config);
                showAlert('Success', 'Client updated successfully!', 'success');
            } else {
                await axios.post(`${API_URL}/clients`, data, config);
                showAlert('Success', 'Client created successfully!', 'success');
            }
            fetchData();
        } catch (error) {
            console.error('Error saving client:', error);
            showAlert('Error', 'Failed to save client: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const handleDeleteClient = (client) => {
        showConfirm(
            'Delete Client',
            `Are you sure you want to delete ${client.name}? This action cannot be undone.`,
            async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.delete(`${API_URL}/clients/${client.id}`, config);
                    if (selectedClient?.id === client.id) setSelectedClient(null);
                    fetchData();
                    showAlert('Deleted', 'Client has been removed.', 'success');
                } catch (error) {
                    console.error('Error deleting client:', error);
                    showAlert('Error', 'Failed to delete client.', 'error');
                }
            },
            true
        );
    };

    const handleSelectClient = async (client) => {
        if (selectedClient?.id === client.id) return;
        setSelectedClient(client);
        setSelectedCompany(null);

        // Fetch details to get full object (e.g. companies list if not included in list view)
        setDetailsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_URL}/clients/${client.id}`, config);
            setSelectedClient(response.data.data);
        } catch (error) {
            console.error('Error fetching client details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    // --- Company Handlers ---

    const handleSaveCompany = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (editingCompany) {
                await axios.put(`${API_URL}/companies/${editingCompany.id}`, data, config);
                showAlert('Success', 'Company updated successfully!', 'success');
            } else {
                await axios.post(`${API_URL}/companies`, data, config);
                showAlert('Success', 'Company created successfully!', 'success');
            }
            if (selectedClient) handleSelectClient(selectedClient); // Refresh list
            fetchData(); // Refresh global KPIs
        } catch (error) {
            console.error('Error saving company:', error);
            showAlert('Error', 'Failed to save company: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const handleDeleteCompany = (company) => {
        showConfirm(
            'Delete Company',
            `Are you sure you want to delete ${company.name}?`,
            async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.delete(`${API_URL}/companies/${company.id}`, config);
                    if (selectedCompany?.id === company.id) setSelectedCompany(null);
                    if (selectedClient) handleSelectClient(selectedClient);
                    fetchData();
                    showAlert('Deleted', 'Company has been removed.', 'success');
                } catch (error) {
                    console.error('Error deleting company:', error);
                    showAlert('Error', 'Failed to delete company.', 'error');
                }
            },
            true
        );
    };

    const handleSelectCompany = async (company) => {
        setSelectedCompany(company);
        // Fetch company documents or other details if needed, but basic details are usually in the list item
        // Could fetch stats here
    };

    // --- Employee Handlers ---
    const handleSaveEmployee = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_URL}/employees`, data, config);
            if (selectedClient) handleSelectClient(selectedClient);
            fetchData();
            showAlert('Success', 'Employee added successfully!', 'success');
        } catch (error) {
            console.error('Error saving employee:', error);
            if (error.response?.data?.message === 'PRIVILEGE_DENIED') {
                showAlert('Access Denied', 'This company does not have permission to add employees.', 'error');
            } else if (error.response?.data?.message === 'LIMIT_EXCEEDED') {
                showAlert('Limit Exceeded', error.response.data.detail, 'warning');
            } else {
                showAlert('Error', 'Failed to add employee: ' + (error.response?.data?.message || error.message), 'error');
            }
            throw error;
        }
    };


    if (loading) {
        return (
            <AppLayout navigation={navigation} title="Superadmin Control Center">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            </AppLayout>
        );
    }

    return (
        <AppLayout navigation={navigation} title="Superadmin Control Center">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* KPI Section */}
                <View style={[styles.kpiContainer, isMobile && { padding: 16, gap: 12 }]}>
                    <KpiCard
                        title="Total Clients"
                        value={(globalKpis?.totalClients || 0).toString()}
                        icon="domain"
                        gradientColors={['#3b82f6', '#2563eb']}
                        style={{ minWidth: isMobile ? '45%' : 200, margin: isMobile ? 4 : 8 }}
                    />
                    <KpiCard
                        title="Total Companies"
                        value={(globalKpis?.totalCompanies || 0).toString()}
                        icon="office-building"
                        gradientColors={['#10b981', '#059669']}
                        style={{ minWidth: isMobile ? '45%' : 200, margin: isMobile ? 4 : 8 }}
                    />
                    <KpiCard
                        title="Total Employees"
                        value={(globalKpis?.totalEmployees || 0).toString()}
                        icon="account-group"
                        gradientColors={['#8b5cf6', '#7c3aed']}
                        style={{ minWidth: isMobile ? '45%' : 200, margin: isMobile ? 4 : 8 }}
                    />
                    <KpiCard
                        title="Total Assets"
                        value={(globalKpis?.totalAssets || 0).toString()}
                        icon="cube-outline"
                        gradientColors={['#f59e0b', '#d97706']}
                        style={{ minWidth: isMobile ? '45%' : 200, margin: isMobile ? 4 : 8 }}
                    />
                </View>

                {/* Main Content Areas */}
                <View style={[
                    styles.threeColumnLayout,
                    isMobile && { flexDirection: 'column', height: 'auto', padding: 16, gap: 16 }
                ]}>

                    {/* Column 1: Clients List */}
                    <View style={[styles.column, isMobile && { height: 500 }]}>
                        <View style={styles.columnHeader}>
                            <Text style={styles.columnTitle}>Clients</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => { setEditingClient(null); setClientModalVisible(true); }}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBar}>
                            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search clients..."
                                value={clientSearch}
                                onChangeText={setClientSearch}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                            {(clients || []).filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                                <TouchableOpacity
                                    key={client.id}
                                    style={[styles.card, selectedClient?.id === client.id && styles.activeCard]}
                                    onPress={() => handleSelectClient(client)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{client.name}</Text>
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity onPress={async () => {
                                                try {
                                                    const config = { headers: { Authorization: `Bearer ${token}` } };
                                                    const res = await axios.get(`${API_URL}/clients/${client.id}`, config);
                                                    setEditingClient(res.data.data);
                                                } catch (e) {
                                                    setEditingClient(client);
                                                }
                                                setClientModalVisible(true);
                                            }}>
                                                <MaterialCommunityIcons name="pencil" size={16} color="#3b82f6" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteClient(client)}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                            <View style={[styles.statusBadge, client.status === 'ACTIVE' ? styles.statusActive : styles.statusSuspended]}>
                                                <Text style={[styles.statusText, client.status === 'ACTIVE' ? { color: '#16a34a' } : { color: '#dc2626' }]}>{client.status}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <Text style={styles.cardSubtitle}>Limits: {client.max_companies} Companies</Text>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${Math.min(((client.companies_count || 0) / (client.max_companies || 1)) * 100, 100)}%` }]} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Column 2: Companies List */}
                    <View style={[styles.column, isMobile && { height: 500 }]}>
                        {selectedClient ? (
                            <>
                                <View style={styles.columnHeader}>
                                    <Text style={styles.columnTitle} numberOfLines={1}>{selectedClient.name} — Companies</Text>
                                    <TouchableOpacity
                                        style={[styles.addButton, (selectedClient.companies_count >= selectedClient.max_companies) && styles.disabledButton]}
                                        disabled={selectedClient.companies_count >= selectedClient.max_companies}
                                        onPress={() => { setEditingCompany(null); setCompanyModalVisible(true); }}
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.searchBar}>
                                    <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search companies..."
                                        value={companySearch}
                                        onChangeText={setCompanySearch}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>

                                {detailsLoading ? (
                                    <ActivityIndicator style={{ marginTop: 20 }} color="#3b82f6" />
                                ) : (
                                    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                                        {(selectedClient.companies || [])
                                            .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                                            .map(company => (
                                                <TouchableOpacity
                                                    key={company.id}
                                                    style={[styles.card, selectedCompany?.id === company.id && styles.activeCard]}
                                                    onPress={() => handleSelectCompany(company)}
                                                >
                                                    <View style={styles.cardHeader}>
                                                        <Text style={styles.cardTitle}>{company.name}</Text>
                                                        <View style={styles.cardActions}>
                                                            <TouchableOpacity onPress={() => { setEditingCompany(company); setCompanyModalVisible(true); }}>
                                                                <MaterialCommunityIcons name="pencil" size={16} color="#3b82f6" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleDeleteCompany(company)}>
                                                                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>

                                                    <View style={styles.statsRow}>
                                                        <View style={styles.statusBadgeSmall}>
                                                            <Text style={styles.statusTextSmall}>ACTIVE</Text>
                                                        </View>
                                                        <Text style={styles.statsText}>{company.employee_count}/{selectedClient.max_employees || 100} EMP</Text>
                                                        <Text style={styles.statsText}>{company.asset_count}/{selectedClient.max_assets || 500} AST</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        {(!selectedClient.companies || selectedClient.companies.length === 0) && (
                                            <View style={styles.emptyState}>
                                                <Text style={styles.emptyText}>No companies found.</Text>
                                            </View>
                                        )}
                                    </ScrollView>
                                )}
                            </>
                        ) : (
                            <View style={styles.emptyColumnState}>
                                <MaterialCommunityIcons name="domain" size={48} color="#e2e8f0" />
                                <Text style={styles.emptyText}>Select a client to manage companies</Text>
                            </View>
                        )}
                    </View>

                    {/* Column 3: Details */}
                    <View style={[styles.column, isMobile && { height: 'auto', minHeight: 400 }]}>
                        {(selectedCompany || selectedClient) ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailsHeader}>
                                    <Text style={styles.detailTitle}>
                                        {selectedCompany ? `${selectedCompany.name} Details` : `${selectedClient?.name} Details`}
                                    </Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionHeader}>IDENTITY & TENANCY</Text>
                                    <DetailRow label="Code" value={selectedCompany?.company_code || selectedClient?.company_code || 'N/A'} />
                                    <DetailRow label="Industry" value={selectedCompany?.industry || selectedClient?.industry || 'N/A'} />
                                    <DetailRow label="Tenancy" value={selectedCompany ? (selectedClient?.tenancy_type || 'OWNED') : (selectedClient?.tenancy_type || 'OWNED')} isGreen={true} />
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionHeader}>LOCATION & CONTACT</Text>
                                    {selectedCompany ? (
                                        <>
                                            <Text style={styles.detailValue}>{selectedCompany.address || 'No address'}</Text>
                                            <Text style={styles.detailSub}>{selectedCompany.city ? `${selectedCompany.city}, ${selectedCompany.country}` : 'No location set'}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.detailValue}>{selectedClient.address || 'No address'}</Text>
                                            <Text style={styles.detailSub}>{selectedClient.city ? `${selectedClient.city}, ${selectedClient.country}` : 'No location set'}</Text>
                                        </>
                                    )}
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionHeader}>USAGE LIMITS</Text>
                                    <DetailRow label="Employees" value={selectedCompany ? `${selectedCompany.employee_count}` : `${Object.values(selectedClient.companies || {}).reduce((acc, c) => acc + (c.employee_count || 0), 0)} / ${selectedClient.max_employees}`} />
                                    <DetailRow label="Assets" value={selectedCompany ? `${selectedCompany.asset_count}` : `${Object.values(selectedClient.companies || {}).reduce((acc, c) => acc + (c.asset_count || 0), 0)} / ${selectedClient.max_assets}`} />
                                </View>

                                {selectedCompany && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionHeader}>ACTIONS</Text>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => { setEditingEmployee(null); setEmployeeModalVisible(true); }}
                                        >
                                            <MaterialCommunityIcons name="account-plus" size={18} color="#3b82f6" />
                                            <Text style={styles.actionButtonText}>Add Employee</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                            </ScrollView>
                        ) : (
                            <View style={styles.emptyColumnState}>
                                <MaterialCommunityIcons name="information-outline" size={48} color="#e2e8f0" />
                                <Text style={styles.emptyText}>Select an item to view details</Text>
                            </View>
                        )}
                    </View>

                </View>

                {/* Chart Section - Split 50/50 */}
                <View style={[styles.chartRow, isMobile && { flexDirection: 'column', paddingHorizontal: 16, marginTop: 16 }]}>
                    <View style={[styles.chartHalf, isMobile && { height: 'auto', marginBottom: 16 }]}>
                        <AssetStatusOverviewChart />
                    </View>
                    <View style={[styles.chartHalf, isMobile && { height: 'auto' }]}>
                    </View>
                </View>
            </ScrollView>

            {/* Modals */}

            {/* Modals */}

            <ClientFormModal
                visible={clientModalVisible}
                onClose={() => { setClientModalVisible(false); setEditingClient(null); }}
                onSave={handleSaveClient}
                client={editingClient}
            />
            <CompanyFormModal
                visible={companyModalVisible}
                onClose={() => { setCompanyModalVisible(false); setEditingCompany(null); }}
                onSave={handleSaveCompany}
                clientId={selectedClient?.id}
                clientName={selectedClient?.name}
                company={editingCompany}
            />
            <EmployeeFormModal
                visible={employeeModalVisible}
                onClose={() => { setEmployeeModalVisible(false); setEditingEmployee(null); }}
                onSave={handleSaveEmployee}
                companyId={selectedCompany?.id}
                companyName={selectedCompany?.name}
                employee={editingEmployee}
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
        </AppLayout >
    );
};

const DetailRow = ({ label, value, isGreen }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValueRight, isGreen && { color: '#16a34a', fontWeight: '700' }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    kpiContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 32,
        paddingBottom: 0,
    },
    threeColumnLayout: {
        height: 750,
        flexDirection: 'row',
        padding: 32,
        gap: 24,
    },
    column: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    columnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: { opacity: 0.5 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#334155',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    listContainer: {
        flex: 1,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    activeCard: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#f1f5f9',
    },
    statusActive: { backgroundColor: '#dcfce7' },
    statusSuspended: { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    cardSubtitle: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 6,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
    },

    // Column 2 Items
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    chartRow: {
        flexDirection: 'row',
        paddingHorizontal: 32,
        marginTop: 24,
        gap: 24,
    },
    chartHalf: {
        flex: 1,
        height: 300,
    },
    assetImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    placeholderCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        flex: 1,
        minHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    statusBadgeSmall: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextSmall: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statsText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
    },

    // Details
    detailsHeader: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    detailSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    detailValueRight: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '500',
        textAlign: 'right',
    },
    detailValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
        marginBottom: 4,
    },
    detailSub: {
        fontSize: 13,
        color: '#64748b',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
    },

    emptyColumnState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: '#94a3b8', marginTop: 12, textAlign: 'center' },
});

export default SuperadminDashboardScreen;
