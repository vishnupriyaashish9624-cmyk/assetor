import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton, Switch, Menu, Searchbar, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';
import FieldBuilderPanel from './FieldBuilderPanel';

const ModuleFormModal = ({ visible, onClose, onSave, module = null, viewOnly = false, initialSection = null }) => {
    const [selectedMaster, setSelectedMaster] = useState(null); // { module_id, module_name }
    const [status, setStatus] = useState('ACTIVE');
    const [loading, setLoading] = useState(false);
    const [catalog, setCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);



    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [countryMenu, setCountryMenu] = useState(false);

    const [premisesTypes, setPremisesTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [typeMenu, setTypeMenu] = useState(false);

    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [areaMenu, setAreaMenu] = useState(false);

    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [regionMenu, setRegionMenu] = useState(false);

    const [vehicleUsages, setVehicleUsages] = useState([]);

    const [selectedPropertyType, setSelectedPropertyType] = useState(null);
    const [ownershipMenu, setOwnershipMenu] = useState(false);
    const [propertyTypes, setPropertyTypes] = useState([]); // Added state

    const [searchQuery, setSearchQuery] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchCatalog();
            // Fetch dropdown data
            const fetchDropdowns = async () => {
                try {
                    const [cRes, ptRes, aRes, propRes, vuRes] = await Promise.all([
                        api.get('countries'),
                        api.get('premises-types'),
                        api.get('areas'),
                        api.get('property-types'),
                        api.get('vehicle-usage')
                    ]);
                    if (cRes.data?.success) setCountries(cRes.data.data);
                    if (ptRes.data?.success) setPremisesTypes(ptRes.data.data);
                    if (aRes.data?.success || Array.isArray(aRes.data)) setAreas(aRes.data.data || aRes.data);
                    if (propRes.data?.success) setPropertyTypes(propRes.data.data);
                    if (vuRes.data?.success) setVehicleUsages(vuRes.data.data);
                } catch (e) {
                    console.error('Error fetching dropdowns:', e);
                }
            };
            fetchDropdowns();

            if (module) {
                // Editing existing company-module mapping
                setSelectedMaster({
                    module_id: module.module_id,
                    module_name: module.name,
                    id: module.id // Current instance ID
                });
                setStatus(module.status);
                // Match from existing catalog/dropdowns if possible, or create placeholder objects
                if (module.country_id !== undefined) {
                    setSelectedCountry(module.country_id === null ? { name: 'All', id: null, isAll: true } : { id: module.country_id, name: module.country });
                }
                if (module.property_type_id !== undefined) {
                    setSelectedPropertyType(module.property_type_id === null ? { name: 'All', id: null, isAll: true } : { id: module.property_type_id, name: module.property_type });
                }
                if (module.premises_type_id !== undefined) {
                    setSelectedType(module.premises_type_id === null ? { type_name: 'All', id: null, isAll: true } : { id: module.premises_type_id, type_name: module.premises_type });
                }
                if (module.area_id !== undefined) {
                    setSelectedArea(module.area_id === null ? { name: 'All', id: null, isAll: true } : { id: module.area_id, name: module.section_area });
                }
                if (module.vehicle_usage_id !== undefined && module.vehicle_usage_id !== null) {
                    const usage = vehicleUsages.find(u => u.id === module.vehicle_usage_id);
                    setSelectedType(usage ? { id: usage.id, type_name: usage.name } : { id: module.vehicle_usage_id, type_name: module.vehicle_usage });
                }
                if (module.region !== undefined) {
                    setSelectedRegion(module.region === null ? { name: 'All', id: null, isAll: true } : { name: module.region });
                }
            } else {
                // New module registration
                setSelectedMaster(null);
                setStatus('ACTIVE');
                setSelectedCountry(null);
                setSelectedType(null);
                setSelectedArea(null);
                setSelectedRegion(null);
                setSelectedPropertyType(null);
                setSearchQuery('');
            }
        }
    }, [module, visible]);

    const fetchCatalog = async () => {
        try {
            setCatalogLoading(true);
            const res = await api.get('module-master');
            console.log('[ModuleFormModal] Catalog Response:', res.status, res.data);
            if (res.data && res.data.success) {
                setCatalog(res.data.data || []);
            }
        } catch (err) {
            console.error('[FetchCatalog] Error:', err);
        } finally {
            setCatalogLoading(false);
        }
    };

    // Fetch regions when country changes
    useEffect(() => {
        const fetchRegions = async () => {
            setRegions([]);
            // Don't reset selectedRegion if we are in edit mode or have a country selected
            if (!module && !selectedCountry) {
                setSelectedRegion(null);
            }

            if (!selectedCountry) return;

            try {
                // Fetch regions from our own database table
                const res = await api.get(`countries/regions?country_id=${selectedCountry.id}`);
                if (res.data?.success) {
                    setRegions(res.data.data);
                }
            } catch (e) {
                console.error('Fetch regions error:', e);
            }
        };

        fetchRegions();
    }, [selectedCountry?.id, selectedCountry?.country_name]); // Depend on ID to avoid loop if object ref changes







    const filteredCatalog = catalog.filter(item => {
        const name = (item.module_name || item.name || '').toLowerCase();
        const search = (searchQuery || '').toLowerCase();
        return name.includes(search);
    });





    const handleSave = async () => {
        if (!selectedMaster) {
            Alert.alert('Error', 'Please select a module from the catalog');
            return;
        }
        setLoading(true);
        try {
            const result = await onSave({
                module_id: selectedMaster.module_id,
                selected_name: selectedMaster.module_name,
                is_active: status === 'ACTIVE',
                country_id: selectedCountry?.id || null,
                property_type_id: currentModuleName?.toLowerCase().includes('vehicle') ? null : (selectedPropertyType?.id || null),
                premises_type_id: currentModuleName?.toLowerCase().includes('vehicle') ? null : (selectedType?.id || null),
                vehicle_usage_id: currentModuleName?.toLowerCase().includes('vehicle') ? (selectedType?.id || null) : null,
                area_id: currentModuleName?.toLowerCase().includes('vehicle') ? null : (selectedArea?.id || null),
                region: selectedRegion?.name || null,
                status_id: status === 'ACTIVE' ? 1 : 2
            });
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    // Determine the Master ID to show fields for
    const currentMasterId = module?.module_id || selectedMaster?.module_id;
    const currentModuleName = module?.name || selectedMaster?.module_name;

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onClose}
                contentContainerStyle={styles.container}
            >
                <View style={[styles.header, { alignItems: 'flex-start' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>
                            {viewOnly ? 'Module Details' : (module ? 'Edit Module Mapping' : 'Add Module')}
                        </Text>
                        <Text style={styles.subtitle}>
                            {viewOnly ? 'Detailed configuration of this module' : 'Select a module and configure its fields'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <IconButton icon="close" size={26} onPress={onClose} iconColor="#64748b" style={{ margin: 0 }} />
                    </View>
                </View>

                {/* Main Body */}
                <View style={styles.body}>
                    {!viewOnly && (
                        <View style={[styles.topRow, { gap: 12 }]}>
                            {/* Module Selection */}
                            <View style={{ flex: 1.4, minWidth: 140 }}>
                                <Text style={styles.label}>Module Name</Text>
                                <Menu
                                    visible={menuVisible}
                                    onDismiss={() => setMenuVisible(false)}
                                    anchor={
                                        <TouchableOpacity onPress={() => !viewOnly && setMenuVisible(true)}>
                                            <TextInput
                                                mode="outlined"
                                                value={selectedMaster ? selectedMaster.module_name : ''}
                                                placeholder="Select..."
                                                editable={false}
                                                style={{ backgroundColor: 'white', borderRadius: 12 }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#673ab7"
                                                outlineStyle={{ borderRadius: 12 }}
                                                right={<TextInput.Icon icon="chevron-down" iconColor="#64748b" onPress={() => !viewOnly && setMenuVisible(true)} />}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    <Searchbar
                                        placeholder="Search..."
                                        onChangeText={setSearchQuery}
                                        value={searchQuery}
                                        style={styles.searchBar}
                                        inputStyle={{ fontSize: 13 }}
                                    />
                                    <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={true}>
                                        {filteredCatalog.length === 0 ? (
                                            <Text style={styles.emptyText}>No modules</Text>
                                        ) : (
                                            filteredCatalog.map((item) => (
                                                <Menu.Item
                                                    key={item.module_id}
                                                    onPress={() => {
                                                        setSelectedMaster(item);
                                                        // Reset fields when module changes
                                                        setSelectedCountry(null);
                                                        setSelectedRegion(null);
                                                        setSelectedPropertyType(null);
                                                        setSelectedType(null);
                                                        setSelectedArea(null);
                                                        setMenuVisible(false);
                                                        setSnackbarVisible(true);
                                                    }}
                                                    title={item.module_name}
                                                />
                                            ))
                                        )}
                                    </ScrollView>
                                </Menu>
                            </View>

                            {/* Country Selection */}
                            <View style={{ flex: 1.1, minWidth: 100 }}>
                                <Text style={styles.label}>Country</Text>
                                <Menu
                                    visible={countryMenu}
                                    onDismiss={() => setCountryMenu(false)}
                                    anchor={
                                        <TouchableOpacity onPress={() => !viewOnly && setCountryMenu(true)}>
                                            <TextInput
                                                mode="outlined"
                                                value={selectedCountry ? (selectedCountry.isAll ? 'All' : (selectedCountry.country_name || selectedCountry.name)) : ''}
                                                placeholder="Select Country"
                                                editable={false}
                                                style={{ backgroundColor: 'white', borderRadius: 12 }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#673ab7"
                                                outlineStyle={{ borderRadius: 12 }}
                                                right={
                                                    <TextInput.Icon
                                                        icon="chevron-down"
                                                        iconColor="#64748b"
                                                        onPress={() => !viewOnly && setCountryMenu(true)}
                                                    />
                                                }
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    <ScrollView style={{ maxHeight: 250 }}>
                                        <Menu.Item
                                            onPress={() => {
                                                setSelectedCountry({ name: 'All', id: null, isAll: true });
                                                setCountryMenu(false);
                                            }}
                                            title="All"
                                        />
                                        {countries
                                            .filter(c => (c.country_name || c.name || '').toLowerCase() !== 'all')
                                            .map((c, i) => (
                                                <Menu.Item
                                                    key={i}
                                                    onPress={() => {
                                                        setSelectedCountry(c);
                                                        setCountryMenu(false);
                                                    }}
                                                    title={c.country_name || c.name}
                                                />
                                            ))}
                                    </ScrollView>
                                </Menu>
                            </View>

                            {/* Region Selection */}
                            <View style={{ flex: 1.1, minWidth: 100 }}>
                                <Text style={styles.label}>Region</Text>
                                <Menu
                                    visible={regionMenu}
                                    onDismiss={() => setRegionMenu(false)}
                                    anchor={
                                        <TouchableOpacity onPress={() => !viewOnly && setRegionMenu(true)}>
                                            <TextInput
                                                mode="outlined"
                                                value={selectedRegion ? (selectedRegion.isAll ? 'All' : selectedRegion.name) : ''}
                                                placeholder="Select Region"
                                                editable={false}
                                                style={{ backgroundColor: 'white', borderRadius: 12 }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#673ab7"
                                                outlineStyle={{ borderRadius: 12 }}
                                                right={<TextInput.Icon icon="chevron-down" iconColor="#64748b" onPress={() => !viewOnly && setRegionMenu(true)} />}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    <ScrollView style={{ maxHeight: 250 }}>
                                        {selectedCountry?.isAll && (
                                            <Menu.Item
                                                onPress={() => {
                                                    setSelectedRegion({ name: 'All', id: null, isAll: true });
                                                    setRegionMenu(false);
                                                }}
                                                title="All"
                                            />
                                        )}
                                        {regions.length > 0 ? (
                                            regions
                                                .map((r, i) => (
                                                    <Menu.Item
                                                        key={i}
                                                        onPress={() => {
                                                            setSelectedRegion(r);
                                                            setRegionMenu(false);
                                                        }}
                                                        title={r.name}
                                                    />
                                                ))
                                        ) : (
                                            <Menu.Item title={selectedCountry ? "No regions found" : "Select Country first"} disabled />
                                        )}
                                    </ScrollView>
                                </Menu>
                            </View>

                            {/* Conditional Rendering based on Module Name */}
                            {currentModuleName?.toLowerCase().includes('vehicle') ? (
                                <>
                                    {/* Vehicle Usage Selection */}
                                    <View style={{ flex: 1.5 }}>
                                        <Text style={styles.label}>Usage</Text>
                                        <Menu
                                            visible={typeMenu}
                                            onDismiss={() => setTypeMenu(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => !viewOnly && setTypeMenu(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={selectedType ? (selectedType.isAll ? 'All' : (selectedType.type_name || selectedType.name)) : ''}
                                                        placeholder="Select Usage"
                                                        editable={false}
                                                        style={{ backgroundColor: 'white', borderRadius: 12 }}
                                                        outlineColor="#e2e8f0"
                                                        activeOutlineColor="#673ab7"
                                                        outlineStyle={{ borderRadius: 12 }}
                                                        right={<TextInput.Icon icon="chevron-down" iconColor="#64748b" onPress={() => !viewOnly && setTypeMenu(true)} />}
                                                        pointerEvents="none"
                                                    />
                                                </TouchableOpacity>
                                            }
                                            contentStyle={styles.menuContent}
                                        >
                                            <ScrollView style={{ maxHeight: 250 }}>
                                                <Menu.Item
                                                    onPress={() => {
                                                        setSelectedType({ type_name: 'All', id: null, isAll: true });
                                                        setTypeMenu(false);
                                                    }}
                                                    title="All"
                                                />
                                                {vehicleUsages.map((t, i) => (
                                                    <Menu.Item
                                                        key={i}
                                                        onPress={() => {
                                                            setSelectedType({ ...t, type_name: t.name });
                                                            setTypeMenu(false);
                                                        }}
                                                        title={t.name}
                                                    />
                                                ))}
                                            </ScrollView>
                                        </Menu>
                                    </View>
                                </>
                            ) : (
                                <>
                                    {/* Property Type Selection */}
                                    <View style={{ flex: 1.1, minWidth: 100 }}>
                                        <Text style={styles.label}>Property Type</Text>
                                        <Menu
                                            visible={ownershipMenu}
                                            onDismiss={() => setOwnershipMenu(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => !viewOnly && setOwnershipMenu(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={selectedPropertyType ? (selectedPropertyType.isAll ? 'All' : selectedPropertyType.name) : ''}
                                                        placeholder="Select Property Type"
                                                        editable={false}
                                                        style={{ backgroundColor: 'white', borderRadius: 12 }}
                                                        outlineColor="#e2e8f0"
                                                        activeOutlineColor="#673ab7"
                                                        outlineStyle={{ borderRadius: 12 }}
                                                        right={<TextInput.Icon icon="chevron-down" iconColor="#64748b" onPress={() => !viewOnly && setOwnershipMenu(true)} />}
                                                        pointerEvents="none"
                                                    />
                                                </TouchableOpacity>
                                            }
                                            contentStyle={styles.menuContent}
                                        >
                                            <Menu.Item
                                                onPress={() => {
                                                    setSelectedPropertyType({ name: 'All', id: null, isAll: true });
                                                    setOwnershipMenu(false);
                                                }}
                                                title="All"
                                            />
                                            {propertyTypes.length > 0 ? (
                                                propertyTypes
                                                    .filter(pt => (pt.name || '').toLowerCase() !== 'all')
                                                    .map((pt, i) => (
                                                        <Menu.Item
                                                            key={pt.id || i}
                                                            onPress={() => {
                                                                setSelectedPropertyType(pt);
                                                                setOwnershipMenu(false);
                                                            }}
                                                            title={pt.name}
                                                        />
                                                    ))
                                            ) : (
                                                <Menu.Item title="No types loaded" disabled />
                                            )}
                                        </Menu>
                                    </View>

                                    {/* Premise Type Selection */}
                                    <View style={{ flex: 1.5 }}>
                                        <Text style={styles.label}>Premise Type</Text>
                                        <Menu
                                            visible={typeMenu}
                                            onDismiss={() => setTypeMenu(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => !viewOnly && setTypeMenu(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={selectedType ? (selectedType.isAll ? 'All' : selectedType.type_name) : ''}
                                                        placeholder="Select Premises Type"
                                                        editable={false}
                                                        style={{ backgroundColor: 'white', borderRadius: 12 }}
                                                        outlineColor="#e2e8f0"
                                                        activeOutlineColor="#673ab7"
                                                        outlineStyle={{ borderRadius: 12 }}
                                                        right={<TextInput.Icon icon="chevron-down" iconColor="#64748b" onPress={() => !viewOnly && setTypeMenu(true)} />}
                                                        pointerEvents="none"
                                                    />
                                                </TouchableOpacity>
                                            }
                                            contentStyle={styles.menuContent}
                                        >
                                            <ScrollView style={{ maxHeight: 250 }}>
                                                <Menu.Item
                                                    onPress={() => {
                                                        setSelectedType({ type_name: 'All', id: null, isAll: true });
                                                        setTypeMenu(false);
                                                    }}
                                                    title="All"
                                                />
                                                {premisesTypes
                                                    .filter(t => (t.type_name || '').toLowerCase() !== 'all')
                                                    .map((t, i) => (
                                                        <Menu.Item
                                                            key={i}
                                                            onPress={() => {
                                                                setSelectedType(t);
                                                                setTypeMenu(false);
                                                            }}
                                                            title={t.type_name}
                                                        />
                                                    ))}
                                            </ScrollView>
                                        </Menu>
                                    </View>

                                    {/* Area Selection */}
                                    <View style={{ flex: 1.5 }}>
                                        <Text style={styles.label}>Area</Text>
                                        <Menu
                                            visible={areaMenu}
                                            onDismiss={() => setAreaMenu(false)}
                                            anchor={
                                                <TouchableOpacity onPress={() => !viewOnly && setAreaMenu(true)}>
                                                    <TextInput
                                                        mode="outlined"
                                                        value={selectedArea ? (selectedArea.isAll ? 'All' : selectedArea.name) : ''}
                                                        placeholder="Select Area"
                                                        editable={false}
                                                        style={{ backgroundColor: 'white', borderRadius: 12 }}
                                                        outlineColor="#e2e8f0"
                                                        activeOutlineColor="#673ab7"
                                                        outlineStyle={{ borderRadius: 12 }}
                                                        right={<TextInput.Icon icon="chevron-down" iconColor="#64748b" onPress={() => !viewOnly && setAreaMenu(true)} />}
                                                        pointerEvents="none"
                                                    />
                                                </TouchableOpacity>
                                            }
                                            contentStyle={styles.menuContent}
                                        >
                                            <ScrollView style={{ maxHeight: 250 }}>
                                                <Menu.Item
                                                    onPress={() => {
                                                        setSelectedArea({ name: 'All', id: null, isAll: true });
                                                        setAreaMenu(false);
                                                    }}
                                                    title="All"
                                                />
                                                {areas
                                                    .filter(a => (a.name || '').toLowerCase() !== 'all')
                                                    .map((a, i) => (
                                                        <Menu.Item
                                                            key={i}
                                                            onPress={() => {
                                                                setSelectedArea(a);
                                                                setAreaMenu(false);
                                                            }}
                                                            title={a.name}
                                                        />
                                                    ))}
                                            </ScrollView>
                                        </Menu>
                                    </View>
                                </>
                            )}

                            <View style={{ flex: 0.8, alignItems: 'flex-end', marginTop: 28 }}>
                                <View style={styles.statusBadge}>
                                    <Text style={[styles.label, { marginBottom: 0, marginRight: 12 }]}>Status</Text>
                                    <Switch
                                        value={status === 'ACTIVE'}
                                        onValueChange={(val) => !viewOnly && setStatus(val ? 'ACTIVE' : 'INACTIVE')}
                                        color="#10b981"
                                        disabled={viewOnly}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.builderContainer}>
                        <FieldBuilderPanel
                            moduleId={currentMasterId}
                            moduleName={currentModuleName}
                            readOnly={viewOnly}
                            initialSectionName={initialSection}
                            onClose={onClose}
                        />
                    </View>
                </View>

                {viewOnly && (
                    <View style={styles.footer}>
                        <Button
                            mode="outlined"
                            onPress={onClose}
                            textColor="#3b82f6"
                            style={styles.modalCancelBtn}
                            labelStyle={{ fontWeight: '700', fontSize: 15 }}
                        >
                            Close
                        </Button>
                    </View>
                )}

            </Modal>
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={2000}
                style={styles.snackbar}
            >
                Module selected. You can now add fields below.
            </Snackbar>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: '95%',
        maxWidth: 1100,
        height: '92%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    sectionPill: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    sectionPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3b82f6',
    },
    body: {
        flex: 1,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
    },
    topRow: {
        paddingHorizontal: 32,
        paddingTop: 32,
        flexDirection: 'row',
        gap: 32,
        marginBottom: 24,
        alignItems: 'flex-start'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    input: {
        backgroundColor: 'white',
        height: 44,
    },
    dropdownAnchor: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        height: 44,
        paddingHorizontal: 16,
        backgroundColor: 'white',
    },
    dropdownValue: {
        fontSize: 14,
        color: '#1e293b',
    },
    placeholder: {
        color: '#94a3b8',
    },
    menuContent: {
        backgroundColor: 'white',
        width: 400,
        marginTop: 48,
        borderRadius: 12,
        elevation: 8,
    },
    searchBar: {
        margin: 8,
        elevation: 0,
        backgroundColor: '#f8fafc',
        height: 40,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    builderContainer: {
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        // No margin top, border handles separation
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.7,
        marginBottom: 50
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94a3b8'
    },
    emptyText: {
        padding: 20,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: 'white',
    },
    modalCancelBtn: {
        borderRadius: 100,
        paddingHorizontal: 24,
        borderColor: '#e2e8f0',
        height: 48,
        justifyContent: 'center',
    },
    footerBtn: {
        marginRight: 8,
    },
    saveBtn: {
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#3b82f6',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        marginLeft: 8,
        color: '#3b82f6',
        fontWeight: '700',
        width: 60,
    },
    snackbar: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
    }
});

export default ModuleFormModal;
