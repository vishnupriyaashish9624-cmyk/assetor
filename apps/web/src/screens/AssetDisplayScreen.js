import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Card, Text, Button, IconButton, ActivityIndicator, Chip, DataTable, Portal, Modal, Surface, TextInput, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/client';
import AppLayout from '../components/AppLayout';
import PremisesWizardModal from '../components/modals/PremisesWizardModal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';

const parseFileConfig = (str) => {
    if (str && str.startsWith("JSON:")) {
        try { return JSON.parse(str.replace("JSON:", "")); } catch (e) { return {}; }
    }
    return {};
};

const AssetDisplayScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1024; // Mobile/Tablet breakpoint (Expanded to include tablets/small laptops)
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [premises, setPremises] = useState([]);

    // Pagination State
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Delete Confirmation Dialog State
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Detail View State
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [wizardVisible, setWizardVisible] = useState(false);
    const [wizardInitialData, setWizardInitialData] = useState(null);

    // Dynamic Premises Detail State
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [moduleDetails, setModuleDetails] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [selectedModule, setSelectedModule] = useState(null);

    useEffect(() => {
        fetchModules();
    }, []);

    // Pagination & Search Effects
    useEffect(() => {
        fetchPremises();
    }, [page, itemsPerPage]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 0) fetchPremises();
            else setPage(0); // This will trigger the above effect
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);


    const fetchPremises = async () => {
        try {
            setLoading(true);
            const res = await api.get('office/premises', {
                params: {
                    page: page + 1,
                    limit: itemsPerPage,
                    search: search
                }
            });
            setPremises(res.data.data || []);
            if (res.data.pagination) {
                setTotalItems(res.data.pagination.totalItems);
            } else {
                setTotalItems(res.data.data?.length || 0);
            }
        } catch (e) {
            console.error('Fetch premises error', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchModules = async () => {
        try {
            setLoading(true);
            const response = await api.get('company-modules');
            setModules(response.data.data || []);
            // After modules, fetch actual data
            fetchPremises();
        } catch (error) {
            console.error('Fetch modules error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPremises = () => {
        setWizardInitialData(null);
        setWizardVisible(true);
    };

    const handleEditPremise = async (item) => {
        try {
            setLoading(true);
            const fullRes = await api.get(`office/premises/${item.premise_id}`);
            const fullData = fullRes.data.data || item;
            setWizardInitialData(fullData);
            setWizardVisible(true);
        } catch (error) {
            console.error('Edit fetch error:', error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to load details for editing', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePremise = (item) => {
        setItemToDelete(item);
        setDeleteDialogVisible(true);
    };

    const confirmDeletePremise = async () => {
        if (!itemToDelete) return;

        try {
            const res = await api.delete(`office/premises/${itemToDelete.premise_id}`);

            if (res.data.success) {
                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: 'Premises deleted successfully!',
                    type: 'success'
                });
                fetchPremises(); // Refresh the list
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: res.data.message || 'Failed to delete premises',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Delete premise error:', error);
            const msg = error.response?.data?.message || 'Failed to delete premises.';
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: msg,
                type: 'error'
            });
        } finally {
            setItemToDelete(null);
        }
    };

    const fetchModuleStructure = async (module, initialData = null) => {
        try {
            setDetailsLoading(true);
            setSelectedModule(module);
            setDetailsVisible(true);
            setModuleDetails([]);
            setFormValues(initialData || {});

            const moduleId = module.module_id || 1;
            const data = initialData || {};

            // 1. Get Sections
            const sectionRes = await api.get(`module-builder/${moduleId}/sections`);
            let sections = sectionRes.data.data || [];

            // 2. Filter Sections: If company has custom sections, OVERRIDE (discard) system defaults (company_id: 1)
            const userCompanyId = (sections.find(s => s.company_id !== 1)?.company_id);
            if (userCompanyId && sections.some(s => s.company_id === userCompanyId)) {
                sections = sections.filter(s => s.company_id === userCompanyId);
            }

            // 3. Get all fields
            let fullStructure = await Promise.all(sections.map(async (sec) => {
                try {
                    const fieldsRes = await api.get(`module-builder/fields?section_id=${sec.id}`);
                    return { ...sec, fields: fieldsRes.data.data || [] };
                } catch (e) {
                    console.error('Field fetch error', e);
                    return { ...sec, fields: [] };
                }
            }));

            // 4. Fetch Filtered Selected Field IDs (Match Wizard logic)
            const params = { module_id: moduleId };
            if (data.country_id) params.country_id = data.country_id;
            if (data.property_type_id) params.property_type_id = data.property_type_id;
            if (data.premises_type_id) params.premises_type_id = data.premises_type_id;
            if (data.area_id) params.area_id = data.area_id;
            if (data.region && data.region !== 'All') params.region = data.region;

            const filterRes = await api.get('company-modules/selected-fields', { params });
            const selectedFieldIds = filterRes.data?.data?.selected_field_ids;

            // 5. Apply Filter to structure
            let finalStructure = [];
            if (!selectedFieldIds) {
                // If no filter, show all active fields
                finalStructure = fullStructure.map(sec => ({
                    ...sec,
                    fields: sec.fields.filter(f => f.is_active !== 0)
                })).filter(s => s.fields.length > 0);
            } else {
                finalStructure = fullStructure.map(sec => ({
                    ...sec,
                    fields: sec.fields.filter(f => selectedFieldIds.some(sid => String(sid) === String(f.id)))
                })).filter(s => s.fields.length > 0);
            }

            setModuleDetails(finalStructure);
        } catch (error) {
            console.error('Fetch structure error:', error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to load structure', type: 'error' });
        } finally {
            setDetailsLoading(false);
        }
    };

    const fetchPremiseSnapshot = async (item) => {
        try {
            setDetailsLoading(true);
            setDetailsVisible(true);
            // 1. Fetch Full Data by ID to get all dynamic fields
            const fullRes = await api.get(`office/premises/${item.premise_id}`);
            const fullData = fullRes.data.data || item;

            // 2. Find module ID 1 (Premises)
            const premModule = modules.find(m => m.module_id == 1) || { module_id: 1, name: 'Premises' };

            // 3. Load structure and show modal
            fetchModuleStructure(premModule, fullData);
        } catch (error) {
            console.error('Fetch snapshot error:', error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to fetch details', type: 'error' });
            setDetailsVisible(false);
        } finally {
            setDetailsLoading(false);
        }
    };

    const renderSection = (sec, index) => {
        const fieldsToRender = (sec.fields || []).filter(f => {
            if (f.is_active === 0) return false;
            const fk = f.field_key || f.field_name || f.name || f.field_label || f.label || `field_${f.id}`;
            return formValues[fk] !== undefined && formValues[fk] !== '';
        });

        if (fieldsToRender.length === 0) return null;

        return (
            <View key={sec.id} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{index}. {sec.name}</Text>
                </View>
                <View style={{ padding: 0 }}>
                    <DataTable style={{ borderWidth: 0 }}>
                        <DataTable.Header style={{ backgroundColor: '#f8fafc', height: 44, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                            <DataTable.Title style={{ flex: 1.5 }} textStyle={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Field Name</DataTable.Title>
                            <DataTable.Title style={{ flex: 2.5 }} textStyle={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Data Value</DataTable.Title>
                        </DataTable.Header>
                        {fieldsToRender.map((f, i) => {
                            const fieldKey = f.field_key || f.field_name || f.name || f.field_label || f.label || `field_${f.id}`;
                            const val = formValues[fieldKey];
                            const isFile = f.field_type === 'file' || f.field_type === 'file_upload' || f.field_type === 'image' || f.field_type === 'signature' || f.field_type === 'pdf' || f.field_type === 'file_pdf' ||
                                (f.label || '').toLowerCase().includes('document') ||
                                (f.label || '').toLowerCase().includes('file') ||
                                (typeof val === 'string' && (val.includes('/uploads/') || val.includes('base64')));

                            const metadata = [
                                { key: 'policy_no', label: 'Policy No.' },
                                { key: 'coverage_type', label: 'Coverage Type' },
                                { key: 'issue_date', label: 'Issue Date' },
                                { key: 'start_date', label: 'Start Date' },
                                { key: 'end_date', label: 'End Date' },
                                { key: 'expiry_date', label: 'Expiry Date' },
                                { key: 'reminder', label: 'Reminder' }
                            ];

                            const populatedMetadata = isFile ? metadata.filter(meta => formValues[`${fieldKey}_${meta.key}`]) : [];
                            const SERVER_URL = 'http://localhost:5032';

                            return (
                                <View key={f.id} style={{ borderBottomWidth: i === fieldsToRender.length - 1 ? 0 : 1, borderBottomColor: '#f1f5f9' }}>
                                    <DataTable.Row style={{ minHeight: isFile ? 72 : 52, paddingVertical: 8 }}>
                                        <DataTable.Cell style={{ flex: 1.5 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>{f.label}</Text>
                                        </DataTable.Cell>
                                        <DataTable.Cell style={{ flex: 2.5 }}>
                                            {isFile ? (
                                                <View style={{ width: '100%', paddingVertical: 4 }}>
                                                    <View style={{
                                                        backgroundColor: '#f8fafc',
                                                        borderRadius: 8,
                                                        padding: 10,
                                                        borderWidth: 1,
                                                        borderColor: '#e2e8f0',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 12
                                                    }}>
                                                        <MaterialCommunityIcons name="file-document-outline" size={24} color="#3b82f6" />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }} numberOfLines={1}>
                                                                {val ? (typeof val === 'string' ? val.split('/').pop() : 'Document Attached') : 'No File'}
                                                            </Text>
                                                            <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600' }}>Uploaded Successfully</Text>
                                                        </View>
                                                        {val && (
                                                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        const url = val.startsWith('http') ? val : `${SERVER_URL}${val}`;
                                                                        if (Platform.OS === 'web') window.open(url, '_blank');
                                                                    }}
                                                                    style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#eff6ff', borderRadius: 4 }}
                                                                >
                                                                    <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '700' }}>View</Text>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        const url = val.startsWith('http') ? val : `${SERVER_URL}${val}`;
                                                                        if (Platform.OS === 'web') {
                                                                            const link = document.createElement('a');
                                                                            link.href = url;
                                                                            link.download = val.split('/').pop();
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            document.body.removeChild(link);
                                                                        }
                                                                    }}
                                                                    style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f0fdf4', borderRadius: 4 }}
                                                                >
                                                                    <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700' }}>Download</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ) : (
                                                <Text style={{ fontSize: 13, color: '#1e293b' }}>
                                                    {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '-')}
                                                </Text>
                                            )}
                                        </DataTable.Cell>
                                    </DataTable.Row>
                                    {populatedMetadata.map((meta, mIdx) => (
                                        <DataTable.Row key={meta.key} style={{ minHeight: 40, backgroundColor: '#fcfcfc', borderTopWidth: 1, borderTopColor: '#f8fafc' }}>
                                            <DataTable.Cell style={{ flex: 1.5, paddingLeft: 24 }}>
                                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8' }}>{meta.label}</Text>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 2.5 }}>
                                                <Text style={{ fontSize: 12, color: '#64748b' }}>{formValues[`${fieldKey}_${meta.key}`]}</Text>
                                            </DataTable.Cell>
                                        </DataTable.Row>
                                    ))}
                                </View>
                            );
                        })}
                    </DataTable>
                </View>
            </View>
        );
    };

    const filteredModules = modules.filter(m => {
        if (m.module_id != 1) return false;
        const name = (m.name || '').toLowerCase();
        const searchStr = (search || '').toLowerCase();
        return name.includes(searchStr);
    });

    return (
        <AppLayout navigation={navigation} title="Premises Display">
            <View style={styles.container}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Premises Display</Text>
                        <Text style={styles.subtitle}>View and manage all registered locations</Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleAddPremises}
                        icon="plus"
                        style={styles.addButton}
                        labelStyle={{ fontWeight: 'bold', fontSize: 13 }}
                    >
                        Add New Premises
                    </Button>
                </View>

                <View style={[styles.controlsHeader, isMobile && { flexDirection: 'column', gap: 12 }]}>
                    <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={{ marginRight: 10 }} />
                        <RNTextInput
                            style={styles.searchInput}
                            placeholder="Find a location..."
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : isMobile ? (
                    <ScrollView style={{ marginTop: 10, paddingBottom: 80, maxHeight: 'calc(100vh - 250px)' }}>
                        {premises.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconCircle}>
                                    <MaterialCommunityIcons name="office-building" size={40} color="#cbd5e1" />
                                </View>
                                <Text style={styles.emptyTitle}>No Premises Found</Text>
                                <View style={{ marginTop: 16 }}>
                                    <Button mode="contained" onPress={handleAddPremises} style={styles.addButton}>
                                        Add First Premises
                                    </Button>
                                </View>
                            </View>
                        ) : (
                            premises.map((item) => (
                                <Surface key={item.premise_id} style={{
                                    marginHorizontal: 4,
                                    marginBottom: 16,
                                    borderRadius: 12,
                                    backgroundColor: 'white',
                                    elevation: 2,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: '#e2e8f0'
                                }}>
                                    <View style={{ padding: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <View style={[styles.typeChip, {
                                                backgroundColor: item.premise_type === 'OWNED' ? '#e0e7ff' : '#fff7ed',
                                                paddingHorizontal: 10,
                                                height: 24
                                            }]}>
                                                <Text style={{
                                                    color: item.premise_type === 'OWNED' ? '#4338ca' : '#c2410c',
                                                    fontWeight: '800',
                                                    fontSize: 10,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {item.premise_type}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                                <TouchableOpacity onPress={() => fetchPremiseSnapshot(item)} style={{ padding: 4, backgroundColor: '#f8fafc', borderRadius: 6 }}>
                                                    <MaterialCommunityIcons name="eye-outline" size={18} color="#f59e0b" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleEditPremise(item)} style={{ padding: 4, backgroundColor: '#f8fafc', borderRadius: 6 }}>
                                                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#6366f1" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeletePremise(item)} style={{ padding: 4, backgroundColor: '#fef2f2', borderRadius: 6 }}>
                                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                            <View style={{
                                                width: 48, height: 48, borderRadius: 10,
                                                backgroundColor: item.premises_use === 'OFFICE' ? '#eff6ff' : '#f0fdf4',
                                                justifyContent: 'center', alignItems: 'center', marginRight: 16
                                            }}>
                                                <MaterialCommunityIcons
                                                    name={item.premises_use === 'OFFICE' ? 'briefcase-outline' :
                                                        item.premises_use === 'WAREHOUSE' ? 'warehouse' : 'domain'}
                                                    size={24}
                                                    color={item.premises_use === 'OFFICE' ? '#3b82f6' : '#16a34a'}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 2 }}>{item.premises_name}</Text>
                                                <Text style={{ fontSize: 13, color: '#64748b' }}>{item.building_name || 'N/A'}</Text>
                                            </View>
                                        </View>
                                        <Divider style={{ marginBottom: 16, backgroundColor: '#f1f5f9' }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View>
                                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>COUNTRY</Text>
                                                <Text style={{ color: '#334155', fontWeight: '600', fontSize: 13 }}>{item.country || '-'}</Text>
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>REGION</Text>
                                                <Text style={{ color: '#334155', fontWeight: '600', fontSize: 13 }}>{item.region || '-'}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>AREA</Text>
                                                <Text style={{ color: '#334155', fontWeight: '600', fontSize: 13 }}>{item.area || 'Free Zone'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </Surface>
                            ))
                        )}
                        {premises.length > 0 && (

                            <View style={[styles.paginationContainer, { flexDirection: width < 480 ? 'column' : 'row', gap: width < 480 ? 12 : 0, justifyContent: width < 480 ? 'center' : 'space-between' }]}>
                                <Text style={[styles.paginationText, width < 480 && { marginBottom: 8, textAlign: 'center' }]}>
                                    Showing {page * itemsPerPage + 1} to {Math.min((page + 1) * itemsPerPage, totalItems)} of {totalItems}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => setPage(0)}
                                        disabled={page === 0}
                                        style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-double-left" size={20} color={page === 0 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setPage(Math.max(0, page - 1))}
                                        disabled={page === 0}
                                        style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-left" size={20} color={page === 0 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>

                                    <View style={[styles.pageBtn, styles.pageBtnActive]}>
                                        <Text style={styles.pageBtnTextActive}>{page + 1}</Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setPage(Math.min(Math.ceil(totalItems / itemsPerPage) - 1, page + 1))}
                                        disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                        style={[styles.pageBtn, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={page >= Math.ceil(totalItems / itemsPerPage) - 1 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setPage(Math.ceil(totalItems / itemsPerPage) - 1)}
                                        disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                        style={[styles.pageBtn, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-double-right" size={20} color={page >= Math.ceil(totalItems / itemsPerPage) - 1 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                ) : (
                    <Card style={styles.tableCard}>
                        <DataTable>
                            <DataTable.Header style={styles.tableHeader}>
                                <DataTable.Title style={{ flex: 1.2, justifyContent: 'flex-start', backgroundColor: '#6c7ae0', paddingLeft: 16 }} textStyle={styles.headerText}>TYPE</DataTable.Title>
                                <DataTable.Title style={{ flex: 1.8, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>PREMISES NAME</DataTable.Title>
                                <DataTable.Title style={{ flex: 1, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>USAGE</DataTable.Title>
                                <DataTable.Title style={{ flex: 1, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>COUNTRY</DataTable.Title>
                                <DataTable.Title style={{ flex: 1, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>REGION</DataTable.Title>
                                <DataTable.Title style={{ flex: 1, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>AREA</DataTable.Title>
                                <DataTable.Title style={{ flex: 1, justifyContent: 'center', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>ACTIONS</DataTable.Title>
                            </DataTable.Header>
                            <ScrollView style={{ maxHeight: 'calc(100vh - 420px)' }}>
                                {premises.map((item, index) => (
                                    <View key={item.premise_id} style={styles.rowWrapper}>
                                        <DataTable.Row style={[styles.row, { backgroundColor: index % 2 === 0 ? 'white' : '#f2f6ff' }]}>
                                            <DataTable.Cell style={{ flex: 1.2, paddingLeft: 16 }}>
                                                <View style={styles.typeIconBox}>
                                                    <MaterialCommunityIcons
                                                        name={
                                                            item.premises_use === 'OFFICE' ? 'briefcase-outline' :
                                                                item.premises_use === 'WAREHOUSE' ? 'warehouse' :
                                                                    item.premises_use === 'STAFF' ? 'home-account' : 'domain'
                                                        }
                                                        size={20}
                                                        color="#3b82f6"
                                                    />
                                                </View>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1.8 }}>
                                                <View>
                                                    <Text style={styles.moduleName}>{item.premises_name || item.name}</Text>
                                                    <Text style={{ fontSize: 11, color: '#64748b' }}>{item.building_name || '-'}</Text>
                                                </View>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1 }}>
                                                <Chip style={{ height: 26, backgroundColor: '#f1f5f9' }} textStyle={{ fontSize: 11 }}>{item.premises_use || 'OFFICE'}</Chip>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1 }}>
                                                <Text style={styles.cellText}>{item.country || '-'}</Text>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1 }}>
                                                <Text style={styles.cellText}>{item.region || '-'}</Text>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1 }}>
                                                <Text style={styles.cellText}>{item.area || '-'}</Text>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1, justifyContent: 'center' }}>
                                                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                                                    <TouchableOpacity onPress={() => fetchPremiseSnapshot(item)}>
                                                        <MaterialCommunityIcons name="eye-outline" size={20} color="rgb(239, 149, 10)" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleEditPremise(item)}>
                                                        <MaterialCommunityIcons name="pencil-outline" size={20} color="rgb(99, 102, 241)" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeletePremise(item)}>
                                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="rgb(152, 37, 152)" />
                                                    </TouchableOpacity>
                                                </View>
                                            </DataTable.Cell>
                                        </DataTable.Row>
                                    </View>
                                ))}
                                {premises.length === 0 && (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyIconCircle}>
                                            <MaterialCommunityIcons name="office-building" size={40} color="#cbd5e1" />
                                        </View>
                                        <Text style={styles.emptyTitle}>No Premises Found</Text>
                                        <Text style={{ color: '#94a3b8' }}>Get started by adding a new premises to your list.</Text>
                                        <Button
                                            mode="text"
                                            onPress={handleAddPremises}
                                            style={{ marginTop: 10 }}
                                            labelStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                        >
                                            Add New Premises
                                        </Button>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.paginationContainer}>
                                <Text style={styles.paginationText}>
                                    Showing {page * itemsPerPage + 1} to {Math.min((page + 1) * itemsPerPage, totalItems)} of {totalItems}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => setPage(0)}
                                        disabled={page === 0}
                                        style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-double-left" size={20} color={page === 0 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setPage(Math.max(0, page - 1))}
                                        disabled={page === 0}
                                        style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-left" size={20} color={page === 0 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>

                                    <View style={[styles.pageBtn, styles.pageBtnActive]}>
                                        <Text style={styles.pageBtnTextActive}>{page + 1}</Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setPage(Math.min(Math.ceil(totalItems / itemsPerPage) - 1, page + 1))}
                                        disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                        style={[styles.pageBtn, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={page >= Math.ceil(totalItems / itemsPerPage) - 1 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setPage(Math.ceil(totalItems / itemsPerPage) - 1)}
                                        disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                        style={[styles.pageBtn, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-double-right" size={20} color={page >= Math.ceil(totalItems / itemsPerPage) - 1 ? '#cbd5e1' : '#64748b'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </DataTable>
                    </Card>
                )}

                <Portal>
                    <PremisesWizardModal
                        visible={wizardVisible}
                        onClose={() => setWizardVisible(false)}
                        initialData={wizardInitialData}
                        onSave={async (data) => {
                            try {
                                const isUpdate = !!wizardInitialData?.premise_id;
                                let res;
                                if (isUpdate) {
                                    res = await api.put(`office/premises/${wizardInitialData.premise_id}`, data);
                                } else {
                                    res = await api.post('office/premises', data);
                                }

                                if (res.data.success) {
                                    setAlertConfig({
                                        visible: true,
                                        title: 'Success',
                                        message: isUpdate ? 'Premises updated successfully' : 'Premises added successfully',
                                        type: 'success'
                                    });
                                    setWizardVisible(false);
                                    fetchPremises();
                                }
                            } catch (e) {
                                console.error('Save failed:', e);
                                alert('Failed to save premises');
                            }
                        }}
                    />

                    <Modal visible={detailsVisible} onDismiss={() => setDetailsVisible(false)} contentContainerStyle={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Premises Details</Text>
                                <Text style={styles.modalSub}>Full profile and configuration details</Text>
                            </View>
                            <IconButton icon="close" onPress={() => setDetailsVisible(false)} />
                        </View>

                        <ScrollView style={{ flex: 1 }}>
                            {detailsLoading ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#3b82f6" />
                                    <Text style={{ marginTop: 16, color: '#64748b' }}>Loading details...</Text>
                                </View>
                            ) : (
                                <View style={{ paddingBottom: 20 }}>
                                    {(() => {
                                        let renderedCount = 0;
                                        return moduleDetails.map((sec) => {
                                            const secView = renderSection(sec, renderedCount + 1);
                                            if (secView) renderedCount++;
                                            return secView;
                                        });
                                    })()}

                                    {!detailsLoading && moduleDetails.length === 0 && (
                                        <View style={{ padding: 40, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="information-outline" size={32} color="#cbd5e1" />
                                            <Text style={{ marginTop: 8, color: '#94a3b8' }}>No configuration found</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button mode="outlined" onPress={() => setDetailsVisible(false)} style={styles.secondaryBtn}>
                                Close
                            </Button>
                            <Button mode="contained" onPress={() => { setDetailsVisible(false); handleEditPremise(formValues); }} style={styles.submitBtn}>
                                Edit Details
                            </Button>
                        </View>
                    </Modal>


                    <ConfirmDialog
                        visible={deleteDialogVisible}
                        onDismiss={() => setDeleteDialogVisible(false)}
                        onConfirm={confirmDeletePremise}
                        title="Delete Premises?"
                        message={`Are you sure you want to delete "${itemToDelete?.premises_name}"? This action cannot be undone.`}
                        confirmText="Delete Now"
                        cancelText="Cancel"
                        danger={true}
                    />

                    <AlertDialog
                        visible={alertConfig.visible}
                        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                    />

                </Portal>
            </View>
        </AppLayout >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
    pageHeader: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    controlsHeader: { flexDirection: 'row', marginBottom: 24, gap: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 48 },
    addButton: { borderRadius: 8, justifyContent: 'center', backgroundColor: '#3b82f6', height: 40, paddingHorizontal: 8 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#1e293b', outlineStyle: 'none', height: '100%' },
    tableCard: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, overflow: 'hidden' },
    tableHeader: {
        backgroundColor: '#6c7ae0',
        borderBottomWidth: 0,
        height: 52,
        paddingHorizontal: 16,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    headerText: { fontSize: 11, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 },
    rowWrapper: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    row: { height: 72, borderBottomWidth: 0, paddingHorizontal: 16, paddingVertical: 16 },
    nameCell: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#dbeafe' },
    moduleName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    subText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    cellText: { fontSize: 13, color: '#334155', fontWeight: '500' },
    typeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start' },
    typeChipText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    actionBtn: { flexDirection: 'row', alignItems: 'center' },
    actionBtnText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },

    // Custom Pagination
    // Custom Pagination
    paginationContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingRight: 24, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#f8fafc' },
    paginationText: { fontSize: 13, color: '#64748b' },
    pageBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    pageBtnActive: { backgroundColor: '#4f46e5' },
    pageBtnDisabled: { opacity: 0.5 },
    pageBtnTextActive: { color: 'white', fontWeight: 'bold', fontSize: 13 },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 60 },
    emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 8 },
    // Modal Styles
    modalContent: {
        backgroundColor: 'white',
        alignSelf: 'center',
        width: '90%',
        maxWidth: 1000,
        maxHeight: '90%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    modalSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#ffffff'
    },
    sectionCard: {
        margin: 16,
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: 'white',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        backgroundColor: '#673ab7',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderBottomWidth: 0,
    },
    sectionTitle: { fontWeight: '700', color: '#ffffff', fontSize: 16, letterSpacing: 0.3 },
    formContainer: {
        padding: 24,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    formRow: {
        marginBottom: 20,
        // Width is handled dynamically in renderSection to support responsiveness
    },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
    textInput: { backgroundColor: 'white', fontSize: 14, minHeight: 44 },
    helperText: { fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
    emptyText: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
    optionTag: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#eff6ff', borderRadius: 6, borderWidth: 1, borderColor: '#dbeafe' },
    optionText: { fontSize: 12, color: '#1e40af' },
    submitBtn: { backgroundColor: '#3b82f6', borderRadius: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
    secondaryBtn: { borderColor: '#e2e8f0', borderRadius: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
    dangerBtn: { borderColor: '#fee2e2', borderRadius: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
    fixedHeader: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 8,
    },
    headerFormContent: {
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'space-between',
        gap: 16,
    },
    headerField: {
        flex: 1,
    },
    headerInput: {
        backgroundColor: 'white',
        height: 40,
        fontSize: 13,
    },
    headerChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 8,
    },
    smallOptionTag: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        backgroundColor: '#eff6ff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    smallOptionText: {
        fontSize: 10,
        color: '#1e40af',
        fontWeight: '600',
    },
    activeTag: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    activeTagText: {
        color: 'white',
    },
    menuContent: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    menuItemLabel: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    }
});

export default AssetDisplayScreen;
