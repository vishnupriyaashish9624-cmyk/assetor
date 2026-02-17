import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Card, Text, Button, IconButton, ActivityIndicator, Chip, DataTable, Portal, Modal, Surface, TextInput, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/client';
import AppLayout from '../components/AppLayout';
import ModuleFormModal from '../components/modals/ModuleFormModal';
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
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [premises, setPremises] = useState([]);

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
    const [countries, setCountries] = useState([]);

    // Header Dropdown States
    const [countryMenuVisible, setCountryMenuVisible] = useState(false);
    const [regionMenuVisible, setRegionMenuVisible] = useState(false);
    const [formTypeMenuVisible, setFormTypeMenuVisible] = useState(false);
    const [typeMenuVisible, setTypeMenuVisible] = useState(false);
    const [areaMenuVisible, setAreaMenuVisible] = useState(false);
    const [areas, setAreas] = useState([]);
    const [premisesTypes, setPremisesTypes] = useState([]);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [openMenuFieldId, setOpenMenuFieldId] = useState(null);

    // Store unfiltered module structure for dynamic filtering
    const [unfilteredModuleDetails, setUnfilteredModuleDetails] = useState([]);

    // Delete Confirmation Dialog State
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [externalStates, setExternalStates] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (id) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchModules();
        fetchCountries();
        fetchAreas();
        fetchPremisesTypes();
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

    // Auto-filter fields when country/type/area changes in formValues
    useEffect(() => {
        const filterFields = async () => {
            if (unfilteredModuleDetails.length > 0 && modules.length > 0) {
                const premisesModule = modules.find(m => m.module_id == 1 || (m.name || '').toLowerCase() === 'premises');
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

    // Fetch states from external API when country changes
    useEffect(() => {
        const fetchExternalStates = async () => {
            setExternalStates([]); // Clear previous states to avoid stale data

            if (!formValues.country) {
                return;
            }

            // Normalize country name for common abbreviations
            let queryCountry = formValues.country;
            if (queryCountry.toLowerCase() === 'uae') queryCountry = 'United Arab Emirates';
            if (queryCountry.toLowerCase() === 'usa') queryCountry = 'United States';
            if (queryCountry.toLowerCase() === 'uk') queryCountry = 'United Kingdom';

            try {
                // Using fetch for external API
                const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country: queryCountry })
                });
                const data = await res.json();
                if (data.data && data.data.states) {
                    setExternalStates(data.data.states.map(s => ({
                        option_label: s.name,
                        option_value: s.name
                    })));
                } else {
                    setExternalStates([]);
                }
            } catch (e) {
                console.error('External state fetch error:', e);
                setExternalStates([]);
            }
        };

        fetchExternalStates();
    }, [formValues.country]);

    const fetchAreas = async () => {
        try {
            const res = await api.get('areas');
            setAreas(res.data.data || []);
        } catch (e) {
            console.error('Fetch areas error', e);
        }
    };

    const fetchPremises = async () => {
        try {
            setLoading(true);
            const res = await api.get('office/premises', {
                params: {
                    page: page + 1, // API is 1-based, UI is 0-based
                    limit: itemsPerPage,
                    search: search
                }
            });
            setPremises(res.data.data || []);
            if (res.data.pagination) {
                setTotalItems(res.data.pagination.totalItems);
            } else {
                // Fallback if API doesn't return pagination (e.g. backward compat)
                setTotalItems(res.data.data?.length || 0);
            }
        } catch (e) {
            console.error('Fetch premises error', {
                message: e.message,
                status: e.response?.status,
                url: e.config?.url,
                baseURL: e.config?.baseURL,
                fullURL: e.config?.baseURL + e.config?.url
            });
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

    // Replace old fetchPremisesTypes with this more generic one or just update checking standard conventions
    const fetchPremisesTypes = async () => {
        fetchOtherData();
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
            fields: (section.fields || []).filter(field =>
                selectedFieldIds.includes(field.id)
            )
        })).filter(section => section.fields.length > 0); // Remove empty sections
    };

    const handleAddPremises = async () => {
        const premisesModule = modules.find(m => m.module_id == 1);
        if (premisesModule) {
            // Set modal state
            setDetailsVisible(true);
            setIsAdding(true);
            setFormValues({});
            setCurrentStep(0);
            setUnfilteredModuleDetails([]);
            setDetailsLoading(true);

            // For new premises, fetch all fields and store them
            // They will be filtered dynamically as user selects country/type/area
            try {
                const sectionRes = await api.get(`module-builder/${premisesModule.module_id}/sections`);
                const sections = sectionRes.data.data || [];
                const fullStructure = await Promise.all(sections.map(async (sec) => {
                    const fieldsRes = await api.get(`module-builder/fields?section_id=${sec.id}`);
                    const fields = fieldsRes.data.data || [];
                    return { ...sec, fields };
                }));

                // Store unfiltered structure for dynamic filtering
                setUnfilteredModuleDetails(fullStructure);
                setModuleDetails(fullStructure); // Show all fields initially
            } catch (error) {
                console.error('Error fetching module structure:', error);
            } finally {
                setDetailsLoading(false);
            }
        } else {
            setAddModalVisible(true);
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
            const premisesModule = modules.find(m => m.module_id == 1);
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

    const handleEditPremise = async (item) => {
        try {
            setDetailsLoading(true);
            setDetailsVisible(true);
            setIsAdding(true); // Enable editing mode
            setCurrentStep(0);
            setFormValues(item);

            // Fetch full details
            try {
                const fullRes = await api.get(`office/premises/${item.premise_id}`);
                if (fullRes.data.success) {
                    setFormValues(fullRes.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch full premises details", err);
            }

            // Fetch module structure
            const premisesModule = modules.find(m => m.module_id == 1);
            if (premisesModule) {
                const sectionRes = await api.get(`module-builder/${premisesModule.module_id}/sections`);
                const sections = sectionRes.data.data || [];
                let fullStructure = await Promise.all(sections.map(async (sec) => {
                    const fieldsRes = await api.get(`module-builder/fields?section_id=${sec.id}`);
                    const fields = fieldsRes.data.data || [];
                    console.log(`Section "${sec.name}" fields:`, fields);
                    return { ...sec, fields };
                }));

                // Store unfiltered structure for dynamic filtering
                setUnfilteredModuleDetails(fullStructure);

                // Fetch selected fields based on premises conditions
                // Try to resolve property type ID from name if not present
                let propId = item.property_type_id;
                if (!propId && item.premise_type) {
                    const matchedPt = propertyTypes.find(pt => pt.name === item.premise_type);
                    if (matchedPt) propId = matchedPt.id;
                }

                const selectedFieldIds = await fetchSelectedFields(
                    premisesModule.module_id,
                    item.country_id,
                    propId,
                    item.premises_type_id,
                    item.area_id
                );

                console.log('[handleEditPremise] Selected field IDs:', selectedFieldIds);

                // Filter structure to show only selected fields
                const filteredStructure = filterModuleStructure(fullStructure, selectedFieldIds);

                console.log('[handleEditPremise] Filtered structure:', filteredStructure);

                setModuleDetails(filteredStructure);
            }
        } catch (error) {
            console.error('Edit premise error:', error);
        } finally {
            setDetailsLoading(false);
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

    const fetchPremiseSnapshot = async (item) => {
        try {
            setDetailsLoading(true);
            setDetailsVisible(true);
            setIsAdding(false);
            setFormValues(item);

            // FETCH FULL DETAILS (Dynamic fields)
            try {
                const fullRes = await api.get(`office/premises/${item.premise_id}`);
                if (fullRes.data.success) {
                    setFormValues(fullRes.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch full premises details", err);
            }

            // Just use the first module for structure for now (Premises module)
            const premisesModule = modules.find(m => m.module_id == 1);
            if (premisesModule) {
                const sectionRes = await api.get(`module-builder/${premisesModule.module_id}/sections`);
                const sections = sectionRes.data.data || [];
                let fullStructure = await Promise.all(sections.map(async (sec) => {
                    const fieldsRes = await api.get(`module-builder/fields?section_id=${sec.id}`);
                    return { ...sec, fields: fieldsRes.data.data || [] };
                }));
                setModuleDetails(fullStructure);
                setUnfilteredModuleDetails(fullStructure); // Store for dynamic filtering
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

    const submitPremisesForm = async () => {
        try {
            console.log('Submitting Form Values:', formValues);

            // Mapping discrepancy fix between dynamic module keys and static backend expectation
            const mappedValues = { ...formValues };

            // Map common name variations
            if (formValues.premices_name_ && !formValues.premises_name) mappedValues.premises_name = formValues.premices_name_;
            if (formValues.premise_name && !formValues.premises_name) mappedValues.premises_name = formValues.premise_name;
            if (formValues.name && !formValues.premises_name) mappedValues.premises_name = formValues.name;

            // Map building variations
            if (formValues.building && !formValues.building_name) mappedValues.building_name = formValues.building;

            // --- VALIDATION START ---
            // 1. Validate Step 1 (Header) Fields
            if (!mappedValues.country && !mappedValues.country_id) { setAlertConfig({ visible: true, title: 'Missing Field', message: 'Please select a Country', type: 'warning' }); return; }
            if (!formValues.premise_type && !mappedValues.property_type_id) { setAlertConfig({ visible: true, title: 'Missing Field', message: 'Please select a Property Type', type: 'warning' }); return; }
            if (!mappedValues.area && !mappedValues.area_id) { setAlertConfig({ visible: true, title: 'Missing Field', message: 'Please select an Area', type: 'warning' }); return; }

            // 2. Validate Dynamic Fields (Only those currently visible/filtered)
            for (const section of moduleDetails) {
                for (const field of section.fields) {
                    const key = field.field_key;
                    const val = mappedValues[key];
                    const isCheckbox = field.field_type === 'checkbox' || field.field_type === 'switch';

                    // Skip validation for checkboxes (false is valid) and hidden/system fields
                    if (!isCheckbox) {
                        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
                            setAlertConfig({ visible: true, title: 'Missing Field', message: `Please fill in: ${field.label || key}`, type: 'warning' });
                            return; // Stop submission
                        }
                    }
                }
            }
            // --- VALIDATION END ---

            // ENUM fix for premises_use ('OFFICE','WAREHOUSE','STAFF','OTHER')
            const rawUse = (mappedValues.premises_use || '').toUpperCase();
            if (['OFFICE', 'SHOP', 'FACTORY'].includes(rawUse)) mappedValues.premises_use = 'OFFICE';
            else if (['WAREHOUSE'].includes(rawUse)) mappedValues.premises_use = 'WAREHOUSE';
            else if (['FLAT', 'VILLA'].includes(rawUse)) mappedValues.premises_use = 'STAFF';
            else mappedValues.premises_use = 'OTHER';

            // Defaults (Only apply if fields match standard backend schema but were not in dynamic form)
            if (!mappedValues.premises_name && !moduleDetails.some(s => s.fields.some(f => f.field_key === 'premises_name'))) mappedValues.premises_name = 'Unnamed Premises';
            if (!mappedValues.building_name && !moduleDetails.some(s => s.fields.some(f => f.field_key === 'building_name'))) mappedValues.building_name = 'N/A';

            mappedValues.country = mappedValues.country || 'Unknown';
            mappedValues.city = mappedValues.city || 'Unknown';
            mappedValues.full_address = mappedValues.full_address || 'Address not provided';

            // Detail Objects
            const ownedDetails = {
                ...mappedValues,
                buy_date: mappedValues.buy_date || new Date().toISOString().split('T')[0],
                purchase_value: mappedValues.purchase_value || 0
            };

            const rentalDetails = {
                ...mappedValues,
                landlord_name: mappedValues.landlord_name || 'TBD',
                landlord_phone: mappedValues.landlord_phone || '000',
                contract_start: mappedValues.contract_start || new Date().toISOString().split('T')[0],
                contract_end: mappedValues.contract_end || new Date().toISOString().split('T')[0],
                monthly_rent: mappedValues.monthly_rent || 0
            };

            // Determine IDs for Area and Company Module Config
            const areaObj = areas.find(a => a.name === formValues.area);
            if (areaObj) mappedValues.area_id = areaObj.id;

            const countryId = countries.find(c => (c.country_name || c.name) === formValues.country)?.id;
            const typeId = formValues.premise_type === 'OWNED' ? 1 : 2;

            const matchingConfig = modules.find(m =>
                m.module_id == (selectedModule?.module_id || 1) &&
                (m.country_id == countryId || !m.country_id) &&
                (m.premises_type_id == typeId || !m.premises_type_id) &&
                (m.area_id == (areaObj?.id) || !m.area_id)
            );

            if (matchingConfig) {
                mappedValues.company_module_id = matchingConfig.id;
            }

            const payload = {
                ...mappedValues,
                owned: ownedDetails,
                rental: rentalDetails,
                status: 'ACTIVE'
            };

            // Check if we're updating or creating
            const isUpdate = formValues.premise_id;
            let res;

            if (isUpdate) {
                // Update existing premise
                res = await api.put(`office/premises/${formValues.premise_id}`, payload);
            } else {
                // Create new premise
                res = await api.post('office/premises', payload);
            }

            if (res.data.success) {
                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: isUpdate ? 'Premises Updated Successfully!' : 'Premises Saved Successfully!',
                    type: 'success'
                });
                setDetailsVisible(false);
                setAddModalVisible(false);
                fetchPremises(); // Refresh list
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: res.data.message || 'Unknown error',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Save premises error:', error);
            const msg = error.response?.data?.message || 'Failed to save premises.';
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: msg,
                type: 'error'
            });
        }
    };

    const filteredModules = modules.filter(m => {
        if (m.module_id != 1) return false;
        const name = (m.name || '').toLowerCase();
        const searchStr = (search || '').toLowerCase();
        return name.includes(searchStr);
    });

    const renderSection = (sec, index) => {
        // Find matching company module config to filter fields
        const matchingConfig = modules.find(m =>
            m.module_id == (selectedModule?.module_id || 1) &&
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
                                                        // Override options for 'state' field if we have external states
                                                        let options = field.options && field.options.length > 0 ? field.options : [];
                                                        if ((field.field_key === 'state' || field.label === 'State') && externalStates.length > 0) {
                                                            options = externalStates;
                                                        }

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
                                    const config = parseFileConfig(field.placeholder);

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

                                            {/* Render Conditional Date Fields */}
                                            {(() => {
                                                const renderDateInput = (label, key, placeholder) => (
                                                    <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>{label}</Text>
                                                        <View style={{ height: 40, width: '100%', position: 'relative' }}>
                                                            <TextInput
                                                                mode="outlined"
                                                                placeholder={placeholder}
                                                                value={formValues[key] || ''}
                                                                onChangeText={(text) => onInputChange(key, text)}
                                                                style={[styles.textInput, { height: 40, fontSize: 13, backgroundColor: 'white' }]}
                                                                outlineColor="#e2e8f0"
                                                                activeOutlineColor="#3b82f6"
                                                                theme={{ roundness: 8 }}
                                                                right={<TextInput.Icon icon="calendar" size={16} color="#94a3b8" />}
                                                            />
                                                            {Platform.OS === 'web' && React.createElement('input', {
                                                                type: 'date',
                                                                value: formValues[key] || '',
                                                                onChange: (e) => onInputChange(key, e.target.value),
                                                                onClick: (e) => {
                                                                    try {
                                                                        if (e.target.showPicker) e.target.showPicker();
                                                                    } catch (err) {
                                                                        console.log('Date picker error:', err);
                                                                    }
                                                                },
                                                                style: {
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    opacity: 0,
                                                                    zIndex: 10,
                                                                    cursor: 'pointer'
                                                                }
                                                            })}
                                                        </View>
                                                    </View>
                                                );

                                                if (config.expiry || config.startDate || config.endDate || config.policyNo || config.issueDate || config.reminder || config.coverageType) {
                                                    return (
                                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                                            {config.policyNo && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>PROPERTY INSURANCE POLICY NO.</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="Enter Policy No."
                                                                        value={formValues[`${field.field_key}_policy_no`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${field.field_key}_policy_no`, text)}
                                                                        style={[styles.textInput, { height: 40, fontSize: 13 }]}
                                                                        outlineColor="#e2e8f0"
                                                                        activeOutlineColor="#3b82f6"
                                                                        theme={{ roundness: 8 }}
                                                                    />
                                                                </View>
                                                            )}
                                                            {config.issueDate && renderDateInput("ISSUE DATE", `${field.field_key}_issue_date`, "YYYY-MM-DD")}
                                                            {config.startDate && renderDateInput("START DATE", `${field.field_key}_start_date`, "YYYY-MM-DD")}
                                                            {config.endDate && renderDateInput("END DATE", `${field.field_key}_end_date`, "YYYY-MM-DD")}
                                                            {config.expiry && renderDateInput("EXPIRY DATE", `${field.field_key}_expiry`, "YYYY-MM-DD")}
                                                            {config.coverageType && (
                                                                <View style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : '45%' }}>
                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>COVERAGE TYPE</Text>
                                                                    <TextInput
                                                                        mode="outlined"
                                                                        placeholder="Enter Coverage Type"
                                                                        value={formValues[`${field.field_key}_coverage_type`] || ''}
                                                                        onChangeText={(text) => onInputChange(`${field.field_key}_coverage_type`, text)}
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
                                                                                selected={formValues[`${field.field_key}_reminder`] === String(days)}
                                                                                onPress={() => onInputChange(`${field.field_key}_reminder`, String(days))}
                                                                                showSelectedOverlay
                                                                                style={{ backgroundColor: formValues[`${field.field_key}_reminder`] === String(days) ? '#e0f2fe' : '#f1f5f9' }}
                                                                                textStyle={{ color: formValues[`${field.field_key}_reminder`] === String(days) ? '#0284c7' : '#64748b' }}
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

    return (
        <AppLayout navigation={navigation} title="Premises Display">
            <View style={styles.container}>
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.title}>Premises Display</Text>
                        <Text style={styles.subtitle}>View module configurations and definitions</Text>
                    </View>
                </View>

                <View style={[styles.controlsHeader, isMobile && { flexDirection: 'column', gap: 12 }]}>
                    <View style={[styles.searchWrapper, isMobile && { width: '100%', minHeight: 48, flexGrow: 0, flexShrink: 0 }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#64748b" style={{ marginRight: 10 }} />
                        <RNTextInput
                            placeholder="Search premises or locations..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleAddPremises}
                        style={[styles.addButton, isMobile && { width: '100%' }]}
                        contentStyle={{ height: 48, paddingHorizontal: 16 }}
                        icon="plus"
                    >
                        Add New Premises
                    </Button>
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
                                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>USAGE</Text>
                                                <Text style={{ color: '#334155', fontWeight: '600', fontSize: 13 }}>{item.premises_use || '-'}</Text>
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>COUNTRY</Text>
                                                <Text style={{ color: '#334155', fontWeight: '600', fontSize: 13 }}>{item.country || 'Unknown'}</Text>
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
                                <DataTable.Title style={{ maxWidth: 50 }}></DataTable.Title>
                                <DataTable.Title style={{ flex: 1.2, justifyContent: 'flex-start', backgroundColor: '#6c7ae0', paddingLeft: 0 }} textStyle={styles.headerText}>Type</DataTable.Title>
                                <DataTable.Title style={{ flex: 3, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>Premises Name</DataTable.Title>
                                <DataTable.Title style={{ flex: 1.5, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>Usage</DataTable.Title>
                                <DataTable.Title style={{ flex: 2, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>Country</DataTable.Title>
                                <DataTable.Title style={{ flex: 1.5, justifyContent: 'flex-start', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>Area</DataTable.Title>
                                <DataTable.Title style={{ flex: 1, justifyContent: 'center', backgroundColor: '#6c7ae0' }} textStyle={styles.headerText}>Actions</DataTable.Title>
                            </DataTable.Header>
                            <ScrollView style={{ maxHeight: 'calc(100vh - 420px)' }}>
                                {premises.map((item, index) => (
                                    <View key={item.premise_id} style={styles.rowWrapper}>
                                        <DataTable.Row style={[styles.row, { backgroundColor: index % 2 === 0 ? 'white' : '#f2f6ff' }]}>
                                            <DataTable.Cell style={{ flex: 1.2, paddingLeft: 16 }}>
                                                <View
                                                    style={[
                                                        styles.typeChip,
                                                        { backgroundColor: item.premise_type === 'OWNED' ? 'rgb(99, 102, 241)' : 'rgb(239, 149, 10)' }
                                                    ]}
                                                >
                                                    <Text style={[styles.typeChipText, { color: '#ffffff' }]}>
                                                        {item.premise_type}
                                                    </Text>
                                                </View>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 3 }}>
                                                <View style={styles.nameCell}>
                                                    <View style={styles.iconBox}>
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
                                                    <View style={{ justifyContent: 'center' }}>
                                                        <Text style={styles.moduleName} numberOfLines={1}>{item.premises_name}</Text>
                                                        <Text style={styles.subText} numberOfLines={1}>{item.building_name || 'N/A'}</Text>
                                                    </View>
                                                </View>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1.5 }}>
                                                <Text style={styles.cellText}>{item.premises_use || 'OTHER'}</Text>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 2 }}>
                                                <View>
                                                    <Text style={styles.cellText} numberOfLines={1}>{item.country || '-'}</Text>
                                                    <Text style={styles.subText} numberOfLines={1}>{item.city}</Text>
                                                </View>
                                            </DataTable.Cell>
                                            <DataTable.Cell style={{ flex: 1.5 }}>
                                                <Text style={styles.cellText} numberOfLines={1}>{item.area || '-'}</Text>
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
                    <ModuleFormModal
                        visible={addModalVisible}
                        onClose={() => setAddModalVisible(false)}
                        onSave={handleSaveModule}
                    />
                    <Modal visible={detailsVisible} onDismiss={() => setDetailsVisible(false)} contentContainerStyle={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{selectedModule?.name}</Text>
                                <Text style={styles.modalSub}>
                                    {isAdding
                                        ? (currentStep === 0
                                            ? `Step 1: General Information`
                                            : `Step ${currentStep + 1}: ${moduleDetails[currentStep - 1]?.name || 'Next Section'}`)
                                        : 'Configuration Snapshot'}
                                </Text>
                            </View>
                            <IconButton icon="close" onPress={() => setDetailsVisible(false)} />
                        </View>

                        {isAdding && moduleDetails.length > 0 && (
                            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 }}>
                                {/* Step 0 Indicator */}
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                        width: 24, height: 24, borderRadius: 12,
                                        backgroundColor: currentStep >= 0 ? '#3b82f6' : '#e2e8f0',
                                        justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>1</Text>
                                    </View>
                                    <View style={{ height: 2, flex: 1, backgroundColor: currentStep > 0 ? '#3b82f6' : '#e2e8f0', marginHorizontal: 4 }} />
                                </View>
                                {moduleDetails.map((sec, idx) => (
                                    <View key={sec.id} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{
                                            width: 24, height: 24, borderRadius: 12,
                                            backgroundColor: (idx + 1) <= currentStep ? '#3b82f6' : '#e2e8f0',
                                            justifyContent: 'center', alignItems: 'center'
                                        }}>
                                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{idx + 2}</Text>
                                        </View>
                                        <View style={{ height: 2, flex: 1, backgroundColor: (idx + 1) < currentStep ? '#3b82f6' : '#e2e8f0', marginHorizontal: 4 }} />
                                    </View>
                                ))}
                            </View>
                        )}

                        {detailsLoading ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#3b82f6" />
                                <Text style={{ marginTop: 16, color: '#64748b' }}>Loading structure...</Text>
                            </View>
                        ) : (
                            <>
                                {isAdding && currentStep === 0 && (
                                    <View style={styles.fixedHeader}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>1. General Information</Text>
                                        </View>
                                        <View style={styles.headerFormContent}>
                                            <View style={styles.headerField}>
                                                <Text style={styles.inputLabel}>Country</Text>
                                                <Menu
                                                    visible={countryMenuVisible}
                                                    onDismiss={() => setCountryMenuVisible(false)}
                                                    anchorPosition="bottom"
                                                    statusBarHeight={44}
                                                    anchor={
                                                        <TouchableOpacity onPress={() => isAdding && setCountryMenuVisible(true)}>
                                                            <TextInput
                                                                mode="outlined"
                                                                placeholder="Country"
                                                                value={formValues.country || ''}
                                                                editable={false}
                                                                style={styles.textInput}
                                                                pointerEvents="none"
                                                                outlineColor="#e2e8f0"
                                                                activeOutlineColor="#3b82f6"
                                                                theme={{ roundness: 8 }}
                                                                right={<TextInput.Icon icon="chevron-down" onPress={() => isAdding && setCountryMenuVisible(true)} />}
                                                            />
                                                        </TouchableOpacity>
                                                    }
                                                    contentStyle={styles.menuContent}
                                                >
                                                    <ScrollView style={{ maxHeight: 250, width: 180 }}>
                                                        {countries.map((c, i) => {
                                                            const name = c.name || c.country_name;
                                                            return (
                                                                <Menu.Item
                                                                    key={i}
                                                                    onPress={() => {
                                                                        onInputChange('country', c.country_name || c.name);
                                                                        onInputChange('country_id', c.id);
                                                                        setCountryMenuVisible(false);
                                                                    }}
                                                                    title={name}
                                                                    titleStyle={styles.menuItemLabel}
                                                                />
                                                            );
                                                        })}
                                                    </ScrollView>
                                                </Menu>
                                            </View>

                                            <View style={styles.headerField}>
                                                <Text style={styles.inputLabel}>Region</Text>
                                                <Menu
                                                    visible={regionMenuVisible}
                                                    onDismiss={() => setRegionMenuVisible(false)}
                                                    anchorPosition="bottom"
                                                    statusBarHeight={44}
                                                    anchor={
                                                        <TouchableOpacity onPress={() => isAdding && setRegionMenuVisible(true)}>
                                                            <TextInput
                                                                mode="outlined"
                                                                placeholder="Region"
                                                                value={formValues.region || ''}
                                                                editable={false}
                                                                style={styles.textInput}
                                                                pointerEvents="none"
                                                                outlineColor="#e2e8f0"
                                                                activeOutlineColor="#3b82f6"
                                                                theme={{ roundness: 8 }}
                                                                right={<TextInput.Icon icon="chevron-down" onPress={() => isAdding && setRegionMenuVisible(true)} />}
                                                            />
                                                        </TouchableOpacity>
                                                    }
                                                    contentStyle={styles.menuContent}
                                                >
                                                    <ScrollView style={{ maxHeight: 250, width: 180 }}>
                                                        {externalStates.length > 0 ? (
                                                            externalStates.map((s, i) => (
                                                                <Menu.Item
                                                                    key={i}
                                                                    onPress={() => {
                                                                        onInputChange('region', s.option_label);
                                                                        setRegionMenuVisible(false);
                                                                    }}
                                                                    title={s.option_label}
                                                                    titleStyle={styles.menuItemLabel}
                                                                />
                                                            ))
                                                        ) : (
                                                            <Menu.Item title="No regions available" disabled />
                                                        )}
                                                    </ScrollView>
                                                </Menu>
                                            </View>

                                            <View style={styles.headerField}>
                                                <Text style={styles.inputLabel}>Property Type</Text>
                                                <Menu
                                                    visible={formTypeMenuVisible}
                                                    onDismiss={() => setFormTypeMenuVisible(false)}
                                                    anchorPosition="bottom"
                                                    statusBarHeight={44}
                                                    anchor={
                                                        <TouchableOpacity onPress={() => isAdding && setFormTypeMenuVisible(true)}>
                                                            <TextInput
                                                                mode="outlined"
                                                                placeholder="Property Type"
                                                                value={formValues.premise_type || ''}
                                                                editable={false}
                                                                style={styles.textInput}
                                                                pointerEvents="none"
                                                                outlineColor="#e2e8f0"
                                                                activeOutlineColor="#3b82f6"
                                                                theme={{ roundness: 8 }}
                                                                right={<TextInput.Icon icon="chevron-down" onPress={() => isAdding && setFormTypeMenuVisible(true)} />}
                                                            />
                                                        </TouchableOpacity>
                                                    }
                                                    contentStyle={styles.menuContent}
                                                >
                                                    {propertyTypes.length > 0 ? (
                                                        propertyTypes.map((pt) => (
                                                            <Menu.Item
                                                                key={pt.id || pt.name}
                                                                onPress={() => {
                                                                    onInputChange('premise_type', pt.name);
                                                                    onInputChange('property_type_id', pt.id);
                                                                    setFormTypeMenuVisible(false);
                                                                }}
                                                                title={pt.name}
                                                                titleStyle={styles.menuItemLabel}
                                                                style={{ width: 180 }}
                                                            />
                                                        ))
                                                    ) : (
                                                        ['OWNED', 'RENTAL'].map((t) => (
                                                            <Menu.Item
                                                                key={t}
                                                                onPress={() => {
                                                                    onInputChange('premise_type', t);
                                                                    setFormTypeMenuVisible(false);
                                                                }}
                                                                title={t === 'OWNED' ? 'Owned' : 'Rental'}
                                                                titleStyle={styles.menuItemLabel}
                                                                style={{ width: 180 }}
                                                            />
                                                        ))
                                                    )}
                                                </Menu>
                                            </View>

                                            <View style={styles.headerField}>
                                                <Text style={styles.inputLabel}>Premises Type</Text>
                                                <Menu
                                                    visible={typeMenuVisible}
                                                    onDismiss={() => setTypeMenuVisible(false)}
                                                    anchorPosition="bottom"
                                                    statusBarHeight={44}
                                                    anchor={
                                                        <TouchableOpacity onPress={() => isAdding && setTypeMenuVisible(true)}>
                                                            <TextInput
                                                                mode="outlined"
                                                                placeholder="Type"
                                                                value={formValues.premises_use || ''}
                                                                editable={false}
                                                                style={styles.textInput}
                                                                pointerEvents="none"
                                                                outlineColor="#e2e8f0"
                                                                activeOutlineColor="#3b82f6"
                                                                theme={{ roundness: 8 }}
                                                                right={<TextInput.Icon icon="chevron-down" onPress={() => isAdding && setTypeMenuVisible(true)} />}
                                                            />
                                                        </TouchableOpacity>
                                                    }
                                                    contentStyle={styles.menuContent}
                                                >
                                                    {premisesTypes.map((pt) => (
                                                        <Menu.Item
                                                            key={pt.id}
                                                            onPress={() => {
                                                                onInputChange('premises_use', pt.type_name);
                                                                onInputChange('premises_type_id', pt.id);
                                                                setTypeMenuVisible(false);
                                                            }}
                                                            title={pt.type_name}
                                                            titleStyle={styles.menuItemLabel}
                                                            style={{ width: 180 }}
                                                        />
                                                    ))}
                                                </Menu>
                                            </View>

                                            <View style={styles.headerField}>
                                                <Text style={styles.inputLabel}>Area</Text>
                                                <Menu
                                                    visible={areaMenuVisible}
                                                    onDismiss={() => setAreaMenuVisible(false)}
                                                    anchorPosition="bottom"
                                                    statusBarHeight={44}
                                                    anchor={
                                                        <TouchableOpacity onPress={() => isAdding && setAreaMenuVisible(true)}>
                                                            <TextInput
                                                                mode="outlined"
                                                                placeholder="Area"
                                                                value={formValues.area || ''}
                                                                editable={false}
                                                                style={styles.textInput}
                                                                pointerEvents="none"
                                                                outlineColor="#e2e8f0"
                                                                activeOutlineColor="#3b82f6"
                                                                theme={{ roundness: 8 }}
                                                                right={<TextInput.Icon icon="chevron-down" onPress={() => isAdding && setAreaMenuVisible(true)} />}
                                                            />
                                                        </TouchableOpacity>
                                                    }
                                                    contentStyle={styles.menuContent}
                                                >
                                                    <ScrollView style={{ maxHeight: 250, width: 180 }}>
                                                        {areas.map((a, i) => (
                                                            <Menu.Item
                                                                key={i}
                                                                onPress={() => {
                                                                    onInputChange('area', a.name);
                                                                    onInputChange('area_id', a.id);
                                                                    setAreaMenuVisible(false);
                                                                }}
                                                                title={a.name}
                                                                titleStyle={styles.menuItemLabel}
                                                            />
                                                        ))}
                                                    </ScrollView>
                                                </Menu>
                                            </View>

                                            <View style={[styles.headerField, { maxWidth: 100 }]}>
                                                <Text style={styles.inputLabel}>Status</Text>
                                                <View style={{ height: 44, justifyContent: 'center' }}>
                                                    <Chip
                                                        style={{ height: 32, backgroundColor: '#eff6ff', borderRadius: 8, borderWidth: 1, borderColor: '#dbeafe' }}
                                                        textStyle={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700' }}
                                                    >
                                                        Active
                                                    </Chip>
                                                </View>
                                                <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>System Set</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <ScrollView style={{ padding: 10 }}>
                                    {moduleDetails.length === 0 ? (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <Text>No sections defined.</Text>
                                        </View>
                                    ) : (
                                        isAdding ?
                                            (currentStep > 0 ? renderSection(moduleDetails[currentStep - 1], currentStep) : null)
                                            : moduleDetails.map((sec, i) => renderSection(sec, i))
                                    )}
                                </ScrollView>

                                {isAdding && (
                                    <View style={styles.modalFooter}>
                                        <View>
                                            <Button
                                                mode="outlined"
                                                onPress={() => setDetailsVisible(false)}
                                                style={styles.dangerBtn}
                                                textColor="#ef4444"
                                                icon="close"
                                            >
                                                Cancel
                                            </Button>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <Button
                                                mode="outlined"
                                                onPress={handlePrevStep}
                                                disabled={currentStep === 0}
                                                style={[styles.secondaryBtn, currentStep === 0 && { opacity: 0.5 }]}
                                                textColor="#64748b"
                                                icon="arrow-left"
                                            >
                                                Back
                                            </Button>
                                            {currentStep < moduleDetails.length ? (
                                                <Button
                                                    mode="contained"
                                                    onPress={() => {
                                                        // Validate Step 0
                                                        if (currentStep === 0) {
                                                            if (!formValues.country || !formValues.premise_type || !formValues.premises_use || !formValues.area || (externalStates.length > 0 && !formValues.region)) {
                                                                alert('Please select all General Information fields before proceeding.');
                                                                return;
                                                            }
                                                        }
                                                        handleNextStep();
                                                    }}
                                                    style={styles.submitBtn}
                                                    icon="arrow-right"
                                                    contentStyle={{ flexDirection: 'row-reverse' }}
                                                >
                                                    Next
                                                </Button>
                                            ) : (
                                                <Button
                                                    mode="contained"
                                                    onPress={submitPremisesForm}
                                                    style={styles.submitBtn}
                                                    icon="check"
                                                >
                                                    {formValues.premise_id ? 'Update Premises' : 'Save Premises'}
                                                </Button>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </Modal>

                    <ConfirmDialog
                        visible={deleteDialogVisible}
                        onDismiss={() => setDeleteDialogVisible(false)}
                        onConfirm={confirmDeletePremise}
                        title="Delete Premises?"
                        message={`Are you sure you want to delete "${itemToDelete?.premises_name}"? This action cannot be undone and may affect the layout of your modules.`}
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
