import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import KpiCard from '../components/KpiCard';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import CompanyFormModal from '../components/modals/CompanyFormModal';
import CompanyDetailsModal from '../components/modals/CompanyDetailsModal';
import EmployeeFormModal from '../components/modals/EmployeeFormModal';
import EmployeeDetailsModal from '../components/modals/EmployeeDetailsModal';
import AlertDialog from '../components/AlertDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import CompanyInfoView from '../components/CompanyInfoView'; // Reusable component
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const GroupManagementScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1024; // Tablet/Mobile Breakpoint

    const { token, user } = useAuthStore();
    const [client, setClient] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [employees, setEmployees] = useState([]);

    const [companyModalVisible, setCompanyModalVisible] = useState(false);
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [detailsEmpModalVisible, setDetailsEmpModalVisible] = useState(false);
    const [viewingCompany, setViewingCompany] = useState(null);
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [editingCompany, setEditingCompany] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'staff'

    // Dialog States
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [confirmConfig, setConfirmConfig] = useState({ visible: false, title: '', message: '', onConfirm: () => { }, danger: false });

    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const showConfirm = (title, message, onConfirm, danger = false) => {
        setConfirmConfig({ visible: true, title, message, onConfirm, danger });
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const myId = user?.client_id;

            if (myId) {
                // Scenario A: User is linked to a Client (Super Admin or branched Company Admin)
                await fetchClientInfo(myId, config);
            } else {
                // Scenario B: Standalone Company Admin (or Client ID missing)
                // We MUST fetch the list first because user.company_id might be 404 (deleted)
                try {
                    const allCompRes = await axios.get(`${API_URL}/companies`, config);
                    const allComps = allCompRes.data.data || [];
                    console.log('[GroupManagementScreen] Fetched companies:', allComps.length, 'First comp admin info:', allComps[0] ? { name: allComps[0].name, admin_name: allComps[0].admin_name } : 'none');

                    if (allComps.length > 0) {
                        // We found companies! Use the first one to determine "Client" context if needed
                        const firstComp = allComps[0];

                        // If the first company has a client_id, we should probably be using that client view
                        if (firstComp.client_id && !myId) {
                            await fetchClientInfo(firstComp.client_id, config);
                        } else {
                            // True Standalone Mode: Use the company name as the header
                            setClient({ name: firstComp.name, id: 'standalone' });
                            setCompanies(allComps);

                            // Select the first company if none selected, or if current selection is invalid
                            if (!selectedCompany || !allComps.find(c => c.id === selectedCompany.id)) {
                                handleSelectCompany(firstComp);
                            } else {
                                // Refresh the currently selected company data
                                const updated = allComps.find(c => c.id === selectedCompany.id);
                                if (updated) setSelectedCompany(updated);
                            }
                        }
                    } else {
                        // List is empty. If we still have a local company_id, try that as a last resort hail mary.
                        console.warn('Company list empty, trying direct fetch by ID...');
                        if (user?.company_id) {
                            const compRes = await axios.get(`${API_URL}/companies/${user.company_id}`, config);
                            const companyData = compRes.data.data;
                            setClient({ name: companyData.name, id: 'standalone' });
                            setCompanies([companyData]);
                            handleSelectCompany(companyData);
                        }
                    }
                } catch (listError) {
                    console.error('Error in company list fetch:', listError);
                    // Fallback to original behavior
                    if (user?.company_id) {
                        const compRes = await axios.get(`${API_URL}/companies/${user.company_id}`, config);
                        const companyData = compRes.data.data;
                        if (companyData.client_id) {
                            return await fetchClientInfo(companyData.client_id, config);
                        } else {
                            setClient({ name: companyData.name, id: 'standalone' });
                            setCompanies([companyData]);
                            handleSelectCompany(companyData);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setDetailsLoading(false);
        }
    };

    const fetchClientInfo = async (clientId, config) => {
        const clientRes = await axios.get(`${API_URL}/clients/${clientId}`, config);
        const fetchedCompanies = clientRes.data.data.companies || [];
        console.log('[GroupManagementScreen] Fetched client companies:', fetchedCompanies.length, 'First comp admin info:', fetchedCompanies[0] ? { name: fetchedCompanies[0].name, admin_name: fetchedCompanies[0].admin_name } : 'none');
        setClient(clientRes.data.data);
        setCompanies(fetchedCompanies);

        // Auto-select the first company if none is selected
        if (!selectedCompany && fetchedCompanies.length > 0) {
            handleSelectCompany(fetchedCompanies[0]);
        } else if (selectedCompany) {
            // Keep current selection updated but don't re-trigger full fetch here
            // because handleSaveEmployee will call handleSelectCompany specifically
            const updated = fetchedCompanies.find(c => c.id === selectedCompany.id);
            if (updated) setSelectedCompany(updated);
        }
        return fetchedCompanies;
    };

    const handleSelectCompany = async (company, isRefresh = false) => {
        if (!isRefresh) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setSelectedCompany(company);
        if (!isRefresh) setDetailsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const empRes = await axios.get(`${API_URL}/employees?company_id=${company.id}`, config);
            setEmployees(empRes.data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleSaveCompany = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const realClientId = client?.id && client.id !== 'standalone' ? client.id : null;
            const payload = { ...data, client_id: realClientId };

            let response;
            if (editingCompany) {
                console.log('[handleSaveCompany] PUT updating company', editingCompany.id);
                response = await axios.put(`${API_URL}/companies/${editingCompany.id}`, payload, config);
                console.log('[handleSaveCompany] PUT done');
                showAlert('Success', 'Company updated successfully.', 'success');
            } else {
                console.log('[handleSaveCompany] POST creating company, payload keys:', Object.keys(payload));
                response = await axios.post(`${API_URL}/companies`, payload, config);
                console.log('[handleSaveCompany] POST done, response:', response.data);
                showAlert('Success', 'New company added to your group.', 'success');
            }

            // Construct the full company object for optimistic update
            // Prioritize server data (savedData) as it now includes admin joins
            const savedData = response.data.data;
            const fullSavedCompany = {
                ...savedData,
                employee_count: savedData.employee_count !== undefined ? savedData.employee_count : (editingCompany ? editingCompany.employee_count : 0),
                asset_count: savedData.asset_count !== undefined ? savedData.asset_count : (editingCompany ? editingCompany.asset_count : 0)
            };

            // Manual State Update for Immediate Feedback
            setCompanies(prev => {
                const list = prev || [];
                if (editingCompany) {
                    return list.map(c => c.id === fullSavedCompany.id ? fullSavedCompany : c);
                } else {
                    return [...list, fullSavedCompany];
                }
            });

            // If it's a new company, auto-select it
            if (!editingCompany) {
                handleSelectCompany(fullSavedCompany);
            } else if (selectedCompany?.id === fullSavedCompany.id) {
                // If editing the currently selected company, update the detail view too
                setSelectedCompany(fullSavedCompany);
            }

            // Refresh list in background - don't await this to prevent blocking the modal close
            console.log('[handleSaveCompany] Triggering background fetchData...');
            fetchData(true).catch(err => console.error('[handleSaveCompany] Background fetch failed:', err));

            return fullSavedCompany;
        } catch (error) {
            console.error('[handleSaveCompany] ERROR:', error.response?.data || error.message);
            showAlert('Error', error.response?.data?.message || error.message, 'error');
            throw error;
        }
    };

    const handleSaveEmployee = async (data) => {
        setDetailsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { ...data, company_id: selectedCompany?.id };

            if (!payload.company_id) {
                throw new Error('No company context found. Please select a company.');
            }

            console.log('[handleSaveEmployee] Starting API call...');
            let res;
            if (editingEmployee) {
                res = await axios.put(`${API_URL}/employees/${editingEmployee.id}`, payload, config);
                console.log('[handleSaveEmployee] PUT success');
                showAlert('Success', 'Employee updated successfully.', 'success');
            } else {
                res = await axios.post(`${API_URL}/employees`, payload, config);
                console.log('[handleSaveEmployee] POST success');
                showAlert('Success', 'Employee added successfully.', 'success');
            }

            // DO NOT AWAIT background refreshes
            // This allows the modal to close immediately
            (async () => {
                try {
                    await Promise.all([
                        fetchData(true),
                        axios.get(`${API_URL}/employees?company_id=${payload.company_id}`, config)
                    ]).then(([_, empRes]) => {
                        if (empRes.data.success) {
                            setEmployees(empRes.data.data);
                        }
                    });
                } catch (bgError) {
                    console.error('Background refresh failed:', bgError);
                }
            })();

            return res.data;
        } catch (error) {
            console.error('[handleSaveEmployee] Error:', error);
            const msg = error.response?.data?.message || error.response?.data?.detail || error.message;
            showAlert('Error', msg, 'error');
            throw error; // Re-throw to keep modal loading state if it failed
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDeleteCompany = async (companyId) => {
        showConfirm(
            'Delete Company',
            'Are you sure you want to delete this company? This action cannot be undone.',
            async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.delete(`${API_URL}/companies/${companyId}`, config);
                    showAlert('Success', 'Company deleted successfully.', 'success');
                    if (selectedCompany?.id === companyId) setSelectedCompany(null);
                    await fetchData(true);
                } catch (error) {
                    showAlert('Error', error.response?.data?.message || error.message, 'error');
                }
            },
            true
        );
    };

    const handleDeleteEmployee = async (employeeId) => {
        showConfirm(
            'Delete Staff',
            'Are you sure you want to remove this staff member?',
            async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.delete(`${API_URL}/employees/${employeeId}`, config);
                    showAlert('Success', 'Staff member removed.', 'success');

                    if (selectedCompany) {
                        const empRes = await axios.get(`${API_URL}/employees?company_id=${selectedCompany.id}`, config);
                        setEmployees(empRes.data.data);
                        await fetchData(true); // Refresh counts
                    }
                } catch (error) {
                    showAlert('Error', error.response?.data?.message || error.message, 'error');
                }
            },
            true
        );
    };

    return (
        <AppLayout navigation={navigation}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Group Management</Text>
                        <Text style={styles.subtitle}>{client?.name || 'Loading...'}</Text>
                    </View>
                </View>

                <View style={[styles.mainGrid, isMobile && { flexDirection: 'column' }]}>
                    {/* COMPANIES LIST */}
                    <View style={styles.listSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Companies in Group</Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => {
                                    setEditingCompany(null);
                                    setCompanyModalVisible(true);
                                }}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="white" />
                                <Text style={styles.primaryBtnText}>Add Company</Text>
                            </TouchableOpacity>
                        </View>
                        {loading ? (
                            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                        ) : (
                            companies.map((comp, idx) => (
                                <TouchableOpacity
                                    key={`comp-${comp.id}-${idx}`}
                                    style={[styles.itemCard, selectedCompany?.id === comp.id && styles.activeCard]}
                                    onPress={() => handleSelectCompany(comp)}
                                >
                                    <View style={styles.itemHeader}>
                                        <View style={styles.iconBox}>
                                            <MaterialCommunityIcons name="domain" size={24} color="#3b82f6" />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.itemName}>{comp.name}</Text>
                                            <Text style={styles.itemMeta}>{comp.subdomain}.trakio.com</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                onPress={() => { setViewingCompany(comp); setDetailsModalVisible(true); }}
                                                style={{ marginRight: 8 }}
                                            >
                                                <MaterialCommunityIcons name="eye-outline" size={20} color="#6366f1" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => { setEditingCompany(comp); setCompanyModalVisible(true); }}>
                                                <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteCompany(comp.id)}
                                                style={{ marginLeft: 8 }}
                                            >
                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={[styles.itemStats, isMobile && { flexDirection: 'row', justifyContent: 'space-around', gap: 10 }]}>
                                        <View style={styles.statMini}>
                                            <Text style={styles.statVal}>{comp.employee_count || 0}</Text>
                                            <Text style={styles.statLab}>Staff</Text>
                                        </View>
                                        <View style={styles.statMini}>
                                            <Text style={styles.statVal}>{comp.asset_count || 0}</Text>
                                            <Text style={styles.statLab}>Assets</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                        {!loading && companies.length === 0 && (
                            <View style={styles.emptyListState}>
                                <Text style={styles.emptyListText}>No companies yet.</Text>
                                <Text style={styles.emptyListSubText}>Add your first company using the button above.</Text>
                            </View>
                        )}
                    </View>

                    {/* EMPLOYEES / DETAILS */}
                    <View style={styles.detailsSection}>
                        {selectedCompany ? (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Staff: {selectedCompany.name}</Text>
                                    <TouchableOpacity
                                        style={styles.addSmallBtn}
                                        onPress={() => {
                                            setEditingEmployee(null);
                                            setEmployeeModalVisible(true);
                                        }}
                                    >
                                        <MaterialCommunityIcons name="plus" size={16} color="white" />
                                        <Text style={styles.addSmallBtnText}>Add Staff</Text>
                                    </TouchableOpacity>
                                </View>

                                {detailsLoading ? (
                                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                                ) : (
                                    <View style={styles.empList}>
                                        {employees.map((emp, idx) => (
                                            <View key={`emp-${emp.id}-${idx}`} style={styles.empRow}>
                                                <View style={styles.empAvatar}>
                                                    <Text style={styles.empAvatarText}>{emp.name?.[0]}</Text>
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 12 }}>
                                                    <Text style={styles.empName}>{emp.name}</Text>
                                                    <Text style={styles.empPos}>{emp.position || 'Employee'}</Text>

                                                    <View style={styles.empContactInfo}>
                                                        <View style={styles.contactItem}>
                                                            <MaterialCommunityIcons name="email-outline" size={14} color="#94a3b8" />
                                                            <Text style={styles.contactText}>{emp.email}</Text>
                                                        </View>
                                                        {emp.phone && (
                                                            <View style={styles.contactItem}>
                                                                <MaterialCommunityIcons name="phone-outline" size={14} color="#94a3b8" />
                                                                <Text style={styles.contactText}>{emp.phone}</Text>
                                                            </View>
                                                        )}
                                                        {emp.employee_id_card && (
                                                            <View style={styles.contactItem}>
                                                                <MaterialCommunityIcons name="card-account-details-outline" size={14} color="#94a3b8" />
                                                                <Text style={styles.contactText}>{emp.employee_id_card}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <View style={styles.empActionsRow}>
                                                    <TouchableOpacity
                                                        style={[styles.editEmpBtn, { backgroundColor: '#f5f3ff', marginRight: 8 }]}
                                                        onPress={() => { setViewingEmployee(emp); setDetailsEmpModalVisible(true); }}
                                                    >
                                                        <MaterialCommunityIcons name="eye-outline" size={18} color="#7c3aed" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.editEmpBtn}
                                                        onPress={() => { setEditingEmployee(emp); setEmployeeModalVisible(true); }}
                                                    >
                                                        <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.editEmpBtn, { backgroundColor: '#fef2f2', marginLeft: 8 }]}
                                                        onPress={() => handleDeleteEmployee(emp.id)}
                                                    >
                                                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                        {employees.length === 0 && (
                                            <Text style={styles.emptyText}>No employees found for this company.</Text>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="cursor-default-click-outline" size={48} color="#e2e8f0" />
                                <Text style={styles.emptyStateText}>Select a company to manage staff</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <CompanyFormModal
                visible={companyModalVisible}
                onClose={() => setCompanyModalVisible(false)}
                onSave={handleSaveCompany}
                company={editingCompany}
                clientId={client?.id}
                clientName={client?.name}
            />

            <CompanyDetailsModal
                visible={detailsModalVisible}
                onClose={() => setDetailsModalVisible(false)}
                company={viewingCompany}
            />

            <EmployeeFormModal
                visible={employeeModalVisible}
                onClose={() => setEmployeeModalVisible(false)}
                onSave={handleSaveEmployee}
                employee={editingEmployee}
                companyId={selectedCompany?.id}
            />

            <EmployeeDetailsModal
                visible={detailsEmpModalVisible}
                onClose={() => setDetailsEmpModalVisible(false)}
                employee={viewingEmployee}
            />

            <AlertDialog
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
            />

            <ConfirmDialog
                visible={confirmConfig.visible}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onDismiss={() => setConfirmConfig({ ...confirmConfig, visible: false })}
                danger={confirmConfig.danger}
            />
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4,
    },
    primaryBtn: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    primaryBtnText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    mainGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 24,
    },
    listSection: {
        flex: 1,
    },
    detailsSection: {
        flex: 2,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        minHeight: 400,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    activeCard: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    itemMeta: {
        fontSize: 12,
        color: '#64748b',
    },
    itemStats: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: 24,
    },
    statMini: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    statVal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statLab: {
        fontSize: 12,
        color: '#64748b',
    },
    empList: {
        gap: 12,
    },
    empRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    empAvatar: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    empAvatarText: {
        color: 'white',
        fontWeight: 'bold',
    },
    empName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    empPos: {
        fontSize: 12,
        color: '#64748b',
    },
    addSmallBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    addSmallBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    empContactInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 6,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    contactText: {
        fontSize: 12,
        color: '#64748b',
    },
    editEmpBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    empActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 4,
        gap: 4
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6
    },
    tabBtnActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b'
    },
    tabTextActive: {
        color: '#3b82f6',
        fontWeight: '700'
    },
    emptyListState: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderStyle: 'dashed'
    },
    emptyListText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b'
    },
    emptyListSubText: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4
    }
});

export default GroupManagementScreen;
