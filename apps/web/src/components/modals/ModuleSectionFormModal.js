import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton, Searchbar, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';

const ModuleSectionFormModal = ({ visible, onClose, onSave, section = null, initialModuleId = null }) => {

    const [name, setName] = useState('');
    const [moduleId, setModuleId] = useState(null);
    const [moduleName, setModuleName] = useState('');
    const [sortOrder, setSortOrder] = useState('0');
    const [loading, setLoading] = useState(false);
    const [catalog, setCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (visible) {
            fetchCatalog();
            if (section) {
                setName(section.name);
                setModuleId(section.module_id);
                setModuleName(section.module_name);
                setSortOrder(String(section.sort_order || 0));
            } else {
                setName('');
                // Use initialModuleId if provided
                if (initialModuleId) {
                    setModuleId(initialModuleId);
                    // We might not have the name yet, but it will be resolved from catalog if needed
                    // or we can rely on the ID being set. 
                    // Ideally we should look up the name from the catalog once loaded.
                } else {
                    setModuleId(null);
                }
                setModuleName(''); // Will be updated when catalog loads if ID matches
                setSortOrder('0');
            }
        }
    }, [section, visible, initialModuleId]);

    // Effect to update module name when catalog loads if we have an ID but no name
    useEffect(() => {
        if (moduleId && !moduleName && catalog.length > 0) {
            const found = catalog.find(m => m.module_id === moduleId);
            if (found) {
                setModuleName(found.module_name);
            }
        }
    }, [catalog, moduleId, moduleName]);

    const fetchCatalog = async () => {
        try {
            setCatalogLoading(true);
            const res = await api.get('module-master');
            if (res.data && res.data.success) {
                setCatalog(res.data.data || []);
            }
        } catch (err) {
            console.error('[FetchCatalog] Error:', err);
        } finally {
            setCatalogLoading(false);
        }
    };

    const handleSave = async () => {
        if (!moduleId || !name) {
            Alert.alert('Error', 'Please select a module and enter a section name');
            return;
        }
        setLoading(true);
        try {
            await onSave({
                module_id: moduleId,
                name,
                sort_order: parseInt(sortOrder) || 0
            });
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const filteredCatalog = catalog.filter(item => {
        const n = (item.module_name || '').toLowerCase();
        const s = (searchQuery || '').toLowerCase();
        return n.includes(s);
    });

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onClose}
                contentContainerStyle={styles.container}
            >
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name={section ? "pencil-outline" : "plus"} size={28} color="#6366f1" />
                    </View>
                    <View>
                        <Text style={styles.title}>{section ? 'Edit Section' : 'Add Section'}</Text>
                        <Text style={styles.subtitle}>Define sections for your data modules</Text>
                    </View>
                    <IconButton
                        icon="close"
                        size={24}
                        onPress={onClose}
                        iconColor="#64748b"
                        style={styles.closeBtn}
                    />
                </View>

                <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                    {/* Module Selection */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Target Module</Text>
                        <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisible(false)}
                            anchor={
                                <TouchableOpacity
                                    style={styles.dropdownAnchor}
                                    onPress={() => setMenuVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.dropdownLeft}>
                                        <MaterialCommunityIcons name="layers-outline" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                                        <Text style={[styles.dropdownValue, !moduleId && styles.placeholder]}>
                                            {moduleName || 'Select a module...'}
                                        </Text>
                                    </View>
                                    {catalogLoading ? (
                                        <ActivityIndicator size="small" color="#3b82f6" />
                                    ) : (
                                        <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                                    )}
                                </TouchableOpacity>
                            }
                            contentStyle={styles.menuContent}
                        >
                            <Searchbar
                                placeholder="Search modules..."
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                style={styles.searchBar}
                                inputStyle={{ fontSize: 14, minHeight: 0 }}
                            />
                            <ScrollView style={{ maxHeight: 250 }}>
                                {filteredCatalog.length === 0 ? (
                                    <Text style={styles.emptyText}>No modules found</Text>
                                ) : (
                                    filteredCatalog.map((item) => (
                                        <Menu.Item
                                            key={item.module_id}
                                            onPress={() => {
                                                setModuleId(item.module_id);
                                                setModuleName(item.module_name);
                                                setMenuVisible(false);
                                            }}
                                            title={item.module_name}
                                            titleStyle={styles.menuItemTitle}
                                        />
                                    ))
                                )}
                            </ScrollView>
                        </Menu>
                    </View>

                    {/* Section Name */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Section Name</Text>
                        <TextInput
                            mode="outlined"
                            dense={true}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Basic Information"
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#3b82f6"
                            style={styles.input}
                            contentStyle={styles.inputContent}
                            placeholderTextColor="#94a3b8"
                            left={<TextInput.Icon icon="form-textbox" color="#94a3b8" />}
                        />
                    </View>

                    {/* Sort Order */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Sort Order</Text>
                        <TextInput
                            mode="outlined"
                            dense={true}
                            value={sortOrder}
                            onChangeText={setSortOrder}
                            keyboardType="numeric"
                            placeholder="0"
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#3b82f6"
                            style={styles.input}
                            contentStyle={styles.inputContent}
                            placeholderTextColor="#94a3b8"
                            left={<TextInput.Icon icon="sort-variant" color="#94a3b8" />}
                        />
                        <Text style={styles.helpText}>Lower numbers appear first in the module layout.</Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        mode="text"
                        onPress={onClose}
                        textColor="#64748b"
                        labelStyle={{ fontWeight: '600' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={loading}
                        style={styles.saveBtn}
                        contentStyle={{ height: 44, paddingHorizontal: 16 }}
                        labelStyle={{ fontWeight: '700' }}
                    >
                        {section ? 'Update Section' : 'Save Section'}
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 24,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        overflow: 'hidden',
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '400',
    },
    body: {
        maxHeight: 500,
        backgroundColor: 'white',
    },
    bodyContent: {
        padding: 24,
        gap: 20,
    },
    formGroup: {
        marginBottom: 0,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'white',
        fontSize: 15,
    },
    inputContent: {
        fontFamily: 'System',
    },
    helpText: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 6,
        marginLeft: 4,
    },
    dropdownAnchor: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        height: 40,
        paddingHorizontal: 16,
        backgroundColor: 'white',
    },
    dropdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownValue: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    placeholder: {
        color: '#94a3b8',
        fontWeight: '400',
    },
    menuContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: 444, // 500 (max width) - 28*2 (padding)
        marginTop: 44,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    searchBar: {
        margin: 12,
        elevation: 0,
        backgroundColor: '#f8fafc',
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    menuItemTitle: {
        fontSize: 14,
        color: '#334155',
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
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#fff',
        gap: 12,
    },
    saveBtn: {
        backgroundColor: '#5e35a1', // Matched Purple
        borderRadius: 12,
        elevation: 0,
    },
});


export default ModuleSectionFormModal;
