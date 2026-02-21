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
                    const [cRes, ptRes, aRes, propRes] = await Promise.all([
                        api.get('countries'),
                        api.get('premises-types'),
                        api.get('areas'),
                        api.get('property-types') // Fetch property types
                    ]);
                    if (cRes.data?.success) setCountries(cRes.data.data);
                    if (ptRes.data?.success) setPremisesTypes(ptRes.data.data);
                    // Handle area response structure if different
                    if (aRes.data?.success || Array.isArray(aRes.data)) setAreas(aRes.data.data || aRes.data);
                    if (propRes.data?.success) setPropertyTypes(propRes.data.data); // Set property types
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
                // Set initial values if available in 'module' object
                // Assuming module object has these IDs or we need to find them
                // For now, we might leave them null or try to match if IDs are present
                if (module.country_id) setSelectedCountry({ id: module.country_id, name: module.country_name }); // Mock object if full obj not available
                if (module.property_type_id) setSelectedPropertyType({ id: module.property_type_id, name: module.property_type });
                if (module.premises_type_id) setSelectedType({ id: module.premises_type_id, type_name: module.premises_type });
                if (module.area_id) setSelectedArea({ id: module.area_id, name: module.area_name });
                if (module.region) setSelectedRegion({ name: module.region });
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
            // Ensure we clear selected region if country changes and it doesn't match? 
            // Better to let user re-select, or if editing, keep if valid. 
            // For now, if user changes country, region should likely reset unless prepopulated.
            if (!module) setSelectedRegion(null);

            if (!selectedCountry) return;

            const countryName = selectedCountry.country_name || selectedCountry.name;
            if (!countryName) return;

            let queryCountry = countryName;
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

        fetchRegions();
    }, [selectedCountry?.id]); // Depend on ID to avoid loop if object ref changes







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
                property_type_id: selectedPropertyType?.id || null,
                premises_type_id: selectedType?.id || null,
                area_id: selectedArea?.id || null,
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
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Text style={styles.title}>
                                {viewOnly ? 'Module Details' : (module ? 'Edit Module Mapping' : 'Add Module')}
                            </Text>
                            {/* Section pills removed from here as they are now in the Detail Modal */}
                        </View>
                        <Text style={styles.subtitle}>
                            {viewOnly ? 'Detailed configuration of this module' : 'Select a module and configure its fields'}
                        </Text>
                    </View>
                    <IconButton icon="close" size={24} onPress={onClose} />
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
                                                style={{ backgroundColor: 'white' }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                right={<TextInput.Icon icon="chevron-down" onPress={() => !viewOnly && setMenuVisible(true)} />}
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
                                                value={selectedCountry ? (selectedCountry.name || selectedCountry.country_name) : ''}
                                                placeholder="Select Country"
                                                editable={false}
                                                style={{ backgroundColor: 'white' }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                right={<TextInput.Icon icon="chevron-down" onPress={() => !viewOnly && setCountryMenu(true)} />}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    <ScrollView style={{ maxHeight: 250 }}>
                                        {countries.map((c, i) => (
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
                                                value={selectedRegion ? selectedRegion.name : ''}
                                                placeholder="Select Region"
                                                editable={false}
                                                style={{ backgroundColor: 'white' }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                right={<TextInput.Icon icon="chevron-down" onPress={() => !viewOnly && setRegionMenu(true)} />}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    <ScrollView style={{ maxHeight: 250 }}>
                                        {regions.length > 0 ? (
                                            regions.map((r, i) => (
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
                                                value={selectedPropertyType ? selectedPropertyType.name : ''}
                                                placeholder="Select Property Type"
                                                editable={false}
                                                style={{ backgroundColor: 'white' }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                right={<TextInput.Icon icon="chevron-down" onPress={() => !viewOnly && setOwnershipMenu(true)} />}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    {propertyTypes.length > 0 ? (
                                        propertyTypes.map((pt, i) => (
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
                                                value={selectedType ? selectedType.type_name : ''}
                                                placeholder="Select Premises Type"
                                                editable={false}
                                                style={{ backgroundColor: 'white' }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                right={<TextInput.Icon icon="chevron-down" onPress={() => !viewOnly && setTypeMenu(true)} />}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    <ScrollView style={{ maxHeight: 250 }}>
                                        {premisesTypes.map((t, i) => (
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
                                                value={selectedArea ? selectedArea.name : ''}
                                                placeholder="Select Area"
                                                editable={false}
                                                style={{ backgroundColor: 'white' }}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                right={<TextInput.Icon icon="chevron-down" onPress={() => !viewOnly && setAreaMenu(true)} />}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
                                    }
                                    contentStyle={styles.menuContent}
                                >
                                    <ScrollView style={{ maxHeight: 250 }}>
                                        {areas.map((a, i) => (
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

                            <View style={{ flex: 0.8, alignItems: 'flex-end', marginTop: 28 }}>
                                <View style={styles.statusBadge}>
                                    <Text style={[styles.label, { marginBottom: 0, marginRight: 12 }]}>Status</Text>
                                    <Switch
                                        value={status === 'ACTIVE'}
                                        onValueChange={(val) => !viewOnly && setStatus(val ? 'ACTIVE' : 'INACTIVE')}
                                        color="#3b82f6"
                                        disabled={viewOnly}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.builderContainer}><FieldBuilderPanel moduleId={currentMasterId} moduleName={currentModuleName} readOnly={viewOnly} initialSectionName={initialSection} /></View>
                </View>

                <View style={styles.footer}>
                    <Button
                        mode="text"
                        onPress={onClose}
                        textColor="#64748b"
                        style={styles.footerBtn}
                        labelStyle={{ fontWeight: '600' }}
                    >
                        Close
                    </Button>
                </View>

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
        margin: 20,
        borderRadius: 16,
        width: '95%',
        maxWidth: 1100,
        height: '90%',
        alignSelf: 'center',
        overflow: 'hidden',
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
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
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#f8fafc',
        gap: 12,
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
