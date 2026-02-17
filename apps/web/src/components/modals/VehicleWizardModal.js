import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Portal, Button, Menu } from 'react-native-paper';
import api from '../../api/client';

const VehicleWizardModal = ({ visible, onClose, onSave, initialData = null }) => {
    const { width, height } = useWindowDimensions();
    const isMobile = width < 768; // Vertical layout on mobile

    // State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Dropdown Data
    const [countries, setCountries] = useState([]);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [premisesTypes, setPremisesTypes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [regions, setRegions] = useState([]);

    // Dropdown Menus Visibility
    const [menus, setMenus] = useState({
        country: false,
        region: false,
        propertyType: false,
        premisesType: false,
        area: false
    });

    // Form Data - Step 1
    const [classification, setClassification] = useState({
        vehicle_id: null,
        vehicle_name: '',
        license_plate: '',
        type: '',
        driver: '',
        vehicle_usage: '',
        country_id: null,
        property_type_id: null,
        premises_type_id: null,
        area_id: null,
        status: 'Active',
        status: 'Active',
        country_name: '',
        region: '',
        property_type_name: '',
        premises_type_name: '',
        area_name: ''
    });

    // Dynamic Module Data
    const [moduleStructure, setModuleStructure] = useState([]); // Array of sections
    const [dynamicData, setDynamicData] = useState({}); // Key-value pairs for fields

    // Initialization
    useEffect(() => {
        if (visible) {
            setStep(1);
            fetchDropdowns();

            if (initialData && Object.keys(initialData).length > 0) {
                setClassification({
                    country_id: initialData.country_id || null,
                    region: initialData.region || '',
                    property_type_id: initialData.property_type_id || null,
                    premises_type_id: initialData.premises_type_id || null,
                    area_id: initialData.area_id || null,
                    status: initialData.status || 'Active',
                    country_name: countries.find(c => c.id === initialData.country_id)?.country_name || '',
                    property_type_name: propertyTypes.find(p => p.id === initialData.property_type_id)?.name || '',
                    premises_type_name: premisesTypes.find(p => p.id === initialData.premises_type_id)?.type_name || '',
                    area_name: areas.find(a => a.id === initialData.area_id)?.name || ''
                });

                const baseKeys = ['vehicle_id', 'company_id', 'status', 'country_id', 'property_type_id', 'premises_type_id', 'area_id', 'country_name', 'property_type_name', 'premises_type_name', 'area_name', 'created_at', 'updated_at', 'image_path'];
                const dynamic = {};
                Object.keys(initialData).forEach(key => {
                    if (!baseKeys.includes(key)) dynamic[key] = initialData[key];
                });
                // Ensure vehicle_name is also available in dynamic if provided as 'name'
                if (initialData.name && !dynamic.vehicle_name) dynamic.vehicle_name = initialData.name;
                setDynamicData(dynamic);
            } else {
                setClassification({
                    country_id: null,
                    region: '',
                    property_type_id: null,
                    premises_type_id: null,
                    area_id: null,
                    status: 'Active',
                    country_name: '',
                    property_type_name: '',
                    premises_type_name: '',
                    area_name: ''
                });
                setDynamicData({});
            }
            if (visible) {
                fetchModuleConfig();
            }
        }
    }, [visible, initialData, countries.length, propertyTypes.length]);

    useEffect(() => {
        if (visible && (classification.country_id || classification.property_type_id || classification.premises_type_id || classification.area_id)) {
            fetchModuleConfig();
        }
    }, [classification.country_id, classification.property_type_id, classification.premises_type_id, classification.area_id]);

    // Fetch regions when country changes
    useEffect(() => {
        const fetchRegions = async () => {
            setRegions([]);
            // Create a local var for country name to avoid dependency loop issues if using state directly inside async
            const cName = classification.country_name;
            if (!cName) return;

            // Reset region if country changed and existing region is not valid? 
            // For now, if user acts to change country, they should re-select region.
            // But we might be initializing. If prioritizing user experience, only clear if mismatch.
            // Simplified: We just fetch. Logic for clearing is handled if user manually changes country in dropdown.

            let queryCountry = cName;
            if (queryCountry.toLowerCase() === 'uae') queryCountry = 'United Arab Emirates';
            if (queryCountry.toLowerCase() === 'usa') queryCountry = 'United States';
            if (queryCountry.toLowerCase() === 'uk') queryCountry = 'United Kingdom';

            try {
                const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country: queryCountry })
                });
                const data = await res.json();
                if (data.data && data.data.states) {
                    setRegions(data.data.states.map(s => ({
                        name: s.name,
                        state_code: s.state_code
                    })));
                }
            } catch (e) {
                console.error('Fetch regions error', e);
            }
        };

        if (classification.country_name) {
            fetchRegions();
        }
    }, [classification.country_name]);

    const fetchDropdowns = async () => {
        setInitializing(true);
        try {
            const [cRes, propRes, premRes, areaRes] = await Promise.all([
                api.get('countries'),
                api.get('property-types'),
                api.get('premises-types'),
                api.get('areas')
            ]);

            if (cRes.data?.success) setCountries(cRes.data.data);
            if (propRes.data?.success) setPropertyTypes(propRes.data.data);
            if (premRes.data?.success) setPremisesTypes(premRes.data.data);
            if (areaRes.data?.success) setAreas(areaRes.data.data || areaRes.data);

        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        } finally {
            setInitializing(false);
        }
    };

    const fetchSelectedFields = async (moduleId, countryId, propertyTypeId, premisesTypeId, areaId) => {
        try {
            const params = { module_id: moduleId };
            if (countryId) params.country_id = countryId;
            if (propertyTypeId) params.property_type_id = propertyTypeId;
            if (premisesTypeId) params.premises_type_id = premisesTypeId;
            if (areaId) params.area_id = areaId;

            const res = await api.get('company-modules/selected-fields', { params });
            return res.data?.data?.selected_field_ids || [];
        } catch (e) {
            console.error('[fetchSelectedFields] Error:', e);
            return [];
        }
    };

    const fetchModuleConfig = async () => {
        setLoading(true);
        try {
            const modRes = await api.get('module-master');
            const vehicleModule = (modRes.data?.data || []).find(m => (m.module_name || m.name || '').toLowerCase() === 'vehicle');

            if (!vehicleModule) {
                alert('Vehicle module not found');
                return;
            }

            const secRes = await api.get(`module-builder/${vehicleModule.module_id}/sections`);
            let sections = secRes.data?.data || [];

            const sectionsWithFields = await Promise.all(sections.map(async (sec) => {
                const fRes = await api.get(`module-builder/fields`, { params: { section_id: sec.id } });
                let fields = fRes.data?.data || [];
                return { ...sec, fields };
            }));

            const hasConditions = classification.country_id || classification.property_type_id || classification.premises_type_id || classification.area_id;
            let filteredSections = sectionsWithFields;

            if (hasConditions) {
                const selectedFieldIds = await fetchSelectedFields(
                    vehicleModule.module_id,
                    classification.country_id,
                    classification.property_type_id,
                    classification.premises_type_id,
                    classification.area_id
                );

                if (selectedFieldIds && selectedFieldIds.length > 0) {
                    filteredSections = sectionsWithFields.map(sec => ({
                        ...sec,
                        fields: sec.fields.filter(f => selectedFieldIds.includes(f.id))
                    })).filter(s => s.fields.length > 0);
                }
            }

            setModuleStructure(filteredSections);

        } catch (error) {
            console.error('Error fetching module config:', error);
            alert('Failed to load vehicle form configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else onClose();
    };

    const handleSaveForm = () => {
        const finalClassification = { ...classification };
        if (initialData?.vehicle_id) finalClassification.vehicle_id = initialData.vehicle_id;

        // Ensure vehicle_name is not null to satisfy database constraint
        let vehicleName = dynamicData.vehicle_name || classification.vehicle_name || classification.premises_type_name || 'Vehicle';
        finalClassification.vehicle_name = vehicleName;

        const payload = {
            ...finalClassification,
            ...dynamicData
        };
        onSave(payload);
    };

    const totalSteps = 1 + moduleStructure.length;
    const toggleMenu = (key, visible) => setMenus(prev => ({ ...prev, [key]: visible }));

    const getSidebarItems = () => {
        const items = [
            { id: 1, name: 'Sub-module Configuration' }
        ];
        moduleStructure.forEach((sec, idx) => {
            items.push({ id: idx + 2, name: sec.name });
        });
        return items;
    };

    const sidebarItems = getSidebarItems();

    // Render Steps
    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Configure the classification and sub-module settings for this vehicle.</Text>
            </View>

            <View style={styles.row}>
                {/* Country */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Country</Text>
                    <Menu
                        visible={menus.country}
                        onDismiss={() => toggleMenu('country', false)}
                        anchor={
                            <TouchableOpacity style={styles.dropdownInfo} onPress={() => toggleMenu('country', true)}>
                                <Text style={classification.country_id ? styles.inputText : styles.placeholder}>
                                    {classification.country_name || 'Country'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        }
                    >
                        {countries.map(c => (
                            <Menu.Item key={c.id} onPress={() => { toggleMenu('country', false); setClassification(p => ({ ...p, country_id: c.id, country_name: c.country_name || c.name })); }} title={c.country_name || c.name} />
                        ))}
                    </Menu>
                </View>

                {/* Region */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Region</Text>
                    <Menu
                        visible={menus.region}
                        onDismiss={() => toggleMenu('region', false)}
                        anchor={
                            <TouchableOpacity style={styles.dropdownInfo} onPress={() => toggleMenu('region', true)}>
                                <Text style={classification.region ? styles.inputText : styles.placeholder}>
                                    {classification.region || 'Select Region'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        }
                    >
                        {regions.length > 0 ? regions.map((r, i) => (
                            <Menu.Item key={i} onPress={() => { toggleMenu('region', false); setClassification(p => ({ ...p, region: r.name })); }} title={r.name} />
                        )) : (
                            <Menu.Item disabled title="No regions available" />
                        )}
                    </Menu>
                </View>

                {/* Property Type */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Property Type</Text>
                    <Menu
                        visible={menus.propertyType}
                        onDismiss={() => toggleMenu('propertyType', false)}
                        anchor={
                            <TouchableOpacity style={styles.dropdownInfo} onPress={() => toggleMenu('propertyType', true)}>
                                <Text style={classification.property_type_id ? styles.inputText : styles.placeholder}>
                                    {classification.property_type_name || 'Property Type'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        }
                    >
                        {propertyTypes.map(pt => (
                            <Menu.Item key={pt.id} onPress={() => { toggleMenu('propertyType', false); setClassification(p => ({ ...p, property_type_id: pt.id, property_type_name: pt.name })); }} title={pt.name} />
                        ))}
                    </Menu>
                </View>
            </View>

            <View style={styles.row}>
                {/* Premises Type */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Vehicle Type</Text>
                    <Menu
                        visible={menus.premisesType}
                        onDismiss={() => toggleMenu('premisesType', false)}
                        anchor={
                            <TouchableOpacity style={styles.dropdownInfo} onPress={() => toggleMenu('premisesType', true)}>
                                <Text style={classification.premises_type_id ? styles.inputText : styles.placeholder}>
                                    {classification.premises_type_name || 'Vehicle Type'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        }
                    >
                        {premisesTypes.map(t => (
                            <Menu.Item key={t.id} onPress={() => { toggleMenu('premisesType', false); setClassification(p => ({ ...p, premises_type_id: t.id, premises_type_name: t.type_name })); }} title={t.type_name} />
                        ))}
                    </Menu>
                </View>

                {/* Area */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Area</Text>
                    <Menu
                        visible={menus.area}
                        onDismiss={() => toggleMenu('area', false)}
                        anchor={
                            <TouchableOpacity style={styles.dropdownInfo} onPress={() => toggleMenu('area', true)}>
                                <Text style={classification.area_id ? styles.inputText : styles.placeholder}>
                                    {classification.area_name || 'Area'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        }
                    >
                        {areas.map(a => (
                            <Menu.Item key={a.id} onPress={() => { toggleMenu('area', false); setClassification(p => ({ ...p, area_id: a.id, area_name: a.name })); }} title={a.name} />
                        ))}
                    </Menu>
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputContainer, { justifyContent: 'center' }]}>
                    <Text style={styles.label}>Status</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{classification.status}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderDynamicSection = (stepIndex) => {
        const section = moduleStructure[stepIndex - 2]; // step 2 is index 0
        if (!section) return null;

        return (
            <View style={styles.stepContent}>
                <View style={styles.fieldsGrid}>
                    {section.fields.map(field => (
                        <View key={field.id} style={styles.dynamicField}>
                            <Text style={styles.label}>{field.label || field.field_label}{field.is_required ? ' *' : ''}</Text>
                            <TextInput
                                style={styles.input}
                                value={dynamicData[field.field_key] || ''}
                                onChangeText={(text) => setDynamicData(prev => ({ ...prev, [field.field_key]: text }))}
                                placeholder={field.placeholder || ''}
                                keyboardType={field.data_type === 'number' ? 'numeric' : 'default'}
                            />
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.container}>
                <View style={[styles.modalContent, isMobile && { flexDirection: 'column' }]}>

                    {/* Left Sidebar */}
                    <View style={[styles.sidebar, isMobile && { width: '100%', borderRightWidth: 0, borderBottomWidth: 1 }]}>
                        <Text style={styles.sidebarTitle}>{initialData ? 'Edit Vehicle' : 'Add New Vehicle'}</Text>
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 10 }}>
                            {sidebarItems.map((item, index) => {
                                const isActive = step === item.id;
                                const isCompleted = step > item.id;
                                const isFuture = moduleStructure.length === 0 && index > 0; // Gray out future steps if not loaded

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.navItem,
                                            isActive && styles.navItemActive,
                                            isFuture && { opacity: 0.5 }
                                        ]}
                                        onPress={() => {
                                            if (item.id <= 2 || item.id < step || (moduleStructure.length > 0 && item.id <= step + 1)) {
                                                setStep(item.id);
                                            }
                                        }}
                                        disabled={isFuture}
                                    >
                                        <View style={[styles.navIcon, isActive && styles.navIconActive, isCompleted && styles.navIconCompleted]}>
                                            {isCompleted ? (
                                                <MaterialCommunityIcons name="check" size={14} color="white" />
                                            ) : (
                                                <Text style={[styles.navNum, isActive && { color: 'white' }]}>{item.id}</Text>
                                            )}
                                        </View>
                                        <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                            <Text style={{ fontSize: 11, color: '#94a3b8' }}>{Math.round((step / (totalSteps || 1)) * 100)}% Completed</Text>
                            <View style={{ height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                                <View style={{ height: '100%', backgroundColor: '#3b82f6', width: `${(step / (totalSteps || 1)) * 100}%` }} />
                            </View>
                        </View>
                    </View>

                    {/* Right Content */}
                    <View style={styles.mainContent}>
                        <View style={styles.header}>
                            <Text style={styles.stepTitle}>
                                {step === 1 ? 'Sub-module Configuration' : (moduleStructure[step - 2]?.name || 'Details')}
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.body} contentContainerStyle={{ padding: 24 }}>
                            {initializing ? (
                                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                            ) : (
                                <>
                                    {step === 1 && renderStep1()}
                                    {step >= 2 && renderDynamicSection(step)}
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.footer}>
                            <Button mode="outlined" onPress={onClose} textColor="#ef4444" style={{ borderColor: '#fee2e2' }}>Cancel</Button>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <Button mode="outlined" onPress={handleBack} disabled={step === 1}>Back</Button>
                                <Button mode="contained" onPress={step === totalSteps && totalSteps > 1 ? handleSaveForm : handleNext} loading={loading} buttonColor="#3b82f6">
                                    {step === totalSteps && totalSteps > 1 ? 'Save' : 'Next'}
                                </Button>
                            </View>
                        </View>
                    </View>

                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        width: '90%',
        maxWidth: 1000,
        alignSelf: 'center',
        borderRadius: 12,
        maxHeight: '90%',
        flex: 1,
        overflow: 'hidden'
    },
    modalContent: {
        flexDirection: 'row',
        flex: 1,
    },
    // Sidebar Styles
    sidebar: {
        width: 260,
        backgroundColor: '#f8fafc',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column'
    },
    sidebarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 8,
        borderRadius: 8,
        marginBottom: 4
    },
    navItemActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    navIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    navIconActive: {
        backgroundColor: '#3b82f6',
    },
    navIconCompleted: {
        backgroundColor: '#10b981',
    },
    navNum: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b'
    },
    navText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500'
    },
    navTextActive: {
        color: '#1e293b',
        fontWeight: '600'
    },

    // Main Content Styles
    mainContent: {
        flex: 1,
        backgroundColor: 'white',
        flexDirection: 'column'
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b'
    },
    body: {
        flex: 1,
        backgroundColor: 'white'
    },
    stepContent: {
        gap: 24
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap'
    },
    inputContainer: {
        flex: 1,
        minWidth: 200,
        gap: 8
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155'
    },
    dropdownInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 12,
        backgroundColor: 'white'
    },
    inputText: {
        fontSize: 14,
        color: '#1e293b'
    },
    placeholder: {
        fontSize: 14,
        color: '#94a3b8'
    },
    statusBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start'
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3b82f6'
    },
    systemSetText: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
        textAlign: 'center'
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc'
    },
    fieldsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16
    },
    dynamicField: {
        width: '48%',
        marginBottom: 16,
        gap: 8
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#1e293b'
    }
});

export default VehicleWizardModal;
