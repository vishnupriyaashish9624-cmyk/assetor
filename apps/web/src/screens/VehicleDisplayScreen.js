import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Card, Text, Button, IconButton, ActivityIndicator, Chip, DataTable, Portal, Modal, Surface, TextInput, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/client';
import { uploadFile } from '../api/officeApi';
import AppLayout from '../components/AppLayout';
import ModuleFormModal from '../components/modals/ModuleFormModal';
import VehicleWizardModal from '../components/modals/VehicleWizardModal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';


const parseFileConfig = (str) => {
    if (str && str.startsWith("JSON:")) {
        try { return JSON.parse(str.replace("JSON:", "")); } catch (e) { return {}; }
    }
    return {};
};

const VehicleDisplayScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1024; // Mobile/Tablet breakpoint
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [vehicleWizardVisible, setVehicleWizardVisible] = useState(false);
    const [vehicles, setVehicles] = useState([]);

    // Pagination State
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Detail View State
    // Detail View State
    const [selectedModule, setSelectedModule] = useState(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [moduleDetails, setModuleDetails] = useState([]); // [{ section, fields: [] }]
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);

    const [formValues, setFormValues] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Header Dropdown States
    const [countryMenuVisible, setCountryMenuVisible] = useState(false);
    const [formTypeMenuVisible, setFormTypeMenuVisible] = useState(false);
    const [typeMenuVisible, setTypeMenuVisible] = useState(false);
    const [areaMenuVisible, setAreaMenuVisible] = useState(false);
    const [usageMenuVisible, setUsageMenuVisible] = useState(false);
    const [areas, setAreas] = useState([]);
    const [premisesTypes, setPremisesTypes] = useState([]);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [countries, setCountries] = useState([]);
    const [vehicleUsages, setVehicleUsages] = useState([]);
    const [openMenuFieldId, setOpenMenuFieldId] = useState(null);

    // Store unfiltered module structure for dynamic filtering
    const [unfilteredModuleDetails, setUnfilteredModuleDetails] = useState([]);

    // Delete Confirmation Dialog State
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        fetchModules();
        fetchCountries();
        fetchAreas();
        fetchPremisesTypes();
        fetchPropertyTypes();
        fetchVehicleUsage();
    }, []);

    // Pagination & Search Effects
    useEffect(() => {
        fetchVehicles();
    }, [page, itemsPerPage]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 0) fetchVehicles();
            else setPage(0); // This will trigger the above effect
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Auto-filter fields when country/type/area/usage changes in formValues
    useEffect(() => {
        const filterFields = async () => {
            if (unfilteredModuleDetails.length > 0 && modules.length > 0) {
                const vehicleModule = modules.find(m => (m.name || '').toLowerCase() === 'vehicle');
                if (vehicleModule) {
                    const selectedFieldIds = await fetchSelectedFields(
                        vehicleModule.module_id,
                        formValues.country_id,
                        formValues.property_type_id || formValues.premises_type_id,
                        formValues.premises_type_id,
                        formValues.area_id,
                        formValues.vehicle_usage_id,
                        formValues.region
                    );

                    console.log('[useEffect] Auto-filtering with field IDs:', selectedFieldIds);

                    const filteredStructure = filterModuleStructure(unfilteredModuleDetails, selectedFieldIds);
                    setModuleDetails(filteredStructure);
                }
            }
        };

        filterFields();
    }, [formValues.country_id, formValues.premises_type_id, formValues.area_id, formValues.property_type_id, formValues.vehicle_usage_id, formValues.region, unfilteredModuleDetails]);

    const fetchAreas = async () => {
        try {
            const res = await api.get('areas');
            setAreas(res.data.data || []);
        } catch (e) {
            console.error('Fetch areas error', e);
        }
    };

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const res = await api.get('vehicles', {
                params: {
                    search,
                    page: page + 1, // API usually expects 1-based page
                    limit: itemsPerPage
                }
            });

            if (res.data.success) {
                setVehicles(res.data.data || []);
                setTotalItems(res.data.pagination?.totalItems || 0);
            }
        } catch (e) {
            console.error('Fetch vehicles error', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await api.get('countries');
            setCountries(res.data.data || []);
        } catch (e) {
            console.error('Fetch countries error', e);
        }
    };

    const fetchPremisesTypes = async () => {
        try {
            const res = await api.get('premises-types');
            setPremisesTypes(res.data.data || []);
        } catch (e) {
            console.error('Fetch premises types error', e);
        }
    };

    const fetchVehicleUsage = async () => {
        try {
            const res = await api.get('vehicle-usage');
            setVehicleUsages(res.data.data || []);
        } catch (e) {
            console.error('Fetch vehicle usage error', e);
        }
    };

    const fetchPropertyTypes = async () => {
        try {
            const res = await api.get('property-types');
            setPropertyTypes(res.data.data || []);
        } catch (e) {
            console.error('Fetch property types error', e);
        }
    };

    const fetchOtherData = async () => {
        try {
            const [ptRes, propRes] = await Promise.all([
                api.get('premises-types'),
                api.get('property-types')
            ]);
            if (ptRes.data?.success) setPremisesTypes(ptRes.data.data || []);
            if (propRes.data?.success) setPropertyTypes(propRes.data.data || []);
        } catch (e) {
            console.error('Fetch error', e);
        }
    };

    const fetchModules = async () => {
        try {
            setLoading(true);
            const response = await api.get('company-modules');
            setModules(response.data.data || []);
            // After modules, fetch actual data
            fetchVehicles();
        } catch (error) {
            console.error('Fetch modules error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to fetch selected fields based on conditions
    const fetchSelectedFields = async (moduleId, countryId, propertyTypeId, premisesTypeId, areaId, vehicleUsageId, region, targetCompanyId) => {
        try {
            const params = new URLSearchParams({
                module_id: moduleId
            });

            if (countryId) params.append('country_id', countryId);
            if (propertyTypeId) params.append('property_type_id', propertyTypeId);
            if (premisesTypeId) params.append('premises_type_id', premisesTypeId);
            if (areaId) params.append('area_id', areaId);
            if (vehicleUsageId) params.append('vehicle_usage_id', vehicleUsageId);
            if (region && region !== 'All') params.append('region', region);
            if (targetCompanyId) params.append('target_company_id', targetCompanyId);

            const res = await api.get(`company-modules/selected-fields?${params.toString()}`);
            if (res.data.success) {
                return res.data.data.selected_field_ids; // Can be null if no config match
            }
            return null;
        } catch (error) {
            console.error('Error fetching selected fields:', error);
            return null;
        }
    };

    // Helper function to filter fields based on selected field IDs
    const filterModuleStructure = (structure, selectedFieldIds) => {
        if (!selectedFieldIds) return structure;
        if (selectedFieldIds.length === 0) {
            // If explicit configuration found but empty, return empty
            return [];
        }

        return structure.map(section => ({
            ...section,
            fields: section.fields.filter(field =>
                selectedFieldIds.includes(field.id) ||
                selectedFieldIds.includes(field.field_id)
            )
        })).filter(section => section.fields.length > 0); // Remove empty sections
    };

    const handleSaveModule = async (moduleData) => {
        try {
            await api.post('company-modules', moduleData);
            setAddModalVisible(false);
            fetchModules();
        } catch (error) {
            console.error('Save error', error);
            alert('Failed to add module');
        }
    };

    const fetchModuleStructure = async (module, mode = 'view', suppressModal = false, targetCompanyId = null) => {
        try {
            setDetailsLoading(true);
            setSelectedModule(module);
            if (!suppressModal) setDetailsVisible(true);
            setModuleDetails([]);
            setIsAdding(mode === 'add');
            setCurrentStep(0); // Reset step

            // 1. Get Sections
            const sectionRes = await api.get(`module-builder/${module.module_id}/sections`);
            const sections = sectionRes.data.data || [];

            // 2. Get Fields for each section
            let fullStructure = await Promise.all(sections.map(async (sec) => {
                try {
                    const fieldsRes = await api.get(`module-builder/fields?section_id=${sec.id}`);
                    return {
                        ...sec,
                        fields: fieldsRes.data.data || []
                    };
                } catch (e) {
                    console.error('Field fetch error', e);
                    return { ...sec, fields: [] };
                }
            }));

            setModuleDetails(fullStructure);
            setUnfilteredModuleDetails(fullStructure); // Store for dynamic filtering

            // Pre-load auto-generated IDs
            if (mode === 'add') {
                const newValues = {};
                for (const sec of fullStructure) {
                    for (const field of (sec.fields || [])) {
                        if (field.field_type === 'auto_generated') {
                            try {
                                const idRes = await api.get(`module-builder/preview-id?module_id=${module.module_id}&field_key=${field.field_key}`);
                                if (idRes.data.success) {
                                    newValues[field.field_key] = idRes.data.data;
                                }
                            } catch (e) {
                                console.error('Failed to pre-load ID', e);
                            }
                        }
                    }
                }
                setFormValues(v => ({ ...v, ...newValues }));
            }
        } catch (error) {
            console.error('Fetch structure error:', error);
            alert('Failed to load module details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleAddVehicle = () => {
        setFormValues({});
        setVehicleWizardVisible(true);
    };

    const handleSaveVehicleWizard = async (data) => {
        try {
            console.log('Saving Vehicle Wizard Data:', data);

            let res;
            if (data.vehicle_id) {
                res = await api.put(`vehicles/${data.vehicle_id}`, data);
            } else {
                res = await api.post('vehicles', data);
            }

            if (res.data.success) {
                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: res.data.message || 'Vehicle saved successfully!',
                    type: 'success'
                });
                fetchVehicles();
                setVehicleWizardVisible(false);
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: res.data.message || 'Failed to save vehicle',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Save vehicle error:', error);
            const msg = error.response?.data?.message || 'Failed to save vehicle';
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: msg,
                type: 'error'
            });
        }
    };



    const onInputChange = (key, value) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleInputChange = async (key, value) => {
        const newFormValues = {
            ...formValues,
            [key]: value
        };
        setFormValues(prev => ({ ...prev, [key]: value }));

        // If user changes country, type, or area, re-filter the fields
        // If user changes configuration keys, re-filter the fields
        const configKeys = ['country_id', 'premises_type_id', 'area_id', 'property_type_id', 'vehicle_usage_id', 'region'];
        if (configKeys.includes(key) && unfilteredModuleDetails.length > 0) {
            const vehicleModule = modules.find(m => (m.name || '').toLowerCase() === 'vehicle');
            if (vehicleModule) {
                const selectedFieldIds = await fetchSelectedFields(
                    vehicleModule.module_id,
                    key === 'country_id' ? value : newFormValues.country_id,
                    key === 'property_type_id' ? value : newFormValues.property_type_id,
                    key === 'premises_type_id' ? value : newFormValues.premises_type_id,
                    key === 'area_id' ? value : newFormValues.area_id,
                    key === 'vehicle_usage_id' ? value : newFormValues.vehicle_usage_id,
                    key === 'region' ? value : newFormValues.region
                );

                const filteredStructure = filterModuleStructure(unfilteredModuleDetails, selectedFieldIds);
                setModuleDetails(filteredStructure);

            }
        }
    };

    const handleEditVehicle = async (item) => {
        try {
            setFormValues(item);

            // Find vehicle module for editing too
            let vehicleModule = modules.find(m =>
                (m.module_name || m.name || '').toLowerCase().includes('vehicle')
            );
            if (!vehicleModule) vehicleModule = modules.find(m => m.module_id === 2);

            if (vehicleModule) {
                await fetchModuleStructure(vehicleModule, 'add', true);
            } else {
                setIsAdding(true);
                setVehicleWizardVisible(true);
            }

            // Fetch full details if needed
            try {
                const fullRes = await api.get(`vehicles/${item.vehicle_id}`);
                if (fullRes.data.success) {
                    setFormValues(fullRes.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch full vehicle details", err);
            }
            setVehicleWizardVisible(true);
        } catch (error) {
            console.error('Edit vehicle error:', error);
        }
    };

    const handleDeleteVehicle = (item) => {
        setItemToDelete(item);
        setDeleteDialogVisible(true);
    };

    const confirmDeleteVehicle = async () => {
        if (!itemToDelete) return;

        try {
            const res = await api.delete(`vehicles/${itemToDelete.vehicle_id}?company_id=${itemToDelete.company_id}`);

            if (res.data.success) {
                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: 'Vehicle deleted successfully!',
                    type: 'success'
                });
                fetchVehicles(); // Refresh the list
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: res.data.message || 'Failed to delete vehicle',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Delete vehicle error:', error);
            const msg = error.response?.data?.message || 'Failed to delete vehicle.';
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

    const fetchVehicleSnapshot = async (item) => {
        try {
            setDetailsLoading(true);

            // Find vehicle module more robustly
            // 1. Try exact module_id 6 (Standard Vehicle Module)
            let vehicleModule = modules.find(m => m.module_id === 6);

            // 2. Fallback to name-based search
            if (!vehicleModule) {
                vehicleModule = modules.find(m =>
                    (m.module_name || m.name || '').toLowerCase().includes('vehicle')
                );
            }

            if (vehicleModule) {
                await fetchModuleStructure(vehicleModule, 'view', false, item.company_id);
            } else {
                // Critical Fix: Ensure adding state is false for view mode fallback
                setIsAdding(false);
                setDetailsVisible(true);
                console.warn('No specific vehicle module structure found for this user/company');
            }

            setFormValues(item);

            try {
                const fullRes = await api.get(`vehicles/${item.vehicle_id}`);
                if (fullRes.data.success) {
                    setFormValues(fullRes.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch full vehicle details", err);
            }
        } catch (error) {
            console.error('Fetch snapshot error:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleNextStep = () => {
        if (currentStep < moduleDetails.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const submitVehicleForm = async () => {
        try {
            console.log('Submitting Form Values:', formValues);

            if (!formValues.vehicle_name || !formValues.license_plate) {
                setAlertConfig({ visible: true, title: 'Missing Field', message: 'Name and License Plate are required', type: 'warning' });
                return;
            }

            const payload = {
                ...formValues,
                status: formValues.status || 'ACTIVE'
            };

            // Check if we're updating or creating
            const isUpdate = formValues.vehicle_id;
            let res;

            try {
                if (isUpdate) {
                    res = await api.put(`vehicles/${formValues.vehicle_id}`, payload);
                } else {
                    res = await api.post('vehicles', payload);
                }

                if (res.data.success) {
                    setAlertConfig({
                        visible: true,
                        title: 'Success',
                        message: isUpdate ? 'Vehicle Updated Successfully!' : 'Vehicle Saved Successfully!',
                        type: 'success'
                    });
                    setDetailsVisible(false);
                    setAddModalVisible(false);
                    fetchVehicles(); // Refresh list
                } else {
                    setAlertConfig({
                        visible: true,
                        title: 'Error',
                        message: res.data.message || 'Unknown error',
                        type: 'error'
                    });
                }
            } catch (apiError) {
                // Fallback for demo/UI testing if API is not ready
                console.warn('API call failed, updating local state for demo purposes', apiError);
                setDetailsVisible(false);
                setAddModalVisible(false);
                // In a real app we'd show the error, but for this demo request we might want UI feedback
                // setAlertConfig({ visible: true, title: 'Error', message: 'API not ready', type: 'error' });
                setAlertConfig({
                    visible: true,
                    title: 'Info',
                    message: 'Vehicle API not reachable (Mock Mode)',
                    type: 'info'
                });
            }

        } catch (error) {
            console.error('Save vehicle error:', error);
        }
    };

    const filteredModules = modules.filter(m => {
        if ((m.name || '').toLowerCase() !== 'vehicle') return false;
        const name = (m.name || '').toLowerCase();
        const searchStr = (search || '').toLowerCase();
        return name.includes(searchStr);
    });

    const renderPrimaryDetails = () => {
        const vehicleName = formValues.vehicle_name || '-';
        const company = formValues.company_name || '-';
        const country = formValues.country_name || formValues.country || '-';
        const region = formValues.region || '-';
        const usage = formValues.vehicle_usage_name || formValues.vehicle_usage || '-';
        const vehicleType = formValues.vehicle_type_name || formValues.type || '-';
        const status = formValues.status || 'ACTIVE';

        const statusColor = status === 'ACTIVE' ? '#22c55e' : '#ef4444';
        const statusBg = status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2';

        const infoTiles = [
            { icon: 'office-building-outline', label: 'Company', value: company, color: '#6366f1', bg: '#eef2ff' },
            { icon: 'earth', label: 'Country', value: country, color: '#0ea5e9', bg: '#f0f9ff' },
            { icon: 'map-marker-outline', label: 'Region / State', value: region, color: '#f59e0b', bg: '#fffbeb' },
            { icon: 'car-clock', label: 'Usage', value: usage, color: '#10b981', bg: '#f0fdf4' },
            { icon: 'car-multiple', label: 'Vehicle Type', value: vehicleType, color: '#f97316', bg: '#fff7ed' },
        ];

        return (
            <Surface style={[styles.sectionCard, { marginBottom: 20 }]}>
                {/* Purple header with vehicle name + status badge */}
                <View style={{
                    backgroundColor: '#673ab7',
                    paddingHorizontal: 24, paddingVertical: 18,
                    flexDirection: 'row', alignItems: 'center', gap: 16,
                }}>
                    <View style={{
                        width: 52, height: 52, borderRadius: 14,
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <MaterialCommunityIcons name="car" size={28} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: 'white', letterSpacing: 0.3 }}>
                            {vehicleName}
                        </Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                            1. Primary Information
                        </Text>
                    </View>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: statusBg, borderRadius: 20 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: statusColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {status}
                        </Text>
                    </View>
                </View>

                {/* 5 info tiles — match the table columns */}
                <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {infoTiles.filter(tile => tile.value && tile.value !== '-').map((tile, i) => (
                        <View key={i} style={{
                            flex: 1,
                            minWidth: isMobile ? '100%' : 'calc(33% - 7px)',
                            maxWidth: isMobile ? '100%' : 'calc(33% - 7px)',
                            backgroundColor: tile.bg,
                            borderRadius: 12, padding: 14,
                            borderWidth: 1, borderColor: tile.color + '28',
                            flexDirection: 'row', alignItems: 'center', gap: 12,
                        }}>
                            <View style={{
                                width: 38, height: 38, borderRadius: 10,
                                backgroundColor: tile.color + '1A',
                                justifyContent: 'center', alignItems: 'center',
                            }}>
                                <MaterialCommunityIcons name={tile.icon} size={20} color={tile.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                                    {tile.label}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }} numberOfLines={1}>
                                    {tile.value}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </Surface>
        );
    };


    const renderSection = (sec, index) => {
        // Find matching company module config to filter fields
        const matchingConfig = modules.find(m =>
            (m.name || '').toLowerCase() === 'vehicle' &&
            (m.country_id == countries.find(c => c.country_name === formValues.country)?.id || !m.country_id) &&
            (m.premises_type_id == (formValues.premise_type === 'OWNED' ? 1 : 2) || !m.premises_type_id) && // Assuming 1=Owned, 2=Rental based on common logic
            (m.area_id == areas.find(a => a.name === formValues.area)?.id || !m.area_id)
        );

        // In add/edit mode: show all active fields
        // In view mode: only show fields that have data
        const fieldsToRender = (sec.fields || []).filter(f => {
            const rawKey = f.field_key || f.field_name || f.name || f.field_label || f.label || `field_${f.id}`;
            const compositeKey = `sec${sec.id}_${rawKey}`;

            const getValue = (k) => {
                if (formValues[k] !== undefined && formValues[k] !== null && formValues[k] !== '') return formValues[k];
                if (formValues[k + '_'] !== undefined && formValues[k + '_'] !== null && formValues[k + '_'] !== '') return formValues[k + '_'];
                return undefined;
            };

            const val = getValue(compositeKey) || getValue(rawKey);

            if (isAdding) {
                // Show all active fields when adding/editing
                return f.is_active !== 0;
            } else {
                // Only show fields with non-empty data in view mode
                const hasData = val !== undefined && val !== null && val !== '' && val !== 'null' && val !== '-';
                return hasData;
            }
        });

        if (fieldsToRender.length === 0) return null;

        return (
            <Surface key={sec.id} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{index}. {sec.name}</Text>
                </View>
                <View style={styles.formContainer}>
                    {isAdding ? (
                        fieldsToRender.length > 0 ? (
                            fieldsToRender.map(field => {
                                const isDropdown = ['dropdown', 'select', 'multiselect'].includes(field.field_type);
                                const isDate = ['date', 'datetime', 'time'].includes(field.field_type);
                                const isBool = ['checkbox', 'switch'].includes(field.field_type);
                                const isRadio = field.field_type === 'radio';
                                const isTextarea = field.field_type === 'textarea';
                                const isFile = field.field_type === 'file' || (field.label || '').toLowerCase().includes('document') || (field.label || '').toLowerCase().includes('file');
                                const isImage = field.field_type === 'image';
                                const rawKey = field.field_key || field.field_name || field.name || field.field_label || field.label || `field_${field.id}`;
                                const compositeKey = `sec${sec.id}_${rawKey}`;
                                const fieldKey = compositeKey; // Use namespaced key for consistency

                                const getValue = (k) => {
                                    if (formValues[k] !== undefined && formValues[k] !== null && formValues[k] !== '') return formValues[k];
                                    if (formValues[k + '_'] !== undefined && formValues[k + '_'] !== null && formValues[k + '_'] !== '') return formValues[k + '_'];
                                    return undefined;
                                };

                                const val = getValue(compositeKey) || getValue(rawKey) || '';
                                const fieldWidth = (isMobile || isTextarea || isFile || isImage) ? '100%' : '48%';

                                if (isBool) {
                                    return (
                                        <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, backgroundColor: 'white' }}>
                                                <Text style={styles.inputLabel}>{field.label}</Text>
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                                    onPress={() => onInputChange(fieldKey, !val)}
                                                >
                                                    <MaterialCommunityIcons
                                                        name={field.field_type === 'switch' ? (val ? 'toggle-switch' : 'toggle-switch-off-outline') : (val ? 'checkbox-marked' : 'checkbox-blank-outline')}
                                                        size={24} color={val ? "#3b82f6" : "#94a3b8"}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                }

                                if (isRadio) {
                                    return (
                                        <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                            <Text style={styles.inputLabel}>{field.label}</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
                                                {(field.options && field.options.length > 0 ? field.options : []).map((opt, idx) => {
                                                    const optVal = opt.option_value || opt.value || opt.option_label;
                                                    const isSelected = val === optVal;
                                                    return (
                                                        <TouchableOpacity
                                                            key={idx}
                                                            style={{ flexDirection: 'row', alignItems: 'center' }}
                                                            onPress={() => onInputChange(fieldKey, optVal)}
                                                        >
                                                            <MaterialCommunityIcons
                                                                name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                                                                size={20}
                                                                color={isSelected ? "#3b82f6" : "#94a3b8"}
                                                            />
                                                            <Text style={{ marginLeft: 8, color: '#475569', fontSize: 13 }}>{opt.option_label || opt.label}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    );
                                }

                                if (isDropdown) {
                                    let displayVal = val || '';
                                    if (val && field.options && Array.isArray(field.options)) {
                                        const selectedOpt = field.options.find(opt => (opt.option_value || opt.value || opt.option_label) === val);
                                        if (selectedOpt) {
                                            displayVal = selectedOpt.option_label || selectedOpt.label || val;
                                        }
                                    }

                                    return (
                                        <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                            <Text style={styles.inputLabel}>{field.label}</Text>
                                            <Menu
                                                visible={openMenuFieldId === field.id}
                                                onDismiss={() => setOpenMenuFieldId(null)}
                                                anchorPosition="bottom"
                                                statusBarHeight={44}
                                                anchor={
                                                    <TouchableOpacity onPress={() => setOpenMenuFieldId(field.id)}>
                                                        <TextInput
                                                            mode="outlined"
                                                            placeholder={field.placeholder || `Select ${field.label}`}
                                                            value={displayVal}
                                                            editable={false}
                                                            style={styles.textInput}
                                                            pointerEvents="none"
                                                            outlineColor="#e2e8f0"
                                                            activeOutlineColor="#3b82f6"
                                                            theme={{ roundness: 8 }}
                                                            right={<TextInput.Icon icon="chevron-down" color="#94a3b8" onPress={() => setOpenMenuFieldId(field.id)} />}
                                                        />
                                                    </TouchableOpacity>
                                                }
                                                contentStyle={styles.menuContent}
                                            >
                                                <ScrollView style={{ maxHeight: 200, width: 220 }}>
                                                    {(() => {
                                                        const options = field.options && field.options.length > 0 ? field.options : [];
                                                        console.log(`Field ${field.label} (${field.field_key}) options:`, options);

                                                        if (options.length === 0) {
                                                            return (
                                                                <Menu.Item
                                                                    title="No options available"
                                                                    disabled
                                                                    titleStyle={{ color: '#94a3b8', fontStyle: 'italic' }}
                                                                />
                                                            );
                                                        }

                                                        return options.map((opt, idx) => {
                                                            const optVal = opt.option_value || opt.value || opt.option_label;
                                                            return (
                                                                <Menu.Item
                                                                    key={idx}
                                                                    onPress={() => {
                                                                        onInputChange(fieldKey, optVal);
                                                                        setOpenMenuFieldId(null);
                                                                    }}
                                                                    title={opt.option_label}
                                                                    titleStyle={styles.menuItemLabel}
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                </ScrollView>
                                            </Menu>
                                        </View>
                                    );
                                }

                                if (isFile || isImage) {
                                    return (
                                        <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                            <Text style={styles.inputLabel}>{field.label}</Text>
                                            <TouchableOpacity
                                                style={{
                                                    height: 56,
                                                    borderWidth: 1,
                                                    borderColor: val ? '#3b82f6' : '#cbd5e1',
                                                    borderStyle: 'dashed',
                                                    borderRadius: 8,
                                                    backgroundColor: val ? '#eff6ff' : '#f8fafc',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 16,
                                                    gap: 12
                                                }}
                                                onPress={() => {
                                                    if (typeof document !== 'undefined') {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        if (isImage) input.accept = 'image/*';
                                                        input.onchange = (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                // For now we just store filename for display
                                                                // Actual upload logic would go here
                                                                onInputChange(fieldKey, file.name);
                                                            }
                                                        };
                                                        input.click();
                                                    }
                                                }}
                                            >
                                                <View style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 6,
                                                    backgroundColor: val ? '#3b82f6' : '#f1f5f9',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <MaterialCommunityIcons
                                                        name={isImage ? "image" : "file-upload"}
                                                        size={18}
                                                        color={val ? "white" : "#64748b"}
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '600', color: val ? '#1e40af' : '#475569' }} numberOfLines={1}>
                                                        {val || (isImage ? 'Click to upload image' : 'Click to upload file')}
                                                    </Text>
                                                    {!val && <Text style={{ fontSize: 11, color: '#94a3b8' }}>Max size: 10MB</Text>}
                                                </View>
                                                {val && (
                                                    <IconButton
                                                        icon="close-circle"
                                                        size={20}
                                                        iconColor="#ef4444"
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            onInputChange(fieldKey, '');
                                                        }}
                                                    />
                                                )}
                                            </TouchableOpacity>

                                            {/* Render Conditional Date Fields */}
                                            {(() => {
                                                const config = parseFileConfig(field.placeholder);

                                                const pickDate = (key) => {
                                                    if (typeof document !== 'undefined') {
                                                        const input = document.createElement('input');
                                                        input.type = 'date';
                                                        input.value = formValues[key] || '';
                                                        input.onchange = (e) => onInputChange(key, e.target.value);
                                                        // create a temporary form to ensure compatibility
                                                        input.style.opacity = '0';
                                                        input.style.position = 'fixed';
                                                        input.style.top = '0';
                                                        document.body.appendChild(input);

                                                        // Try showPicker first (modern browsers)
                                                        if (input.showPicker) {
                                                            input.showPicker();
                                                        } else {
                                                            input.click();
                                                        }

                                                        // clean up
                                                        setTimeout(() => document.body.removeChild(input), 10000);
                                                    }
                                                };

                                                if (config.expiry || config.startDate || config.endDate || config.policyNo || config.issueDate || config.reminder || config.coverageType) {
                                                    return (
                                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                                            {config.policyNo && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>PROPERTY INSURANCE POLICY NO.</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="Enter Policy No."
                                                                        value={formValues[`${fieldKey}_policy_no`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${fieldKey}_policy_no`, text)}
                                                                        style={[styles.textInput, { height: 40, fontSize: 13 }]}
                                                                        outlineColor="#e2e8f0"
                                                                        activeOutlineColor="#3b82f6"
                                                                        theme={{ roundness: 8 }}
                                                                    />
                                                                </View>
                                                            )}
                                                            {config.issueDate && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>ISSUE DATE</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="YYYY-MM-DD"
                                                                        value={formValues[`${fieldKey}_issue_date`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${fieldKey}_issue_date`, text)}
                                                                        style={[styles.textInput, { height: 40, fontSize: 13 }]}
                                                                        outlineColor="#e2e8f0"
                                                                        activeOutlineColor="#3b82f6"
                                                                        theme={{ roundness: 8 }}
                                                                        right={<TextInput.Icon icon="calendar" size={16} color="#94a3b8" onPress={() => pickDate(`${fieldKey}_issue_date`)} />}
                                                                    />
                                                                </View>
                                                            )}
                                                            {config.startDate && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>START DATE</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="YYYY-MM-DD"
                                                                        value={formValues[`${fieldKey}_start_date`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${fieldKey}_start_date`, text)}
                                                                        style={[styles.textInput, { height: 40, fontSize: 13 }]}
                                                                        outlineColor="#e2e8f0"
                                                                        activeOutlineColor="#3b82f6"
                                                                        theme={{ roundness: 8 }}
                                                                        right={<TextInput.Icon icon="calendar" size={16} color="#94a3b8" onPress={() => pickDate(`${fieldKey}_start_date`)} />}
                                                                    />
                                                                </View>
                                                            )}
                                                            {config.endDate && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>END DATE</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="YYYY-MM-DD"
                                                                        value={formValues[`${fieldKey}_end_date`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${fieldKey}_end_date`, text)}
                                                                        style={[styles.textInput, { height: 40, fontSize: 13 }]}
                                                                        outlineColor="#e2e8f0"
                                                                        activeOutlineColor="#3b82f6"
                                                                        theme={{ roundness: 8 }}
                                                                        right={<TextInput.Icon icon="calendar" size={16} color="#94a3b8" onPress={() => pickDate(`${fieldKey}_end_date`)} />}
                                                                    />
                                                                </View>
                                                            )}
                                                            {config.expiry && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>EXPIRY DATE</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="YYYY-MM-DD"
                                                                        value={formValues[`${fieldKey}_expiry_date`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${fieldKey}_expiry_date`, text)}
                                                                        style={[styles.textInput, { height: 40, fontSize: 13 }]}
                                                                        outlineColor="#e2e8f0"
                                                                        activeOutlineColor="#3b82f6"
                                                                        theme={{ roundness: 8 }}
                                                                        right={<TextInput.Icon icon="calendar" size={16} color="#94a3b8" onPress={() => pickDate(`${fieldKey}_expiry_date`)} />}
                                                                    />
                                                                </View>
                                                            )}
                                                            {config.coverageType && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>COVERAGE TYPE</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="Enter Coverage Type"
                                                                        value={formValues[`${fieldKey}_coverage_type`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${fieldKey}_coverage_type`, text)}
                                                                        style={[styles.textInput, { height: 40, fontSize: 13 }]}
                                                                        outlineColor="#e2e8f0"
                                                                        activeOutlineColor="#3b82f6"
                                                                        theme={{ roundness: 8 }}
                                                                    />
                                                                </View>
                                                            )}
                                                            {config.reminder && (
                                                                <View style={{ flexGrow: 1, flexBasis: '100%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>REMINDER (DAYS BEFORE EXPIRY)</Text>
                                                                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                                                        {[30, 60, 90].map(days => (
                                                                            <Chip
                                                                                key={days}
                                                                                selected={formValues[`${fieldKey}_reminder`] === String(days)}
                                                                                onPress={() => onInputChange(`${fieldKey}_reminder`, String(days))}
                                                                                showSelectedOverlay
                                                                                style={{ backgroundColor: formValues[`${fieldKey}_reminder`] === String(days) ? '#e0f2fe' : '#f1f5f9' }}
                                                                                textStyle={{ color: formValues[`${fieldKey}_reminder`] === String(days) ? '#0284c7' : '#64748b' }}
                                                                            >{days} Days</Chip>
                                                                        ))}
                                                                    </View>
                                                                </View>
                                                            )}
                                                        </View>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </View>
                                    );
                                }
                                if (field.field_type === 'file_pdf') {
                                    return (
                                        <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                            <Text style={styles.inputLabel}>{field.label}</Text>
                                            <TouchableOpacity
                                                style={[styles.textInput, {
                                                    height: 44,
                                                    justifyContent: 'center',
                                                    backgroundColor: '#f8fafc',
                                                    borderStyle: val ? 'solid' : 'dashed',
                                                    borderColor: val ? '#10b981' : '#e2e8f0'
                                                }]}
                                                onPress={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'application/pdf';
                                                    input.onchange = async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = async () => {
                                                                try {
                                                                    const res = await uploadFile({
                                                                        name: file.name,
                                                                        content: reader.result,
                                                                        moduleName: 'Vehicle'
                                                                    });
                                                                    if (res.success) {
                                                                        onInputChange(fieldKey, res.path);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Upload failed:', err);
                                                                }
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                                                    <MaterialCommunityIcons
                                                        name={val ? "file-check" : "file-pdf-box"}
                                                        size={20}
                                                        color={val ? "#10b981" : "#64748b"}
                                                    />
                                                    <Text style={{ fontSize: 13, color: val ? "#059669" : "#64748b", fontWeight: val ? '600' : '400' }} numberOfLines={1}>
                                                        {val ? val.split('/').pop() : "Upload PDF (Auto-renaming)"}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                            {val ? (
                                                <Text style={{ fontSize: 10, color: '#16a34a', marginTop: 4, fontStyle: 'italic' }}>
                                                    File stored as: {val.split('/').pop()}
                                                </Text>
                                            ) : (
                                                <Text style={styles.helperText}>Format: v-YY-MM-DD-XXX.pdf</Text>
                                            )}
                                        </View>
                                    );
                                }

                                if (field.field_type === 'auto_generated') {
                                    const meta = field.meta_json ? (typeof field.meta_json === 'string' ? JSON.parse(field.meta_json) : field.meta_json) : {};

                                    // Automatic ID Code generation
                                    let idCode = meta.id_code;
                                    if (!idCode) {
                                        const mid = field.module_id || 2; // Default to 2 for Vehicles
                                        if (mid == 1) idCode = 'PR';
                                        else if (mid == 2) idCode = 'VH';
                                        else idCode = 'VH'; // Fallback for vehicle screen
                                    }

                                    const yearPart = new Date().getFullYear().toString();
                                    const monthPart = String(new Date().getMonth() + 1).padStart(2, '0');
                                    const dayPart = String(new Date().getDate()).padStart(2, '0');
                                    const exampleId = `COMP-${idCode}-${yearPart}-${monthPart}-${dayPart}-100`;

                                    return (
                                        <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                            <Text style={styles.inputLabel}>{field.label}</Text>
                                            <View pointerEvents="none">
                                                <TextInput
                                                    mode="outlined"
                                                    value={val || ''}
                                                    placeholder={exampleId}
                                                    placeholderTextColor="#94a3b8"
                                                    editable={false}
                                                    style={[styles.textInput, { backgroundColor: '#f8fafc' }]}
                                                    outlineColor="#e2e8f0"
                                                    left={<TextInput.Icon icon="auto-fix" color="#64748b" />}
                                                />
                                            </View>
                                            <Text style={styles.helperText}>Format: {"{prefix}"}-{idCode}-{yearPart}-{monthPart}-{dayPart}-{"{XXX}"}</Text>
                                        </View>
                                    );
                                }

                                return (
                                    <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                        <Text style={styles.inputLabel}>{field.label}</Text>
                                        <TextInput
                                            mode="outlined"
                                            placeholder={field.placeholder || `Enter ${field.label}`}
                                            value={val || ''}
                                            onChangeText={(text) => onInputChange(fieldKey, text)}
                                            autoComplete="off"
                                            style={styles.textInput}
                                            outlineColor="#e2e8f0"
                                            activeOutlineColor="#3b82f6"
                                            theme={{ roundness: 8, colors: { primary: '#3b82f6' } }}
                                            right={isDate ? <TextInput.Icon icon="calendar" color="#94a3b8" /> : null}
                                            multiline={isTextarea}
                                            numberOfLines={isTextarea ? 3 : 1}
                                        />
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.emptyText}>No fields configured in this section.</Text>
                        )
                    ) : (
                        // VIEW MODE TABLE
                        <View style={{ width: '100%', padding: 16 }}>
                            <DataTable style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                <DataTable.Header style={{ backgroundColor: '#f8fafc', height: 48, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                                    <DataTable.Title style={{ flex: 1.2 }} textStyle={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 }}>FIELD NAME</DataTable.Title>
                                    <DataTable.Title style={{ flex: 2 }} textStyle={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 }}>DATA</DataTable.Title>
                                </DataTable.Header>
                                {fieldsToRender.map((f, i) => {
                                    const rawKey = f.field_key || f.field_name || f.name || f.field_label || f.label || `field_${f.id}`;
                                    const compositeKey = `sec${sec.id}_${rawKey}`;

                                    const getValue = (k) => {
                                        if (formValues[k] !== undefined && formValues[k] !== null && formValues[k] !== '') return formValues[k];
                                        if (formValues[k + '_'] !== undefined && formValues[k + '_'] !== null && formValues[k + '_'] !== '') return formValues[k + '_'];
                                        return undefined;
                                    };

                                    const val = getValue(compositeKey) || getValue(rawKey);
                                    const isFile = f.field_type === 'file' || f.field_type === 'pdf' || f.field_type === 'file_pdf' ||
                                        (f.label || '').toLowerCase().includes('upload') ||
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

                                    const populatedMetadata = isFile ? metadata.filter(meta => formValues[`${compositeKey}_${meta.key}`]) : [];

                                    return (
                                        <React.Fragment key={f.id}>
                                            <DataTable.Row
                                                style={{
                                                    borderBottomWidth: (i === fieldsToRender.length - 1 && populatedMetadata.length === 0) ? 0 : 1,
                                                    borderBottomColor: '#f1f5f9',
                                                    minHeight: 56,
                                                    paddingVertical: 8
                                                }}
                                            >
                                                <DataTable.Cell style={{ flex: 1.2, paddingLeft: 16 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{f.label}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 2, paddingRight: 16 }}>
                                                    {isFile ? (
                                                        <View style={{ width: '100%', paddingVertical: 4 }}>
                                                            <View style={{
                                                                backgroundColor: '#f8fafc',
                                                                borderRadius: 8,
                                                                padding: 8,
                                                                borderWidth: 1,
                                                                borderColor: '#e2e8f0',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                gap: 10
                                                            }}>
                                                                <MaterialCommunityIcons name="file-document-outline" size={20} color="#3b82f6" />
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
                                                                                const SERVER_URL = 'http://localhost:5032';
                                                                                const url = val.startsWith('http') ? val : `${SERVER_URL}${val}`;
                                                                                if (Platform.OS === 'web') window.open(url, '_blank');
                                                                            }}
                                                                            style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#eff6ff', borderRadius: 4 }}
                                                                        >
                                                                            <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '700' }}>View</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </View>
                                                    ) : (
                                                        <Text style={{ fontSize: 14, color: '#1e293b', lineHeight: 20 }}>
                                                            {typeof val === 'boolean'
                                                                ? (val ? 'Yes' : 'No')
                                                                : String(val || '-')}
                                                        </Text>
                                                    )}
                                                </DataTable.Cell>
                                            </DataTable.Row>

                                            {populatedMetadata.map((meta, mIdx) => (
                                                <DataTable.Row
                                                    key={`${f.id}_${meta.key}`}
                                                    style={{
                                                        borderBottomWidth: (i === fieldsToRender.length - 1 && mIdx === populatedMetadata.length - 1) ? 0 : 1,
                                                        borderBottomColor: '#f1f5f9',
                                                        minHeight: 48,
                                                        paddingVertical: 4,
                                                        backgroundColor: '#f8fafc'
                                                    }}
                                                >
                                                    <DataTable.Cell style={{ flex: 1.2, paddingLeft: 32 }}>
                                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b' }}>{f.label} {meta.label}</Text>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={{ flex: 2, paddingRight: 16 }}>
                                                        <Text style={{ fontSize: 13, color: '#1e293b' }}>{formValues[`${compositeKey}_${meta.key}`] || formValues[`${rawKey}_${meta.key}`]}</Text>
                                                    </DataTable.Cell>
                                                </DataTable.Row>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </DataTable>
                        </View>
                    )}
                </View>
            </Surface>
        );
    };

    const renderMobileCard = (item) => {
        const vTypeName = item.vehicle_type_name || premisesTypes.find(p => p.id == item.premises_type_id)?.type_name || item.type || '';
        const vTypeUpper = vTypeName.toUpperCase();
        const pTypeName = item.property_type_name || propertyTypes.find(p => p.id == item.property_type_id)?.name || '';

        return (
            <View key={item.vehicle_id} style={styles.mobileCard}>
                <View style={styles.mobileCardHeader}>
                    <View style={styles.mobileHeaderTop}>
                        <View
                            style={[
                                styles.typeChip,
                                {
                                    backgroundColor: vTypeUpper === 'VAN' || vTypeUpper.includes('TRUCK') ? '#f59e0b' :
                                        vTypeUpper === 'SUV' ? '#10b981' :
                                            vTypeUpper === 'SEDAN' || vTypeUpper === 'CAR' ? '#6366f1' : '#94a3b8'
                                }
                            ]}
                        >
                            <Text style={[styles.typeChipText, { color: '#ffffff' }]}>
                                {vTypeName || '-'}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            <IconButton
                                icon="eye-outline"
                                size={22}
                                iconColor="rgb(239, 149, 10)"
                                onPress={() => fetchVehicleSnapshot(item)}
                                style={{ margin: 0 }}
                            />
                            <IconButton
                                icon="pencil-outline"
                                size={22}
                                iconColor="#673ab7"
                                onPress={() => handleEditVehicle(item)}
                                style={{ margin: 0 }}
                            />
                            <IconButton
                                icon="trash-can-outline"
                                size={22}
                                iconColor="#eb2f96"
                                onPress={() => handleDeleteVehicle(item)}
                                style={{ margin: 0 }}
                            />
                        </View>
                    </View>

                    <View style={styles.mobileMainInfo}>
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons
                                name={(item.vehicle_type_name || item.type || '').toUpperCase() === 'VAN' ? 'truck-delivery' : 'car'}
                                size={20}
                                color="#ff9800"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.moduleName} numberOfLines={1}>{item.vehicle_name}</Text>
                        </View>
                    </View>
                </View>

                <Divider style={{ marginVertical: 12, backgroundColor: '#f1f5f9' }} />

                <View style={styles.mobileGrid}>
                    <View style={styles.mobileGridItem}>
                        <Text style={styles.mobileLabel}>COUNTRY</Text>
                        <Text style={styles.mobileValue}>{item.country || '-'}</Text>
                    </View>
                    <View style={styles.mobileGridItem}>
                        <Text style={styles.mobileLabel}>REGION</Text>
                        <Text style={styles.mobileValue}>{item.region || '-'}</Text>
                    </View>
                    <View style={styles.mobileGridItem}>
                        <Text style={styles.mobileLabel}>USAGE</Text>
                        <Text style={styles.mobileValue}>{item.vehicle_usage_name || item.vehicle_usage || (item.area_id == 1 ? 'Commercial' : item.area_id == 2 ? 'Personal' : '-')}</Text>
                    </View>
                </View>

                {pTypeName ? (
                    <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>Property: <Text style={{ fontWeight: '600', color: '#334155' }}>{pTypeName}</Text></Text>
                    </View>
                ) : null}
            </View>
        );
    };

    return (
        <AppLayout navigation={navigation} title="Vehicle">
            <View style={styles.container}>
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.title}>Vehicle</Text>
                        <Text style={styles.subtitle}>View vehicle fleet and configurations</Text>
                    </View>
                </View>

                <View style={[styles.controlsHeader, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.searchWrapper, isMobile && { width: '100%', maxWidth: '100%' }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#64748b" style={styles.searchIcon} />
                        <RNTextInput
                            placeholder="Search vehicles..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, isMobile && { width: '100%' }]}
                        onPress={handleAddVehicle}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.addButtonText}>Add New Vehicle</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#673ab7" />
                    </View>
                ) : (
                    <>
                        {isMobile ? (
                            <ScrollView style={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                                {vehicles.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyIconCircle}>
                                            <MaterialCommunityIcons name="car-off" size={40} color="#cbd5e1" />
                                        </View>
                                        <Text style={styles.emptyTitle}>No Vehicles Found</Text>
                                        <Text style={{ color: '#94a3b8' }}>Get started by adding a new vehicle to your fleet.</Text>
                                    </View>
                                ) : (
                                    vehicles.map((item) => renderMobileCard(item))
                                )}
                            </ScrollView>
                        ) : (
                            <Card style={styles.tableCard}>
                                <DataTable>
                                    <DataTable.Header style={styles.tableHeader}>
                                        <DataTable.Title style={{ flex: 0.8, paddingLeft: 16 }} textStyle={styles.headerText}>Type</DataTable.Title>
                                        <DataTable.Title style={{ flex: 2.2 }} textStyle={styles.headerText}>Vehicle Name</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1.5 }} textStyle={styles.headerText}>Company</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1.2 }} textStyle={styles.headerText}>Country</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1.2 }} textStyle={styles.headerText}>Region/State</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1.2 }} textStyle={styles.headerText}>Usage</DataTable.Title>
                                        <DataTable.Title style={{ flex: 0.8, justifyContent: 'center' }} textStyle={styles.headerText}>Actions</DataTable.Title>
                                    </DataTable.Header>
                                    <ScrollView style={{ maxHeight: 'calc(100vh - 420px)' }}>
                                        {vehicles.map((item, index) => (
                                            <DataTable.Row key={item.vehicle_id} style={styles.row}>
                                                <DataTable.Cell style={{ flex: 0.8, paddingLeft: 16 }}>
                                                    {(() => {
                                                        const vTypeName = item.vehicle_type_name || premisesTypes.find(p => p.id == item.premises_type_id)?.type_name || item.type || '';
                                                        return (
                                                            <View style={styles.iconBox}>
                                                                <MaterialCommunityIcons
                                                                    name={(item.vehicle_type_name || item.type || '').toUpperCase() === 'VAN' ? 'truck-delivery' : 'car'}
                                                                    size={18}
                                                                    color="#ff9800"
                                                                />
                                                            </View>
                                                        );
                                                    })()}
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 2.2 }}>
                                                    <View style={{ justifyContent: 'center' }}>
                                                        <Text style={styles.moduleName} numberOfLines={1}>{item.vehicle_name}</Text>
                                                    </View>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 1.5 }}>
                                                    <Text style={styles.cellText} numberOfLines={1}>{item.company_name || '-'}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 1.2 }}>
                                                    <Text style={styles.cellText}>{item.country || '-'}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 1.2 }}>
                                                    <Text style={styles.cellText}>{item.region || '-'}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 1.2 }}>
                                                    <Text style={styles.cellText}>{item.vehicle_usage_name || item.vehicle_usage || (item.area_id == 1 ? 'Commercial' : item.area_id == 2 ? 'Personal' : '-')}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 0.8, justifyContent: 'center' }}>
                                                    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                                                        <IconButton
                                                            icon="eye-outline"
                                                            size={20}
                                                            iconColor="rgb(239, 149, 10)"
                                                            onPress={() => fetchVehicleSnapshot(item)}
                                                        />
                                                        <IconButton
                                                            icon="pencil-outline"
                                                            size={20}
                                                            iconColor="#673ab7"
                                                            onPress={() => handleEditVehicle(item)}
                                                        />
                                                        <IconButton
                                                            icon="trash-can-outline"
                                                            size={20}
                                                            iconColor="#eb2f96"
                                                            onPress={() => handleDeleteVehicle(item)}
                                                        />
                                                    </View>
                                                </DataTable.Cell>
                                            </DataTable.Row>
                                        ))}
                                        {vehicles.length === 0 && (
                                            <View style={styles.emptyState}>
                                                <View style={styles.emptyIconCircle}>
                                                    <MaterialCommunityIcons name="car-off" size={40} color="#cbd5e1" />
                                                </View>
                                                <Text style={styles.emptyTitle}>No Vehicles Found</Text>
                                                <Text style={{ color: '#94a3b8' }}>Get started by adding a new vehicle to your fleet.</Text>
                                                <Button
                                                    mode="text"
                                                    onPress={handleAddVehicle}
                                                    style={{ marginTop: 10 }}
                                                    labelStyle={{ color: '#673ab7', fontWeight: 'bold' }}
                                                >
                                                    Add New Vehicle
                                                </Button>
                                            </View>
                                        )}
                                    </ScrollView>

                                    <View style={[styles.paginationContainer, isMobile && { justifyContent: 'center' }]}>
                                        {!isMobile && (
                                            <Text style={styles.paginationInfo}>
                                                Showing <Text style={styles.paginationBold}>{totalItems === 0 ? 0 : (page * itemsPerPage) + 1}</Text> to <Text style={styles.paginationBold}>{Math.min((page + 1) * itemsPerPage, totalItems)}</Text> of <Text style={styles.paginationBold}>{totalItems}</Text>
                                            </Text>
                                        )}
                                        <View style={styles.paginationButtons}>
                                            <TouchableOpacity
                                                style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                                                onPress={() => setPage(0)}
                                                disabled={page === 0}
                                            >
                                                <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>«</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                                                onPress={() => setPage(p => Math.max(0, p - 1))}
                                                disabled={page === 0}
                                            >
                                                <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>‹</Text>
                                            </TouchableOpacity>

                                            {(() => {
                                                const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                                // Show only a few page numbers
                                                let startPage = Math.max(0, page - 2);
                                                let endPage = Math.min(totalPages - 1, startPage + 4);
                                                if (endPage - startPage < 4) startPage = Math.max(0, endPage - 4);

                                                const pages = [];
                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(
                                                        <TouchableOpacity
                                                            key={i}
                                                            style={[styles.pageBtn, page === i && styles.pageBtnActive]}
                                                            onPress={() => setPage(i)}
                                                        >
                                                            <Text style={[styles.pageBtnText, page === i && styles.pageBtnActiveText]}>{i + 1}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                }
                                                return pages;
                                            })()}

                                            <TouchableOpacity
                                                style={[styles.pageBtn, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnDisabled]}
                                                onPress={() => setPage(p => Math.min(Math.ceil(totalItems / itemsPerPage) - 1, p + 1))}
                                                disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                            >
                                                <Text style={[styles.pageBtnText, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnTextDisabled]}>›</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.pageBtn, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnDisabled]}
                                                onPress={() => setPage(Math.max(0, Math.ceil(totalItems / itemsPerPage) - 1))}
                                                disabled={page >= Math.ceil(totalItems / itemsPerPage) - 1}
                                            >
                                                <Text style={[styles.pageBtnText, page >= Math.ceil(totalItems / itemsPerPage) - 1 && styles.pageBtnTextDisabled]}>»</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </DataTable>
                            </Card>
                        )}
                    </>
                )}



                <VehicleWizardModal
                    visible={vehicleWizardVisible}
                    initialData={formValues}
                    onClose={() => {
                        setVehicleWizardVisible(false);
                        setFormValues({});
                    }}
                    onSave={handleSaveVehicleWizard}
                />

                <Portal>
                    <ModuleFormModal
                        visible={addModalVisible}
                        onClose={() => setAddModalVisible(false)}
                        onSave={handleSaveModule}
                    />
                    <Modal visible={detailsVisible && !vehicleWizardVisible} onDismiss={() => setDetailsVisible(false)} contentContainerStyle={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{isAdding ? (formValues.vehicle_id ? 'Edit Vehicle' : 'Add New Vehicle') : 'Vehicle Details'}</Text>
                                <Text style={styles.modalSub}>
                                    {isAdding ? 'Configure vehicle information and specifications' : 'Viewing full vehicle profile'}
                                </Text>
                            </View>
                            <IconButton icon="close" onPress={() => setDetailsVisible(false)} />
                        </View>

                        {isAdding && (
                            <View style={styles.fixedHeader}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>1. Sub-module Configuration</Text>
                                </View>
                                <View style={styles.headerFormContent}>
                                    <View style={styles.headerField}>
                                        <Text style={styles.inputLabel}>Country</Text>
                                        <Menu
                                            visible={countryMenuVisible}
                                            onDismiss={() => setCountryMenuVisible(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => setCountryMenuVisible(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={countries.find(c => c.id == formValues.country_id)?.country_name || ''}
                                                        placeholder="Country"
                                                        editable={false}
                                                        style={styles.headerInput}
                                                        right={<TextInput.Icon icon="chevron-down" />}
                                                    />
                                                </TouchableOpacity>
                                            }
                                        >
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {countries.map(c => (
                                                    <Menu.Item key={c.id} title={c.country_name} onPress={() => {
                                                        handleInputChange('country_id', c.id);
                                                        setCountryMenuVisible(false);
                                                    }} />
                                                ))}
                                            </ScrollView>
                                        </Menu>
                                    </View>

                                    <View style={styles.headerField}>
                                        <Text style={styles.inputLabel}>Property Type</Text>
                                        <Menu
                                            visible={formTypeMenuVisible}
                                            onDismiss={() => setFormTypeMenuVisible(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => setFormTypeMenuVisible(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={propertyTypes.find(p => p.id == formValues.property_type_id)?.name || ''}
                                                        placeholder="Property Type"
                                                        editable={false}
                                                        style={styles.headerInput}
                                                        right={<TextInput.Icon icon="chevron-down" />}
                                                    />
                                                </TouchableOpacity>
                                            }
                                        >
                                            {propertyTypes.map(p => (
                                                <Menu.Item key={p.id} title={p.name} onPress={() => {
                                                    handleInputChange('property_type_id', p.id);
                                                    setFormTypeMenuVisible(false);
                                                }} />
                                            ))}
                                        </Menu>
                                    </View>

                                    <View style={styles.headerField}>
                                        <Text style={styles.inputLabel}>Vehicle Type</Text>
                                        <Menu
                                            visible={typeMenuVisible}
                                            onDismiss={() => setTypeMenuVisible(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => setTypeMenuVisible(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={premisesTypes.find(t => t.id == formValues.premises_type_id)?.type_name || ''}
                                                        placeholder="Type"
                                                        editable={false}
                                                        style={styles.headerInput}
                                                        right={<TextInput.Icon icon="chevron-down" />}
                                                    />
                                                </TouchableOpacity>
                                            }
                                        >
                                            {premisesTypes.map(t => (
                                                <Menu.Item key={t.id} title={t.type_name} onPress={() => {
                                                    handleInputChange('premises_type_id', t.id);
                                                    setTypeMenuVisible(false);
                                                }} />
                                            ))}
                                        </Menu>
                                    </View>

                                    <View style={styles.headerField}>
                                        <Text style={styles.inputLabel}>Usage</Text>
                                        <Menu
                                            visible={usageMenuVisible}
                                            onDismiss={() => setUsageMenuVisible(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => setUsageMenuVisible(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={vehicleUsages.find(u => u.id == formValues.vehicle_usage_id)?.name || ''}
                                                        placeholder="Select Usage"
                                                        editable={false}
                                                        style={styles.headerInput}
                                                        right={<TextInput.Icon icon="chevron-down" />}
                                                    />
                                                </TouchableOpacity>
                                            }
                                        >
                                            {vehicleUsages.map(u => (
                                                <Menu.Item key={u.id} title={u.name} onPress={() => {
                                                    handleInputChange('vehicle_usage_id', u.id);
                                                    setUsageMenuVisible(false);
                                                }} />
                                            ))}
                                        </Menu>
                                    </View>

                                    <View style={styles.headerField}>
                                        <Text style={styles.inputLabel}>Area</Text>
                                        <Menu
                                            visible={areaMenuVisible}
                                            onDismiss={() => setAreaMenuVisible(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => setAreaMenuVisible(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={areas.find(a => a.id == formValues.area_id)?.name || ''}
                                                        placeholder="Area"
                                                        editable={false}
                                                        style={styles.headerInput}
                                                        right={<TextInput.Icon icon="chevron-down" />}
                                                    />
                                                </TouchableOpacity>
                                            }
                                        >
                                            {areas.map(a => (
                                                <Menu.Item key={a.id} title={a.name} onPress={() => {
                                                    handleInputChange('area_id', a.id);
                                                    setAreaMenuVisible(false);
                                                }} />
                                            ))}
                                        </Menu>
                                    </View>
                                </View>
                            </View>
                        )}

                        <ScrollView style={{ flex: 1 }}>
                            {detailsLoading ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#3b82f6" />
                                    <Text style={{ marginTop: 16, color: '#64748b' }}>Loading vehicle structure...</Text>
                                </View>
                            ) : (
                                <View style={{ padding: 20 }}>


                                    {/* Primary and Dynamic Sections */}
                                    {(() => {
                                        let renderedCount = 1;
                                        const sectionsToRender = [...moduleDetails];

                                        // Add synthetic Primary Information section at the top
                                        if (!isAdding && formValues.vehicle_id) {
                                            const primaryFields = [
                                                { id: 'p1', label: 'Vehicle Name', field_key: 'vehicle_name' },
                                                { id: 'p3', label: 'Company', field_key: 'company_name' },
                                                { id: 'p4', label: 'Manufacturer', field_key: 'manufacturer' },
                                                { id: 'p5', label: 'Model', field_key: 'model' },
                                                { id: 'p6', label: 'Variant', field_key: 'variant' },
                                                { id: 'p7', label: 'Model Year', field_key: 'model_year' },
                                                { id: 'p8', label: 'Country', field_key: 'country_name' },
                                                { id: 'p9', label: 'Status', field_key: 'status' }
                                            ];

                                            sectionsToRender.unshift({
                                                id: 'primary',
                                                name: 'Primary Information',
                                                fields: primaryFields
                                            });
                                        }

                                        return sectionsToRender.map((sec) => {
                                            const fieldsToRender = (sec.fields || []).filter(f => {
                                                // Always hide inactive fields
                                                if (f.is_active === 0) return false;

                                                if (isAdding) return true;
                                                const fk = f.field_key || f.field_name || f.name || f.field_label || f.label || `field_${f.id}`;
                                                const compositeK = `sec${sec.id}_${fk}`;
                                                const val = formValues[compositeK] || formValues[fk] || formValues[compositeK + '_'] || formValues[fk + '_'] || formValues[fk.toLowerCase()];
                                                return val !== undefined && val !== null && val !== '' && val !== 'null' && val !== '-';
                                            });
                                            if (fieldsToRender.length === 0) return null;
                                            const displayIndex = renderedCount++;
                                            return renderSection(sec, displayIndex);
                                        });
                                    })()}

                                    {!detailsLoading && (() => {
                                        // Replication of the logic used in the renderer to determine if anything was actually shown
                                        const sectionsToCheck = [...moduleDetails];
                                        if (!isAdding && formValues.vehicle_id) {
                                            sectionsToCheck.unshift({
                                                id: 'primary', name: 'Primary Information', fields: [
                                                    { label: 'Name', field_key: 'vehicle_name' }
                                                ]
                                            });
                                        }

                                        const hasItems = sectionsToCheck.some(sec => {
                                            const fieldsToRender = (sec.fields || []).filter(f => {
                                                if (f.is_active === 0) return false;
                                                if (isAdding) return true;
                                                const fk = f.field_key || f.field_name || f.name || f.field_label || f.label || `field_${f.id}`;
                                                const compositeK = `sec${sec.id}_${fk}`;
                                                const val = formValues[compositeK] || formValues[fk] || formValues[compositeK + '_'] || formValues[fk + '_'] || formValues[fk.toLowerCase()];
                                                return val !== undefined && val !== null && val !== '' && val !== 'null' && val !== '-';
                                            });
                                            return fieldsToRender.length > 0;
                                        });
                                        return !hasItems;
                                    })() && (
                                            <View style={{ padding: 20, alignItems: 'center' }}>
                                                <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#94a3b8" />
                                                <Text style={{ marginTop: 8, color: '#94a3b8', textAlign: 'center' }}>
                                                    No fields configured or populated for this module.
                                                </Text>
                                            </View>
                                        )}
                                </View>
                            )}
                        </ScrollView>

                        {isAdding && (
                            <View style={styles.modalFooter}>
                                <Button mode="contained" onPress={submitVehicleForm} style={styles.submitBtn} loading={loading}>
                                    {formValues.vehicle_id ? 'Update Vehicle' : 'Save Vehicle'}
                                </Button>
                            </View>
                        )}
                    </Modal>

                    <ConfirmDialog
                        visible={deleteDialogVisible}
                        onDismiss={() => setDeleteDialogVisible(false)}
                        onConfirm={confirmDeleteVehicle}
                        title="Delete Vehicle?"
                        message="Are you sure you want to delete this vehicle?"
                        confirmText="Delete"
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
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
    pageHeader: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#673ab7' },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    controlsHeader: { flexDirection: 'row', marginBottom: 24, gap: 16 },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 20,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#673ab7',
        paddingHorizontal: 24,
        height: 48,
        borderRadius: 100,
        justifyContent: 'center',
        shadowColor: '#673ab7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#1e293b', outlineStyle: 'none', height: '100%' },
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
        backgroundColor: '#673ab7',
        borderBottomWidth: 1,
        borderBottomColor: '#5e35a1',
        height: 52,
    },
    headerText: { fontSize: 12, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' },
    rowWrapper: { borderBottomColor: '#e2e8f0', borderBottomWidth: 1, borderStyle: 'dotted' },
    row: { minHeight: 60, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', borderStyle: 'dotted', paddingVertical: 10 },
    nameCell: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#fff3e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    moduleName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    subText: { fontSize: 11, color: '#64748b', marginTop: 2 },
    cellText: { fontSize: 14, color: '#475569' },
    typeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start' },
    typeChipText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    actionBtn: { flexDirection: 'row', alignItems: 'center' },
    actionBtnText: { fontSize: 12, color: '#673ab7', fontWeight: '600' },

    // Custom Pagination
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    paginationInfo: {
        fontSize: 14,
        color: '#64748b',
    },
    paginationBold: {
        fontWeight: '700',
        color: '#1e293b',
    },
    paginationButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    pageBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageBtnActive: {
        backgroundColor: '#673ab7',
    },
    pageBtnDisabled: {
        opacity: 0.4,
    },
    pageBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    pageBtnActiveText: {
        color: '#ffffff',
    },
    pageBtnTextDisabled: {
        color: '#94a3b8',
    },

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
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
    textInput: { backgroundColor: 'white', fontSize: 14, minHeight: 44 },
    helperText: { fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
    emptyText: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
    optionTag: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#eff6ff', borderRadius: 6, borderWidth: 1, borderColor: '#dbeafe' },
    optionText: { fontSize: 12, color: '#1e40af' },
    submitBtn: { backgroundColor: '#6c7ae0', borderRadius: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
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
        backgroundColor: '#6c7ae0',
        borderColor: '#6c7ae0',
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
    },
    // Mobile Card Styles
    mobileCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    mobileCardHeader: {
        marginBottom: 12,
    },
    mobileHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    mobileMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    mobileActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    mobileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingTop: 8,
        gap: 12
    },
    mobileGridItem: {
        flex: 1,
        minWidth: '40%',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    mobileLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    mobileValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
});

export default VehicleDisplayScreen;
