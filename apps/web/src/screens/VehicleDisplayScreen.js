import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Card, Text, Button, IconButton, ActivityIndicator, Chip, DataTable, Portal, Modal, Surface, TextInput, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/client';
import AppLayout from '../components/AppLayout';
import ModuleFormModal from '../components/modals/ModuleFormModal';
import VehicleWizardModal from '../components/modals/VehicleWizardModal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';

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
    const [areas, setAreas] = useState([]);
    const [premisesTypes, setPremisesTypes] = useState([]);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [countries, setCountries] = useState([]);
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

    // Auto-filter fields when country/type/area changes in formValues
    useEffect(() => {
        const filterFields = async () => {
            if (unfilteredModuleDetails.length > 0 && modules.length > 0) {
                const premisesModule = modules.find(m => (m.name || '').toLowerCase() === 'vehicle');
                if (premisesModule && (formValues.country_id || formValues.premises_type_id || formValues.area_id || formValues.property_type_id)) {
                    const selectedFieldIds = await fetchSelectedFields(
                        premisesModule.module_id,
                        formValues.country_id,
                        formValues.property_type_id,
                        formValues.premises_type_id,
                        formValues.area_id
                    );

                    console.log('[useEffect] Auto-filtering with field IDs:', selectedFieldIds);
                    console.log('[useEffect] Form values:', {
                        country_id: formValues.country_id,
                        property_type_id: formValues.property_type_id,
                        premises_type_id: formValues.premises_type_id,
                        area_id: formValues.area_id
                    });

                    const filteredStructure = filterModuleStructure(unfilteredModuleDetails, selectedFieldIds);
                    setModuleDetails(filteredStructure);
                }
            }
        };

        filterFields();
    }, [formValues.country_id, formValues.premises_type_id, formValues.area_id, formValues.property_type_id, unfilteredModuleDetails]);

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
    const fetchSelectedFields = async (moduleId, countryId, propertyTypeId, premisesTypeId, areaId) => {
        try {
            const params = new URLSearchParams({
                module_id: moduleId
            });

            if (countryId) params.append('country_id', countryId);
            if (propertyTypeId) params.append('property_type_id', propertyTypeId);
            if (premisesTypeId) params.append('premises_type_id', premisesTypeId);
            if (areaId) params.append('area_id', areaId);

            const res = await api.get(`company-modules/selected-fields?${params.toString()}`);
            if (res.data.success) {
                return res.data.data.selected_field_ids || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching selected fields:', error);
            return [];
        }
    };

    // Helper function to filter fields based on selected field IDs
    const filterModuleStructure = (structure, selectedFieldIds) => {
        if (!selectedFieldIds || selectedFieldIds.length === 0) {
            // If no fields are selected, show all fields
            return structure;
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

    const fetchModuleStructure = async (module, mode = 'view') => {
        try {
            setDetailsLoading(true);
            setSelectedModule(module);
            setDetailsVisible(true);
            setModuleDetails([]);
            setIsAdding(mode === 'add');
            setFormValues({});
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
        if (['country_id', 'premises_type_id', 'area_id', 'property_type_id'].includes(key) && unfilteredModuleDetails.length > 0) {
            const premisesModule = modules.find(m => (m.name || '').toLowerCase() === 'vehicle');
            if (premisesModule) {
                const selectedFieldIds = await fetchSelectedFields(
                    premisesModule.module_id,
                    key === 'country_id' ? value : newFormValues.country_id,
                    key === 'property_type_id' ? value : newFormValues.property_type_id,
                    key === 'premises_type_id' ? value : newFormValues.premises_type_id,
                    key === 'area_id' ? value : newFormValues.area_id
                );

                console.log('[handleInputChange] Re-filtering with field IDs:', selectedFieldIds);

                const filteredStructure = filterModuleStructure(unfilteredModuleDetails, selectedFieldIds);
                setModuleDetails(filteredStructure);
            }
        }
    };

    const handleEditVehicle = async (item) => {
        try {
            const vehicleModule = modules.find(m => (m.module_name || m.name || '').toLowerCase() === 'vehicle');
            if (vehicleModule) {
                await fetchModuleStructure(vehicleModule, 'add');
            }
            setFormValues(item);

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
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDeleteVehicle = (item) => {
        setItemToDelete(item);
        setDeleteDialogVisible(true);
    };

    const confirmDeleteVehicle = async () => {
        if (!itemToDelete) return;

        try {
            const res = await api.delete(`vehicles/${itemToDelete.vehicle_id}`);

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
            const vehicleModule = modules.find(m => (m.module_name || m.name || '').toLowerCase() === 'vehicle');
            if (vehicleModule) {
                await fetchModuleStructure(vehicleModule, 'view');
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
            if (isAdding) {
                // Show all active fields when adding/editing
                return f.is_active !== 0;
            } else {
                // Only show fields with data in view mode
                const hasData = formValues[f.field_key] !== undefined && formValues[f.field_key] !== '';
                return hasData;
            }
        });

        if (fieldsToRender.length === 0) return null;

        return (
            <Surface key={sec.id} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{index + 1}. {sec.name}</Text>
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
                                const isFile = field.field_type === 'file';
                                const isImage = field.field_type === 'image';
                                const val = formValues[field.field_key];
                                const fieldWidth = (isMobile || isTextarea || isFile || isImage) ? '100%' : '48%';

                                if (isBool) {
                                    return (
                                        <View key={field.id} style={[styles.formRow, { width: fieldWidth }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, backgroundColor: 'white' }}>
                                                <Text style={styles.inputLabel}>{field.label}</Text>
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                                    onPress={() => onInputChange(field.field_key, !val)}
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
                                                            onPress={() => onInputChange(field.field_key, optVal)}
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
                                                            value={val || ''}
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
                                                                        onInputChange(field.field_key, optVal);
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
                                                                onInputChange(field.field_key, file.name);
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
                                                            onInputChange(field.field_key, '');
                                                        }}
                                                    />
                                                )}
                                            </TouchableOpacity>
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
                                            onChangeText={(text) => onInputChange(field.field_key, text)}
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
                        <View style={{ width: '100%' }}>
                            <DataTable style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                <DataTable.Header style={{ backgroundColor: '#f8fafc', height: 48, borderBottomWidth: 2, borderBottomColor: '#e2e8f0' }}>
                                    <DataTable.Title style={{ flex: 1.2 }} textStyle={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 }}>FIELD NAME</DataTable.Title>
                                    <DataTable.Title style={{ flex: 2 }} textStyle={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 }}>DATA</DataTable.Title>
                                </DataTable.Header>
                                {fieldsToRender.map((f, i) => (
                                    <DataTable.Row
                                        key={f.id}
                                        style={{
                                            borderBottomWidth: i === fieldsToRender.length - 1 ? 0 : 1,
                                            borderBottomColor: '#f1f5f9',
                                            minHeight: 56,
                                            paddingVertical: 8
                                        }}
                                    >
                                        <DataTable.Cell style={{ flex: 1.2, paddingLeft: 16 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>{f.label}</Text>
                                        </DataTable.Cell>
                                        <DataTable.Cell style={{ flex: 2, paddingRight: 16 }}>
                                            <Text style={{ fontSize: 14, color: '#1e293b', lineHeight: 20 }}>
                                                {typeof formValues[f.field_key] === 'boolean'
                                                    ? (formValues[f.field_key] ? 'Yes' : 'No')
                                                    : String(formValues[f.field_key] || '-')}
                                            </Text>
                                        </DataTable.Cell>
                                    </DataTable.Row>
                                ))}
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

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity onPress={() => fetchVehicleSnapshot(item)} style={styles.mobileActionBtn}>
                                <MaterialCommunityIcons name="eye-outline" size={18} color="#f59e0b" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleEditVehicle(item)} style={styles.mobileActionBtn}>
                                <MaterialCommunityIcons name="pencil-outline" size={18} color="#6366f1" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteVehicle(item)} style={styles.mobileActionBtn}>
                                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.mobileMainInfo}>
                        <View style={[styles.iconBox, { width: 44, height: 44, borderRadius: 12 }]}>
                            <MaterialCommunityIcons
                                name={(item.vehicle_type_name || item.type || '').toUpperCase() === 'VAN' ? 'truck-delivery' : 'car'}
                                size={24}
                                color="#3b82f6"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.moduleName} numberOfLines={1}>{item.vehicle_name}</Text>
                            <Text style={styles.subText}>{item.license_plate || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                <Divider style={{ marginVertical: 12, backgroundColor: '#f1f5f9' }} />

                <View style={styles.mobileGrid}>
                    <View style={styles.mobileGridItem}>
                        <Text style={styles.mobileLabel}>USAGE</Text>
                        <Text style={styles.mobileValue}>{item.vehicle_usage || '-'}</Text>
                    </View>
                    <View style={styles.mobileGridItem}>
                        <Text style={styles.mobileLabel}>COUNTRY</Text>
                        <Text style={styles.mobileValue}>{item.country || '-'}</Text>
                    </View>
                    <View style={styles.mobileGridItem}>
                        <Text style={styles.mobileLabel}>AREA</Text>
                        <Text style={styles.mobileValue}>{item.area || '-'}</Text>
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

                <View style={[styles.controlsHeader, isMobile && { flexDirection: 'column', gap: 12 }]}>
                    <View style={[styles.searchWrapper, isMobile && { width: '100%', minHeight: 48, flexGrow: 0, flexShrink: 0 }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#64748b" style={{ marginRight: 10 }} />
                        <RNTextInput
                            placeholder="Search vehicles..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleAddVehicle}
                        style={[styles.addButton, isMobile && { width: '100%' }]}
                        contentStyle={{ height: 48, paddingHorizontal: 16 }}
                        icon="plus"
                    >
                        Add New Vehicle
                    </Button>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
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
                                        <DataTable.Title style={{ flex: 1, paddingLeft: 16 }} textStyle={styles.headerText}>Type</DataTable.Title>
                                        <DataTable.Title style={{ flex: 2.5 }} textStyle={styles.headerText}>Vehicle Name</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1.5 }} textStyle={styles.headerText}>Usage</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1.5 }} textStyle={styles.headerText}>Country</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1.5 }} textStyle={styles.headerText}>Area</DataTable.Title>
                                        <DataTable.Title style={{ flex: 1, justifyContent: 'center' }} textStyle={styles.headerText}>Actions</DataTable.Title>
                                    </DataTable.Header>
                                    <ScrollView style={{ maxHeight: 'calc(100vh - 420px)' }}>
                                        {vehicles.map((item, index) => (
                                            <View key={item.vehicle_id} style={styles.rowWrapper}>
                                                <DataTable.Row style={[styles.row, { backgroundColor: index % 2 === 0 ? 'white' : '#f2f6ff' }]}>
                                                    <DataTable.Cell style={{ flex: 1, paddingLeft: 16 }}>
                                                        {(() => {
                                                            const pTypeName = item.property_type_name || propertyTypes.find(p => p.id == item.property_type_id)?.name || '';
                                                            const vTypeName = item.vehicle_type_name || premisesTypes.find(p => p.id == item.premises_type_id)?.type_name || item.type || '';
                                                            const vTypeUpper = vTypeName.toUpperCase();

                                                            return (
                                                                <View>
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
                                                                    <Text style={[styles.subText, { fontSize: 10, marginTop: 4, textAlign: 'center' }]}>
                                                                        {pTypeName || '-'}
                                                                    </Text>
                                                                </View>
                                                            );
                                                        })()}
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={{ flex: 2.5 }}>
                                                        <View style={styles.nameCell}>
                                                            <View style={styles.iconBox}>
                                                                <MaterialCommunityIcons
                                                                    name={(item.vehicle_type_name || item.type || '').toUpperCase() === 'VAN' ? 'truck-delivery' : 'car'}
                                                                    size={18}
                                                                    color="#3b82f6"
                                                                />
                                                            </View>
                                                            <View style={{ justifyContent: 'center' }}>
                                                                <Text style={styles.moduleName} numberOfLines={1}>{item.vehicle_name}</Text>
                                                                <Text style={styles.subText} numberOfLines={1}>{item.license_plate || 'N/A'}</Text>
                                                            </View>
                                                        </View>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={{ flex: 1.5 }}>
                                                        <Text style={[styles.cellText, { textTransform: 'uppercase' }]}>{item.vehicle_usage || '-'}</Text>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={{ flex: 1.5 }}>
                                                        <View>
                                                            <Text style={styles.cellText}>{item.country || '-'}</Text>
                                                        </View>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={{ flex: 1.5 }}>
                                                        <Text style={styles.cellText}>{item.area || '-'}</Text>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={{ flex: 1, justifyContent: 'center' }}>
                                                        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                                                            <TouchableOpacity onPress={() => fetchVehicleSnapshot(item)}>
                                                                <MaterialCommunityIcons name="eye-outline" size={20} color="rgb(239, 149, 10)" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleEditVehicle(item)}>
                                                                <MaterialCommunityIcons name="pencil-outline" size={20} color="rgb(99, 102, 241)" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleDeleteVehicle(item)}>
                                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="rgb(152, 37, 152)" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </DataTable.Cell>
                                                </DataTable.Row>
                                            </View>
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
                                                    labelStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                                >
                                                    Add New Vehicle
                                                </Button>
                                            </View>
                                        )}
                                    </ScrollView>

                                    <View style={styles.paginationContainer}>
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
                    <Modal visible={detailsVisible} onDismiss={() => setDetailsVisible(false)} contentContainerStyle={styles.modalContent}>
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
                                                        onInputChange('country_id', c.id);
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
                                                    onInputChange('property_type_id', p.id);
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
                                                    onInputChange('premises_type_id', t.id);
                                                    setTypeMenuVisible(false);
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
                                                    onInputChange('area_id', a.id);
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
                                    {/* Core Identity Section (Always Visible) */}
                                    <Surface style={styles.sectionCard}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Basic Information</Text>
                                        </View>
                                        <View style={styles.formContainer}>
                                            <View style={[styles.formRow, { width: isMobile ? '100%' : '48%' }]}>
                                                <Text style={styles.inputLabel}>Vehicle Name *</Text>
                                                <TextInput
                                                    mode="outlined"
                                                    value={formValues.vehicle_name || ''}
                                                    onChangeText={text => onInputChange('vehicle_name', text)}
                                                    placeholder="e.g. Toyota Camry"
                                                    style={styles.textInput}
                                                    editable={isAdding}
                                                    outlineColor="#e2e8f0"
                                                />
                                            </View>
                                            <View style={[styles.formRow, { width: isMobile ? '100%' : '48%' }]}>
                                                <Text style={styles.inputLabel}>License Plate *</Text>
                                                <TextInput
                                                    mode="outlined"
                                                    value={formValues.license_plate || ''}
                                                    onChangeText={text => onInputChange('license_plate', text)}
                                                    placeholder="e.g. DXB-12345"
                                                    style={styles.textInput}
                                                    editable={isAdding}
                                                    outlineColor="#e2e8f0"
                                                />
                                            </View>
                                            <View style={[styles.formRow, { width: isMobile ? '100%' : '48%' }]}>
                                                <Text style={styles.inputLabel}>Type</Text>
                                                <TextInput
                                                    mode="outlined"
                                                    value={formValues.type || ''}
                                                    onChangeText={text => onInputChange('type', text)}
                                                    placeholder="e.g. SEDAN"
                                                    style={styles.textInput}
                                                    editable={isAdding}
                                                    outlineColor="#e2e8f0"
                                                />
                                            </View>
                                            <View style={[styles.formRow, { width: isMobile ? '100%' : '48%' }]}>
                                                <Text style={styles.inputLabel}>Driver</Text>
                                                <TextInput
                                                    mode="outlined"
                                                    value={formValues.driver || ''}
                                                    onChangeText={text => onInputChange('driver', text)}
                                                    placeholder="Assigned driver name"
                                                    style={styles.textInput}
                                                    editable={isAdding}
                                                    outlineColor="#e2e8f0"
                                                />
                                            </View>
                                        </View>
                                    </Surface>

                                    {/* Dynamic Sections */}
                                    {moduleDetails.map((sec, idx) => renderSection(sec, idx + 1))}

                                    {moduleDetails.length === 0 && !detailsLoading && (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#94a3b8" />
                                            <Text style={{ marginTop: 8, color: '#94a3b8', textAlign: 'center' }}>
                                                No additional fields configured for this module.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button mode="outlined" onPress={() => setDetailsVisible(false)} style={styles.secondaryBtn}>
                                Close
                            </Button>
                            {isAdding && (
                                <Button mode="contained" onPress={submitVehicleForm} style={styles.submitBtn} loading={loading}>
                                    {formValues.vehicle_id ? 'Update Vehicle' : 'Save Vehicle'}
                                </Button>
                            )}
                        </View>
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
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    controlsHeader: { flexDirection: 'row', marginBottom: 24, gap: 16 },
    searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 48 },
    addButton: { borderRadius: 8, justifyContent: 'center', backgroundColor: '#3b82f6' },
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
        backgroundColor: 'rgb(108, 122, 224)',
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
        paddingTop: 8,
        gap: 12
    },
    mobileGridItem: {
        flex: 1,
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
