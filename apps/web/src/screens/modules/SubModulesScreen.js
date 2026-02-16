import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, useWindowDimensions, TextInput } from 'react-native';
import AppLayout from '../../components/AppLayout';
import { Card, Title, Button, Portal, Modal, ActivityIndicator, Checkbox, DataTable } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';
import AlertDialog from '../../components/AlertDialog';

const SubModulesScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const [loadingList, setLoadingList] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterModule, setFilterModule] = useState(null);

    // Responsive Layout: Use card view for screens smaller than 1600px (Mobile + Tablet + Laptop)
    const isMobile = width < 1600;

    const [modalVisible, setModalVisible] = useState(false);

    // Data Loading
    const [loadingData, setLoadingData] = useState(false);
    const [modules, setModules] = useState([]);
    const [countries, setCountries] = useState([]);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [types, setTypes] = useState([]);

    // List State
    const [companyModules, setCompanyModules] = useState([]);

    // Form State
    const [selectedModule, setSelectedModule] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedPropertyType, setSelectedPropertyType] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [status, setStatus] = useState(true);

    // Structure Data
    const [moduleSections, setModuleSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);
    const [sectionFields, setSectionFields] = useState({});
    const [expandedSectionId, setExpandedSectionId] = useState(null);
    const [loadingFields, setLoadingFields] = useState(false);
    const [selectedFields, setSelectedFields] = useState({});

    // Dropdown UI State
    const [dropdownOpen, setDropdownOpen] = useState(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const itemsPerPage = 10;

    // Alert Dialog State
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleOpenModal = () => {
        setEditingId(null);
        setSelectedModule(null);
        setSelectedCountry(null);
        setSelectedPropertyType(null);
        setSelectedType(null);
        setSelectedArea(null);
        setStatus(true);
        setModuleSections([]);
        setSectionFields({});
        setExpandedSectionId(null);
        setSelectedFields({});
        setModalVisible(true);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        const mod = modules.find(m => m.module_id === item.module_id || m.id === item.module_id);
        const country = countries.find(c => c.id === item.country_id);
        const propType = propertyTypes.find(pt => pt.id === item.property_type_id);
        const type = types.find(t => t.id === item.premises_type_id);
        const area = areas.find(a => a.id === item.area_id);
        setSelectedModule(mod || null);
        setSelectedCountry(country || null);
        setSelectedPropertyType(propType || null);
        setSelectedType(type || null);
        setSelectedArea(area || null);
        setStatus(item.is_active === 1 || item.status === 'ACTIVE');

        // Populate selected fields from item.selected_fields
        const fieldsState = {};
        let fieldsArray = [];

        if (item.selected_fields) {
            if (Array.isArray(item.selected_fields)) {
                fieldsArray = item.selected_fields;
            } else if (typeof item.selected_fields === 'string') {
                fieldsArray = item.selected_fields.split(',').map(Number);
            }
        }

        fieldsArray.forEach(fid => {
            fieldsState[fid] = true;
        });

        // Debugging Alert
        // alert(`Debug Edit:\nLoaded Count: ${Object.keys(fieldsState).length}\nIDs: ${JSON.stringify(Object.keys(fieldsState))}`);

        setSelectedFields(fieldsState);

        setModalVisible(true);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await api.delete(`company-modules/${itemToDelete.id}`);
            if (res.data.success) {
                setAlertConfig({ visible: true, title: 'Success', message: 'Module deleted successfully', type: 'success' });
                fetchCompanyModules();
            } else {
                setAlertConfig({ visible: true, title: 'Error', message: res.data.message || 'Failed to delete', type: 'error' });
            }
        } catch (error) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Error deleting module', type: 'error' });
        } finally {
            setDeleteModalVisible(false);
            setItemToDelete(null);
        }
    };

    useEffect(() => {
        fetchInitialData();
        fetchCompanyModules();
    }, []);

    useEffect(() => {
        if (!modalVisible) {
            fetchCompanyModules();
        }
    }, [modalVisible]);

    const fetchCompanyModules = async () => {
        setLoadingList(true);
        try {
            const res = await api.get('company-modules');
            if (res.data.success) {
                setCompanyModules(res.data.data);
            }
        } catch (error) {
            console.error('Fetch company modules error:', error);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoadingData(true);
            const [modRes, countriesRes, propRes, areasRes, typesRes] = await Promise.all([
                api.get('module-master'),
                api.get('countries'),
                api.get('property-types'),
                api.get('areas'),
                api.get('premises-types')
            ]);
            if (modRes.data.success) setModules(modRes.data.data);
            if (countriesRes.data.success) setCountries(countriesRes.data.data);
            if (propRes.data.success) setPropertyTypes(propRes.data.data);
            if (areasRes.data.success) setAreas(areasRes.data.data);
            if (typesRes.data.success) setTypes(typesRes.data.data);
        } catch (error) {
            console.error('Fetch data error:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchSections = async (moduleId) => {
        try {
            setLoadingSections(true);
            setExpandedSectionId(null);
            const res = await api.get(`module-builder/${moduleId}/sections`);
            if (res.data.success) {
                setModuleSections(res.data.data);
            }
        } catch (error) {
            console.error('Fetch sections error:', error);
            setModuleSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleSectionPress = async (sectionId) => {
        if (expandedSectionId === sectionId) {
            setExpandedSectionId(null);
            return;
        }
        setExpandedSectionId(sectionId);
        if (!sectionFields[sectionId]) {
            try {
                setLoadingFields(true);
                const res = await api.get(`module-builder/fields?section_id=${sectionId}`);
                if (res.data.success) {
                    const fields = res.data.data;
                    setSectionFields(prev => ({ ...prev, [sectionId]: fields }));

                    // Merge new fields into selection state without overwriting existing selections
                    setSelectedFields(prev => {
                        const newState = { ...prev };
                        fields.forEach(f => {
                            if (newState[f.id] === undefined) {
                                newState[f.id] = false;
                            }
                        });
                        return newState;
                    });
                }
            } catch (error) {
                console.error('Fetch fields error:', error);
            } finally {
                setLoadingFields(false);
            }
        }
    };

    const toggleFieldSelection = (fieldId) => {
        const id = Number(fieldId);
        setSelectedFields(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleDropdown = (key) => {
        setDropdownOpen(dropdownOpen === key ? null : key);
    };

    const clearSelections = () => {
        setSelectedFields({});
        setAlertConfig({ visible: true, title: 'Cleared', message: 'All selections cleared.', type: 'info' });
    };

    const handleSave = async () => {
        if (!selectedModule) {
            setAlertConfig({ visible: true, title: 'Module Required', message: 'Please select a module first.', type: 'warning' });
            return;
        }
        try {
            // Extract selected field IDs from the boolean map
            const selectedFieldIds = Object.keys(selectedFields)
                .filter(id => selectedFields[id] === true)
                .map(Number);

            const payload = {
                module_id: selectedModule.module_id || selectedModule.id,
                country_id: selectedCountry?.id || null,
                property_type_id: selectedPropertyType?.id || null,
                premises_type_id: selectedType?.id || null,
                area_id: selectedArea?.id || null,
                is_active: status,
                status_id: status ? 1 : 2,
                selected_fields: selectedFieldIds
            };

            console.log('[SubModulesScreen] SUBMITTING PAYLOAD:', JSON.stringify(payload, null, 2));

            // Debugging Alert for User
            // alert(`Debug Save:\nCount: ${selectedFieldIds.length}\nIDs: ${JSON.stringify(selectedFieldIds)}`);

            let res;
            if (editingId) {
                res = await api.put(`company-modules/${editingId}`, payload);
            } else {
                res = await api.post('company-modules', payload);
            }
            if (res.data.success) {
                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: editingId ? 'Module updated successfully!' : 'Module saved successfully!',
                    type: 'success'
                });

                setModalVisible(false);
                fetchCompanyModules();
            } else {
                setAlertConfig({ visible: true, title: 'Error', message: 'Failed to save: ' + res.data.message, type: 'error' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : error.message),
                type: 'error'
            });
        }
    };

    const renderDropdown = (label, placeholder, value, options, onSelect, key, labelKey = 'name', containerStyle = {}) => {
        const isOpen = dropdownOpen === key;
        return (
            <View style={[styles.inputContainer, containerStyle, { zIndex: isOpen ? 1000 : 1 }]}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TouchableOpacity
                    style={[styles.dropdownTrigger, isOpen && styles.dropdownTriggerActive]}
                    onPress={() => toggleDropdown(key)}
                >
                    <Text style={[styles.dropdownText, !value && styles.placeholderText]} numberOfLines={1}>
                        {value ? value[labelKey] || value.label || value.name : placeholder}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>

                {isOpen && (
                    <View style={styles.dropdownList}>
                        {options.length === 0 ? (
                            <Text style={{ padding: 12, color: '#94a3b8' }}>No options</Text>
                        ) : (
                            <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true}>
                                {options.map((opt, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            onSelect(opt);
                                            setDropdownOpen(null);
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{opt[labelKey] || opt.label || opt.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>
        );
    };

    useEffect(() => {
        if (selectedModule) {
            fetchSections(selectedModule.module_id || selectedModule.id);
        } else {
            setModuleSections([]);
            setSectionFields({});
            setExpandedSectionId(null);
        }

        // Only clear selected fields if we are NOT in edit mode
        // In edit mode (editingId is truthy), handleEdit has explicitly set the fields
        if (!editingId) {
            setSelectedFields({});
            setSectionFields({}); // Also clear section fields cache to force refresh
        }
    }, [selectedModule, editingId]);

    const renderStructure = () => (
        <View style={[styles.structureSection, isMobile && { marginTop: 12 }]}>
            <Text style={styles.sectionLabel}>MODULE STRUCTURE</Text>
            {!selectedModule ? (
                <View style={styles.structureBox}><Text style={styles.structureTextPlaceholder}>Select a module first</Text></View>
            ) : loadingSections ? (
                <ActivityIndicator size="small" color="#673ab7" />
            ) : (
                <View style={styles.structureListContainer}>
                    <View style={styles.structureHeader}>
                        <Text style={styles.structureHeaderText}>{(selectedModule.module_name || selectedModule.name)} Structure</Text>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity onPress={clearSelections}><Text style={{ color: '#ef4444', fontSize: 12 }}>Clear All</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={{ height: 240 }} nestedScrollEnabled={true}>
                        {moduleSections.length === 0 ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#94a3b8" />
                                <Text style={{ color: '#94a3b8', marginTop: 8 }}>No sections found for this module.</Text>
                            </View>
                        ) : moduleSections.map((section) => {
                            const isExpanded = expandedSectionId === section.id;
                            const fields = sectionFields[section.id] || [];
                            return (
                                <View key={section.id} style={styles.accordionContainer}>
                                    <TouchableOpacity style={styles.accordionHeader} onPress={() => handleSectionPress(section.id)}>
                                        <Text style={styles.accordionTitle}>{section.name}</Text>
                                        <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} />
                                    </TouchableOpacity>
                                    {isExpanded && (
                                        <View style={styles.accordionContent}>
                                            {fields.map(field => (
                                                <TouchableOpacity key={field.id} style={styles.fieldItem} onPress={() => toggleFieldSelection(field.id)}>
                                                    <Checkbox.Android status={selectedFields[field.id] ? 'checked' : 'unchecked'} color="#673ab7" />
                                                    <Text>{field.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    const filteredItems = companyModules.filter(m => {
        if (!filterModule) return true;
        return m.module_id === filterModule.module_id || m.module_name === filterModule.module_name || m.name === filterModule.module_name;
    });
    const totalItems = filteredItems.length;
    const paginatedItems = filteredItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    return (
        <AppLayout navigation={navigation} title="Submodules">
            <View style={[styles.container, isMobile && { padding: 12 }]}>
                {/* Header */}
                <View style={[styles.pageHeader, isMobile ? { flexDirection: 'column', alignItems: 'stretch', gap: 12 } : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View>
                        <Text style={styles.title}>
                            {filterModule && filterModule.module_name === 'Premises' ? 'Premises Display' : 'Submodules'}
                        </Text>
                        {filterModule && filterModule.module_name === 'Premises' && <Text style={styles.subtitle}>View module configurations and definitions</Text>}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            { backgroundColor: (filterModule && filterModule.module_name === 'Premises') ? '#3b82f6' : '#673ab7' },
                            isMobile && { width: '100%', height: 48, justifyContent: 'center', marginTop: 8 }
                        ]}
                        onPress={handleOpenModal}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.addButtonText}>
                            {(filterModule && filterModule.module_name === 'Premises') ? 'Add New Premises' : 'Add Sub-module'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Header */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#000' }}>Filter by Module</Text>
                    {renderDropdown("", "Show all...", filterModule, modules, setFilterModule, 'filterMod', 'module_name', { width: '100%', backgroundColor: '#fff' })}
                </View>

                {/* Table */}
                <Card style={styles.tableCard}>
                    <Card.Content style={{ padding: 0 }}>
                        {loadingList ? (
                            <ActivityIndicator size="large" color="#673ab7" style={{ margin: 40 }} />
                        ) : totalItems === 0 ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#94a3b8" />
                                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 15 }}>No configured sub-modules found.</Text>
                            </View>
                        ) : (
                            <>
                                {isMobile ? (
                                    <ScrollView style={{ maxHeight: 'calc(100vh - 350px)', padding: 12 }}>
                                        {paginatedItems.map((item) => {
                                            const isPremisesItem = filterModule?.module_name === 'Premises' || item.module_name === 'Premises' || item.module_name === 'Office Premises';

                                            if (isPremisesItem) {
                                                return (
                                                    <View key={item.id} style={{
                                                        backgroundColor: 'white',
                                                        borderRadius: 12,
                                                        padding: 16,
                                                        marginBottom: 12,
                                                        shadowColor: '#64748b',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: 0.1,
                                                        shadowRadius: 8,
                                                        elevation: 4,
                                                        borderWidth: 1,
                                                        borderColor: '#e2e8f0'
                                                    }}>
                                                        {/* Card Header: Type Badge + Actions */}
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                            <View style={{
                                                                backgroundColor: item.property_type?.toLowerCase().includes('own') ? '#e0e7ff' : '#fef3c7',
                                                                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6
                                                            }}>
                                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.property_type?.toLowerCase().includes('own') ? '#4338ca' : '#d97706' }} />
                                                                <Text style={{
                                                                    fontSize: 11, fontWeight: '800',
                                                                    color: item.property_type?.toLowerCase().includes('own') ? '#4338ca' : '#d97706',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {item.property_type?.toLowerCase().includes('own') ? 'OWNED' : 'RENTAL'}
                                                                </Text>
                                                            </View>

                                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                <TouchableOpacity onPress={() => handleEdit(item)} style={{ padding: 4 }}>
                                                                    <MaterialCommunityIcons name="pencil-outline" size={20} color="#6366f1" />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => handleDeleteClick(item)} style={{ padding: 4 }}>
                                                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>

                                                        {/* Main Content: Name & Usage */}
                                                        <View style={{ marginBottom: 16 }}>
                                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>
                                                                {item.name}
                                                            </Text>
                                                            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                                {item.premises_type || 'OFFICE'}
                                                            </Text>
                                                        </View>

                                                        {/* Grid Details */}
                                                        <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, gap: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>COUNTRY</Text>
                                                                <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>{item.country || 'Unknown'}</Text>
                                                            </View>
                                                            <View style={{ width: 1, backgroundColor: '#e2e8f0' }} />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>AREA</Text>
                                                                <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>{item.section_area || 'Free Zone'}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                );
                                            }

                                            // Generic Mobile Card
                                            return (
                                                <View key={item.id} style={styles.mobileCardItem}>
                                                    <View style={styles.mobileTopRow}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                                            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#fff3e0', justifyContent: 'center', alignItems: 'center' }}>
                                                                <MaterialCommunityIcons name={item.icon || "layers-outline"} size={22} color="#f59e0b" />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#1e293b' }} numberOfLines={1}>{item.name}</Text>
                                                                <Text style={{ fontSize: 12, color: '#64748b' }}>{item.section_area || 'N/A'}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={{ backgroundColor: (item.is_active || item.status === 'ACTIVE') ? '#dcfce7' : '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                                            <Text style={{ color: (item.is_active || item.status === 'ACTIVE') ? '#166534' : '#991b1b', fontSize: 11, fontWeight: 'bold' }}>
                                                                {(item.is_active || item.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    <View style={styles.mobileDetailsGrid}>
                                                        <View style={[styles.mobileInfoCol, { flex: 1, minWidth: '30%' }]}>
                                                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>COUNTRY</Text>
                                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>{item.country || 'N/A'}</Text>
                                                        </View>
                                                        <View style={[styles.mobileInfoCol, { flex: 1, minWidth: '30%' }]}>
                                                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>PROPERTY</Text>
                                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>
                                                                {item.property_type ? (item.property_type.toLowerCase().includes('own') ? 'Owned' : 'Rented') : 'N/A'}
                                                            </Text>
                                                        </View>
                                                        <View style={[styles.mobileInfoCol, { flex: 1, minWidth: '30%' }]}>
                                                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>PREMISE</Text>
                                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }} numberOfLines={1}>{item.premises_type || 'N/A'}</Text>
                                                        </View>
                                                    </View>

                                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                                                        <TouchableOpacity onPress={() => handleEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f5f3ff', borderRadius: 6 }}>
                                                            <MaterialCommunityIcons name="pencil" size={16} color="#673ab7" style={{ marginRight: 6 }} />
                                                            <Text style={{ fontSize: 13, color: '#673ab7', fontWeight: '600' }}>Edit</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDeleteClick(item)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fef2f2', borderRadius: 6 }}>
                                                            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                                                            <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>Delete</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                ) : (
                                    /* Desktop View */
                                    (filterModule?.module_name === 'Premises' || paginatedItems[0]?.module_name === 'Premises') ? (
                                        /* Specialized Premises Table View (Desktop) */
                                        <DataTable>
                                            {/* Header Stripe */}
                                            <DataTable.Header style={[styles.tableHeader, { backgroundColor: '#5c6bc0', height: 48, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 0 }]}>
                                                <DataTable.Title style={{ flex: 1 }} textStyle={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>TYPE</DataTable.Title>
                                                <DataTable.Title style={{ flex: 2 }} textStyle={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>PREMISES NAME</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1.5 }} textStyle={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>USAGE</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1.5 }} textStyle={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>COUNTRY</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1.5 }} textStyle={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>AREA</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1, justifyContent: 'flex-end', paddingRight: 16 }} textStyle={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>ACTIONS</DataTable.Title>
                                            </DataTable.Header>

                                            {/* Table Content */}
                                            <ScrollView style={{ maxHeight: 'calc(100vh - 460px)' }}>
                                                {paginatedItems.map((item, index) => (
                                                    <DataTable.Row key={item.id} style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', height: 60 }]}>

                                                        {/* TYPE Column */}
                                                        <DataTable.Cell style={{ flex: 1 }}>
                                                            <View style={{
                                                                backgroundColor: item.property_type?.toLowerCase().includes('own') ? '#e0e7ff' : '#fef3c7',
                                                                borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
                                                                flexDirection: 'row', alignItems: 'center', gap: 6
                                                            }}>
                                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.property_type?.toLowerCase().includes('own') ? '#4338ca' : '#d97706' }} />
                                                                <Text style={{ color: item.property_type?.toLowerCase().includes('own') ? '#4338ca' : '#d97706', fontWeight: '800', fontSize: 11 }}>
                                                                    {item.property_type?.toLowerCase().includes('own') ? 'OWNED' : 'RENTAL'}
                                                                </Text>
                                                            </View>
                                                        </DataTable.Cell>

                                                        {/* PREMISES NAME Column */}
                                                        <DataTable.Cell style={{ flex: 2 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                                                                    <MaterialCommunityIcons name={item.property_type?.toLowerCase().includes('own') ? 'briefcase-outline' : 'home-city-outline'} size={20} color="#5c6bc0" />
                                                                </View>
                                                                <View>
                                                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1e293b' }}>{item.name}</Text>
                                                                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>N/A</Text>
                                                                </View>
                                                            </View>
                                                        </DataTable.Cell>

                                                        {/* USAGE Column */}
                                                        <DataTable.Cell style={{ flex: 1.5 }}>
                                                            <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500', textTransform: 'uppercase' }}>
                                                                {item.premises_type || 'OFFICE'}
                                                            </Text>
                                                        </DataTable.Cell>

                                                        {/* COUNTRY Column */}
                                                        <DataTable.Cell style={{ flex: 1.5 }}>
                                                            <View>
                                                                <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: '600' }}>{item.country || 'Unknown'}</Text>
                                                                <Text style={{ fontSize: 11, color: '#94a3b8' }}>Unknown</Text>
                                                            </View>
                                                        </DataTable.Cell>

                                                        {/* AREA Column */}
                                                        <DataTable.Cell style={{ flex: 1.5 }}>
                                                            <Text style={{ fontSize: 13, color: '#475569' }}>{item.section_area || 'Free Zone'}</Text>
                                                        </DataTable.Cell>

                                                        {/* ACTIONS Column */}
                                                        <DataTable.Cell style={{ flex: 1, justifyContent: 'flex-end' }}>
                                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                                                <TouchableOpacity>
                                                                    <MaterialCommunityIcons name="eye-outline" size={20} color="#f59e0b" />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => handleEdit(item)}>
                                                                    <MaterialCommunityIcons name="pencil-outline" size={20} color="#6366f1" />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => handleDeleteClick(item)}>
                                                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#d946ef" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </DataTable.Cell>
                                                    </DataTable.Row>
                                                ))}
                                            </ScrollView>
                                        </DataTable>
                                    ) : (
                                        /* Generic Desktop Table View */
                                        <DataTable>
                                            <DataTable.Header style={[styles.tableHeader, { backgroundColor: '#5e35b1', borderTopLeftRadius: 10, borderTopRightRadius: 10 }]}>
                                                <DataTable.Title style={{ flex: 2 }} textStyle={{ color: 'white', fontWeight: 'bold' }}>MODULE NAME</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1 }} textStyle={{ color: 'white', fontWeight: 'bold' }}>COUNTRY</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1 }} textStyle={{ color: 'white', fontWeight: 'bold' }}>PROPERTY</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1.5 }} textStyle={{ color: 'white', fontWeight: 'bold' }}>PREMISE TYPE</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1 }} textStyle={{ color: 'white', fontWeight: 'bold' }}>AREA</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1 }} textStyle={{ color: 'white', fontWeight: 'bold' }}>STATUS</DataTable.Title>
                                                <DataTable.Title style={{ flex: 1 }} textStyle={{ color: 'white', fontWeight: 'bold' }}>ACTION</DataTable.Title>
                                            </DataTable.Header>
                                            <ScrollView style={{ maxHeight: 'calc(100vh - 460px)' }}>
                                                {paginatedItems.map((item) => (
                                                    <DataTable.Row key={item.id} style={styles.row}>
                                                        <DataTable.Cell style={{ flex: 2 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#fff3e0', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                                                    <MaterialCommunityIcons name={item.icon || "layers-outline"} size={18} color="#f59e0b" />
                                                                </View>
                                                                <Text style={{ fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{item.name}</Text>
                                                            </View>
                                                        </DataTable.Cell>
                                                        <DataTable.Cell style={{ flex: 1 }}>{item.country || 'N/A'}</DataTable.Cell>
                                                        <DataTable.Cell style={{ flex: 1 }}>{item.property_type ? (item.property_type.toLowerCase().includes('own') ? 'Owned' : 'Rented') : 'N/A'}</DataTable.Cell>
                                                        <DataTable.Cell style={{ flex: 1.5 }}>
                                                            <View>
                                                                <Text style={{ fontSize: 13 }} numberOfLines={1}>{item.premises_type || 'N/A'}</Text>
                                                                {item.section_area && <Text style={{ fontSize: 11, color: '#94a3b8' }}>{item.section_area}</Text>}
                                                            </View>
                                                        </DataTable.Cell>
                                                        <DataTable.Cell style={{ flex: 1 }}>
                                                            <Text numberOfLines={1}>{item.section_area || '-'}</Text>
                                                        </DataTable.Cell>
                                                        <DataTable.Cell style={{ flex: 1 }}>
                                                            <View style={{ backgroundColor: (item.is_active || item.status === 'ACTIVE') ? '#dcfce7' : '#fee2e2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                                                <Text style={{ color: (item.is_active || item.status === 'ACTIVE') ? '#166534' : '#991b1b', fontSize: 11, fontWeight: 'bold' }}>
                                                                    {(item.is_active || item.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                                                                </Text>
                                                            </View>
                                                        </DataTable.Cell>
                                                        <DataTable.Cell style={{ flex: 1 }}>
                                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                <TouchableOpacity onPress={() => handleEdit(item)}>
                                                                    <MaterialCommunityIcons name="pencil" size={18} color="#6366f1" />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => handleDeleteClick(item)}>
                                                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </DataTable.Cell>
                                                    </DataTable.Row>
                                                ))}
                                            </ScrollView>
                                        </DataTable>
                                    )
                                )}

                                <View style={[styles.paginationFooter, isMobile && { justifyContent: 'center', height: 'auto', paddingVertical: 16, flexDirection: 'column', gap: 12 }]}>
                                    {!isMobile && (
                                        <View style={styles.paginationLeft}>
                                            <Text style={styles.paginationInfo}>
                                                Showing <Text style={styles.paginationBold}>{page * itemsPerPage + 1}</Text> to <Text style={styles.paginationBold}>{Math.min((page + 1) * itemsPerPage, totalItems)}</Text> of <Text style={styles.paginationBold}>{totalItems}</Text>
                                            </Text>
                                        </View>
                                    )}

                                    <View style={[styles.paginationRight, isMobile && { flexWrap: 'wrap', justifyContent: 'center', gap: 4, width: '100%' }]}>
                                        <TouchableOpacity
                                            style={[styles.pageBtn, styles.pageBtnNav, page === 0 && styles.pageBtnDisabled]}
                                            onPress={() => setPage(0)}
                                            disabled={page === 0}
                                        >
                                            <MaterialCommunityIcons name="chevron-double-left" size={18} color={page === 0 ? "#cbd5e1" : "#673ab7"} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.pageBtn, styles.pageBtnNav, page === 0 && styles.pageBtnDisabled]}
                                            onPress={() => setPage(page - 1)}
                                            disabled={page === 0}
                                        >
                                            <MaterialCommunityIcons name="chevron-left" size={18} color={page === 0 ? "#cbd5e1" : "#673ab7"} />
                                        </TouchableOpacity>

                                        {/* Page Numbers */}
                                        {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }).map((_, i) => {
                                            if (i === page || i === 0 || i === Math.ceil(totalItems / itemsPerPage) - 1 || (i >= page - 1 && i <= page + 1)) {
                                                return (
                                                    <TouchableOpacity
                                                        key={i}
                                                        style={[styles.pageBtn, page === i ? styles.pageBtnActive : styles.pageBtnOutlined]}
                                                        onPress={() => setPage(i)}
                                                    >
                                                        <Text style={[styles.pageBtnText, page === i ? styles.pageBtnTextActive : styles.pageBtnTextOutlined]}>
                                                            {i + 1}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            }
                                            return null;
                                        })}

                                        <TouchableOpacity
                                            style={[styles.pageBtn, styles.pageBtnNav, (page >= Math.ceil(totalItems / itemsPerPage) - 1) && styles.pageBtnDisabled]}
                                            onPress={() => setPage(page + 1)}
                                            disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                        >
                                            <MaterialCommunityIcons name="chevron-right" size={18} color={(page >= Math.ceil(totalItems / itemsPerPage) - 1) ? "#cbd5e1" : "#673ab7"} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.pageBtn, styles.pageBtnNav, (page >= Math.ceil(totalItems / itemsPerPage) - 1) && styles.pageBtnDisabled]}
                                            onPress={() => setPage(Math.ceil(totalItems / itemsPerPage) - 1)}
                                            disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                        >
                                            <MaterialCommunityIcons name="chevron-double-right" size={18} color={(page >= Math.ceil(totalItems / itemsPerPage) - 1) ? "#cbd5e1" : "#673ab7"} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </Card.Content>
                </Card>

                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modalContent, isMobile && { padding: 20, width: '95%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Title style={styles.modalTitle}>{editingId ? 'Submodule Details' : 'Add Submodule'}</Title>
                                <Text style={styles.modalSubtitle}>{editingId ? 'View selected submodule details' : 'Configure new submodule'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedModule) fetchSections(selectedModule.module_id || selectedModule.id);
                                    }}
                                    style={{ marginRight: 16 }}
                                >
                                    <MaterialCommunityIcons name="refresh" size={24} color="#673ab7" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.divider} />

                        {loadingData ? (
                            <ActivityIndicator size="large" color="#673ab7" style={{ marginVertical: 40 }} />
                        ) : isMobile ? (
                            <ScrollView style={{ maxHeight: '70vh' }} showsVerticalScrollIndicator={false}>
                                <View style={{ flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
                                    {renderDropdown("Module Name", "Select...", selectedModule, modules, setSelectedModule, 'module', 'module_name')}
                                    {renderStructure()}
                                    {renderDropdown("Country", "Select...", selectedCountry, countries, setSelectedCountry, 'country', 'country_name')}
                                    {renderDropdown("Property Type", "Select...", selectedPropertyType, propertyTypes, setSelectedPropertyType, 'property', 'name')}
                                    {renderDropdown("Premise Type", "Select...", selectedType, types, setSelectedType, 'type', 'type_name')}
                                    {renderDropdown("Area", "Select Area...", selectedArea, areas, setSelectedArea, 'area', 'name')}
                                    <View style={{ marginTop: 4 }}>
                                        <Text style={styles.inputLabel}>Status</Text>
                                        <Switch value={status} onValueChange={setStatus} />
                                    </View>
                                </View>
                            </ScrollView>
                        ) : (
                            <>
                                <View style={[styles.formRow, { zIndex: dropdownOpen ? 1000 : 1 }]}>
                                    {renderDropdown("Module Name", "Select...", selectedModule, modules, setSelectedModule, 'module', 'module_name', { flex: 1.5, marginRight: 8 })}
                                    {renderDropdown("Country", "Select...", selectedCountry, countries, setSelectedCountry, 'country', 'country_name', { flex: 1.2, marginRight: 8 })}
                                    {renderDropdown("Property Type", "Select...", selectedPropertyType, propertyTypes, setSelectedPropertyType, 'property', 'name', { flex: 1, marginRight: 8 })}
                                    {renderDropdown("Premise Type", "Select...", selectedType, types, setSelectedType, 'type', 'type_name', { flex: 1, marginRight: 8 })}
                                    {renderDropdown("Area", "Select Area...", selectedArea, areas, setSelectedArea, 'area', 'name', { flex: 1.2, marginRight: 8 })}
                                    <View style={styles.statusContainer}>
                                        <Text style={styles.inputLabel}>Status</Text>
                                        <Switch value={status} onValueChange={setStatus} />
                                    </View>
                                </View>
                                {renderStructure()}
                            </>
                        )}
                        <View style={styles.modalFooter}>
                            <Button mode="outlined" onPress={() => setModalVisible(false)} style={{ marginRight: 12 }}>Cancel</Button>
                            <Button mode="contained" onPress={handleSave} buttonColor="#673ab7">Save</Button>
                        </View>
                    </Modal>

                    <AlertDialog
                        visible={alertConfig.visible}
                        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                    />

                    <Modal visible={deleteModalVisible} onDismiss={() => setDeleteModalVisible(false)} contentContainerStyle={styles.deleteModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(152, 37, 152, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                <MaterialCommunityIcons name="alert" size={24} color="rgb(152, 37, 152)" />
                            </View>
                            <Title style={styles.deleteModalTitle}>Delete Module</Title>
                            <Text style={styles.deleteModalText}>Are you sure you want to delete this module configuration? This action cannot be undone.</Text>
                            <View style={styles.deleteModalActions}>
                                <Button mode="outlined" onPress={() => setDeleteModalVisible(false)} style={styles.cancelBtn}>Cancel</Button>
                                <Button mode="contained" onPress={confirmDelete} style={styles.deleteBtn} buttonColor="rgb(152, 37, 152)">Delete</Button>
                            </View>
                        </View>
                    </Modal>
                </Portal>
            </View>
        </AppLayout >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 24,
    },
    pageHeader: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    controlsHeader: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 16,
        alignItems: 'flex-end',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 48,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#1e293b',
        outlineStyle: 'none',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    iconBoxBlue: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#eff6ff', // blue-50
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginRight: 12,
    },
    badgePill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    badgePillText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'white',
    },
    badgeRent: {
        backgroundColor: '#f59e0b', // Orange
    },
    badgeOwn: {
        backgroundColor: '#6366f1', // Indigo/Purple
    },
    subText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    cellTextUppercase: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
    },
    cellTextBold: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    // Mobile Card New Styles
    mobileTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mobileMainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    mobileInfoCol: {
        flex: 1,
    },
    tableCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#e8e0f0',
        overflow: 'hidden',
        shadowColor: '#673ab7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    tableHeader: {
        backgroundColor: '#5c6bc0',
        borderBottomWidth: 1,
        borderBottomColor: '#5e35a1',
    },
    headerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    row: {
        borderBottomColor: '#e2e8f0',
        borderBottomWidth: 1,
        borderStyle: 'dotted',
        height: 64,
    },
    nameCell: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#fff3e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    moduleName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    cellText: {
        fontSize: 13,
        color: '#475569',
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff3e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    badgeActive: { backgroundColor: '#dcfce7' },
    badgeInactive: { backgroundColor: '#f1f5f9' },
    badgeText: { fontSize: 11, fontWeight: '700' },
    badgeTextActive: { color: '#166534' },
    badgeTextInactive: { color: '#64748b' },
    modalContent: { backgroundColor: 'white', padding: 32, borderRadius: 12, width: '90%', maxWidth: 1000, alignSelf: 'center' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSubtitle: { fontSize: 13, color: '#64748b' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
    formRow: { flexDirection: 'row', alignItems: 'center' },
    inputContainer: { flex: 1 },
    inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
    dropdownTriggerActive: { borderColor: '#673ab7' },
    dropdownText: { fontSize: 14 },
    placeholderText: { color: '#94a3b8' },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        marginTop: 4,
        zIndex: 9999,
        elevation: 5,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dropdownItemText: { fontSize: 14, color: '#1e293b' },
    statusContainer: { marginLeft: 16 },
    structureSection: { marginTop: 20 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 10 },
    structureBox: { padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 },
    structureTextPlaceholder: { color: '#94a3b8', fontSize: 14 },
    structureListContainer: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
    structureHeader: { flexDirection: 'row', padding: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    structureHeaderText: { fontWeight: '700', fontSize: 14, color: '#334155' },
    accordionContainer: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
    accordionTitle: { fontWeight: '600' },
    accordionContent: { paddingLeft: 20, paddingBottom: 10 },
    fieldItem: { flexDirection: 'row', alignItems: 'center' },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
    paginationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        width: '100%',
    },
    paginationLeft: {
        flex: 1,
        justifyContent: 'center',
    },
    paginationRight: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    paginationInfo: {
        fontSize: 13,
        color: '#64748b',
    },
    paginationBold: {
        fontWeight: '700',
        color: '#1e293b',
    },
    pageBtn: {
        minWidth: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 0,
    },
    pageBtnNav: {
        backgroundColor: '#f8fafc',
    },
    pageBtnOutlined: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pageBtnActive: {
        backgroundColor: '#673ab7',
        borderColor: '#673ab7',
    },
    pageBtnDisabled: {
        opacity: 0.4,
        backgroundColor: '#f1f5f9',
    },
    pageBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    pageBtnTextActive: {
        color: '#ffffff',
    },
    pageBtnTextOutlined: {
        color: '#673ab7',
    },
    pageBtnTextDisabled: {
        color: '#94a3b8',
    },
    mobileCardItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#673ab7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#e8e0f0',
    },
    mobileHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mobileTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 8,
        flex: 1,
    },
    mobileDetailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    mobileDetailItem: {
        width: '48%',
        marginBottom: 4,
    },
    mobileDetailLabel: {
        fontSize: 11,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 2,
        fontWeight: '600',
    },
    mobileDetailValue: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    mobileFooterRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    deleteModalContent: { backgroundColor: 'white', padding: 24, borderRadius: 16, width: '90%', maxWidth: 400, alignSelf: 'center' },
    deleteModalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    deleteModalText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    deleteModalActions: { flexDirection: 'row', width: '100%', gap: 12 },
    cancelBtn: { flex: 1, borderColor: '#e2e8f0' },
    deleteBtn: { flex: 1, elevation: 0 },
});

export default SubModulesScreen;
