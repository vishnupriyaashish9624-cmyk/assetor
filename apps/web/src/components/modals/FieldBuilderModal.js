import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton, Switch, Menu, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';

const FieldBuilderModal = ({ visible, onClose, moduleId, moduleName }) => {
    // Stage 1: Select Section
    const [sections, setSections] = useState([]); // Sections already belonging to THIS module
    const [selectedSection, setSelectedSection] = useState(null);
    const [loadingSections, setLoadingSections] = useState(false);

    // Stage 2: Add Field Form
    const [fields, setFields] = useState([]); // Existing fields
    const [loadingFields, setLoadingFields] = useState(false);

    // Form Inputs
    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldKey, setFieldKey] = useState('');
    const [fieldType, setFieldType] = useState('text'); // text, textarea, number, date, dropdown, radio, checkbox, switch
    const [placeholder, setPlaceholder] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState('0');

    // Options for Radio/Select
    const [options, setOptions] = useState([{ label: '', value: '' }]);

    // UI state
    const [submitting, setSubmitting] = useState(false);
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const [showSectionMenu, setShowSectionMenu] = useState(false);

    useEffect(() => {
        if (visible && moduleId) {
            fetchSections();
            // Reset state
            setSelectedSection(null);
            setFields([]);
            resetForm();
            setShowSectionMenu(false);
        }
    }, [visible, moduleId]);

    useEffect(() => {
        if (selectedSection) {
            fetchFields(selectedSection.id);
        }
    }, [selectedSection]);

    const fetchSections = async () => {
        try {
            setLoadingSections(true);
            const res = await api.get(`module-builder/module-sections?module_id=${moduleId}`);
            if (res.data.success) {
                setSections(res.data.data);
                // Auto-select first if available
                if (res.data.data.length > 0 && !selectedSection) {
                    setSelectedSection(res.data.data[0]);
                }
            }
        } catch (error) {
            console.error('Fetch sections error:', error);
        } finally {
            setLoadingSections(false);
        }
    };

    const fetchFields = async (sectionId) => {
        try {
            setLoadingFields(true);
            const res = await api.get(`module-builder/module-section-fields?section_id=${sectionId}`);
            if (res.data.success) {
                setFields(res.data.data);
            }
        } catch (error) {
            console.error('Fetch fields error:', error);
        } finally {
            setLoadingFields(false);
        }
    };

    const resetForm = () => {
        setFieldLabel('');
        setFieldKey('');
        setFieldType('text');
        setPlaceholder('');
        setIsRequired(false);
        setIsActive(true);
        setSortOrder('0');
        setOptions([{ label: '', value: '' }]);
    };

    const generateKey = (label) => {
        return label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    };

    const handleLabelChange = (text) => {
        setFieldLabel(text);
        if (!fieldKey || fieldKey === generateKey(fieldLabel)) { // Update key automatically if it matches the label's key or is empty
            setFieldKey(generateKey(text));
        }
    };

    const addOptionRow = () => {
        setOptions([...options, { label: '', value: '' }]);
    };

    const removeOptionRow = (index) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    const updateOption = (index, key, val) => {
        const newOptions = [...options];
        newOptions[index][key] = val;
        if (key === 'label' && !newOptions[index].value) {
            newOptions[index].value = generateKey(val);
        }
        setOptions(newOptions);
    };

    const handleSaveField = async () => {
        if (!fieldLabel || !fieldKey || !selectedSection) {
            Alert.alert('Missing Data', 'Please fill in required fields (Label, Key, Section)');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                module_id: moduleId,
                section_id: selectedSection.id,
                label: fieldLabel,
                field_key: fieldKey,
                field_type: fieldType,
                placeholder,
                is_required: isRequired,
                is_active: isActive,
                sort_order: parseInt(sortOrder) || 0,
                options: (['radio', 'select', 'dropdown'].includes(fieldType)) ? options : []
            };

            const res = await api.post('module-builder/module-section-fields', payload);
            if (res.data.success) {
                resetForm();
                fetchFields(selectedSection.id);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save field');
        } finally {
            setSubmitting(false);
        }
    };

    const FIELD_TYPES = [
        { label: 'Textbox', value: 'text' },
        { label: 'Textarea', value: 'textarea' },
        { label: 'Number', value: 'number' },
        { label: 'Date', value: 'date' },
        { label: 'Dropdown', value: 'dropdown' },
        { label: 'Radio Buttons', value: 'radio' },
        { label: 'Checkbox', value: 'checkbox' },
        { label: 'Switch', value: 'switch' },
    ];

    const currentTypeLabel = FIELD_TYPES.find(t => t.value === fieldType)?.label || 'Textbox';

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Field Builder</Text>
                        <Text style={styles.subtitle}>Module: {moduleName}</Text>
                    </View>
                    <IconButton icon="close" onPress={onClose} />
                </View>

                <View style={styles.body}>
                    {/* Section Dropdown */}
                    <View style={styles.sectionSelector}>
                        <Text style={styles.label}>Module Head / Section Name</Text>
                        <Menu
                            visible={showSectionMenu}
                            onDismiss={() => setShowSectionMenu(false)}
                            anchor={
                                <TouchableOpacity
                                    style={styles.dropdownLarge}
                                    onPress={() => setShowSectionMenu(true)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="folder-outline" size={20} color="#3b82f6" style={{ marginRight: 10 }} />
                                        <Text style={styles.dropdownText}>
                                            {selectedSection ? selectedSection.name : 'Select Module Head...'}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
                                </TouchableOpacity>
                            }
                            contentStyle={{ backgroundColor: 'white', width: '100%' }}
                        >
                            {sections.map(s => (
                                <Menu.Item
                                    key={s.id}
                                    onPress={() => {
                                        setSelectedSection(s);
                                        setShowSectionMenu(false);
                                    }}
                                    title={s.name}
                                />
                            ))}
                        </Menu>
                    </View>

                    <Divider style={{ marginVertical: 20 }} />

                    {selectedSection && (
                        <View style={styles.twoColumn}>
                            {/* LEFT: Add New Field Form */}
                            <View style={styles.leftCol}>
                                <Text style={styles.sectionTitle}>Add New Field to: {selectedSection.name}</Text>

                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabelText}>Field Label</Text>
                                        <TextInput
                                            mode="outlined"
                                            value={fieldLabel}
                                            onChangeText={handleLabelChange}
                                            style={styles.input}
                                            outlineColor="#e2e8f0"
                                            activeOutlineColor="#3b82f6"
                                        />
                                    </View>

                                </View>

                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabelText}>Field Type</Text>
                                        <Menu
                                            visible={showTypeMenu}
                                            onDismiss={() => setShowTypeMenu(false)}
                                            anchor={
                                                <TouchableOpacity
                                                    style={styles.typeDropdown}
                                                    onPress={() => setShowTypeMenu(true)}
                                                >
                                                    <Text style={{ fontSize: 14 }}>{currentTypeLabel}</Text>
                                                    <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
                                                </TouchableOpacity>
                                            }
                                        >
                                            {FIELD_TYPES.map(t => (
                                                <Menu.Item
                                                    key={t.value}
                                                    onPress={() => {
                                                        setFieldType(t.value);
                                                        setShowTypeMenu(false);
                                                    }}
                                                    title={t.label}
                                                />
                                            ))}
                                        </Menu>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabelText}>Sort Order</Text>
                                        <TextInput
                                            mode="outlined"
                                            value={sortOrder}
                                            onChangeText={setSortOrder}
                                            keyboardType="numeric"
                                            style={styles.input}
                                            outlineColor="#e2e8f0"
                                            activeOutlineColor="#3b82f6"
                                        />
                                    </View>
                                </View>

                                <Text style={styles.fieldLabelText}>Placeholder / Helper Text</Text>
                                <TextInput
                                    mode="outlined"
                                    value={placeholder}
                                    onChangeText={setPlaceholder}
                                    style={styles.input}
                                    activeOutlineColor="#3b82f6"
                                    placeholder="e.g. Enter client name"
                                    placeholderTextColor="#94a3b8"
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b' }}>Required</Text>
                                        <Switch value={isRequired} onValueChange={setIsRequired} color="#3b82f6" />
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b' }}>Active</Text>
                                        <Switch value={isActive} onValueChange={setIsActive} color="#3b82f6" />
                                    </View>
                                </View>

                                <Button
                                    mode="contained"
                                    onPress={handleSaveField}
                                    loading={submitting}
                                    style={styles.saveButton}
                                    contentStyle={{ 高度: 48 }}
                                    labelStyle={{ fontSize: 15, fontWeight: 'bold' }}
                                >
                                    Save Field
                                </Button>
                            </View>

                            {/* RIGHT: Preview */}
                            <View style={styles.rightCol}>
                                <Text style={styles.sectionTitle}>Section Fields Preview</Text>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    {fields.length === 0 ? (
                                        <Text style={styles.noFieldsText}>No fields yet.</Text>
                                    ) : (
                                        <ScrollView style={{ width: '100%' }}>
                                            {fields.map(field => (
                                                <View key={field.id} style={styles.previewCard}>
                                                    <Text style={{ fontWeight: 'bold' }}>{field.label}</Text>
                                                    <Text style={{ color: '#64748b', fontSize: 12 }}>{field.field_type}</Text>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 12,
        height: '92%',
        width: '95%',
        alignSelf: 'center',
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    body: { flex: 1, padding: 24 },
    label: { fontSize: 13, fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: 12 },
    fieldLabelText: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    dropdownLarge: {
        height: 52,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc'
    },
    dropdownText: { fontSize: 15, fontWeight: '500', color: '#1e293b' },
    twoColumn: { flexDirection: 'row', flex: 1, gap: 32 },
    leftCol: { flex: 1.2 },
    rightCol: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#f1f5f9' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 24 },
    row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    input: { backgroundColor: 'white', height: 44, fontSize: 14, marginBottom: 4 },
    typeDropdown: {
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 0,
        backgroundColor: 'white'
    },
    saveButton: { borderRadius: 30, backgroundColor: '#3b82f6', marginTop: 10, elevation: 0 },
    noFieldsText: { color: '#94a3b8', textAlign: 'center', fontSize: 15, fontWeight: '500' },
    previewCard: { backgroundColor: 'white', padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }
});

export default FieldBuilderModal;
