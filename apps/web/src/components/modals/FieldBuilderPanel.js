import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput as NativeTextInput } from 'react-native';
import { Text, TextInput, Button, Switch, Menu, Divider, IconButton, Surface, Searchbar, Checkbox, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';
import ModuleSectionFormModal from './ModuleSectionFormModal';
import AlertDialog from '../AlertDialog';
import ConfirmDialog from '../ConfirmDialog';
import FileConfigDialog from './FileConfigDialog';

const FIELD_TYPES = [
    { label: 'Textbox', value: 'text', icon: 'form-textbox' },
    { label: 'Textarea', value: 'textarea', icon: 'form-textarea' },
    { label: 'Number', value: 'number', icon: 'numeric' },
    { label: 'Decimal', value: 'decimal', icon: 'decimal' },
    { label: 'Date', value: 'date', icon: 'calendar' },
    { label: 'Time', value: 'time', icon: 'clock-outline' },
    { label: 'DateTime', value: 'datetime', icon: 'calendar-clock' },
    { label: 'Dropdown', value: 'dropdown', icon: 'form-dropdown' },
    { label: 'Radio Button', value: 'radio', icon: 'radiobox-marked' },
    { label: 'Checkbox', value: 'checkbox', icon: 'checkbox-marked' },
    { label: 'Toggle/Switch', value: 'switch', icon: 'toggle-switch' },
    { label: 'Email', value: 'email', icon: 'email-outline' },
    { label: 'URL', value: 'url', icon: 'link' },
    { label: 'Phone', value: 'phone', icon: 'phone-outline' },
    { label: 'File Upload', value: 'file', icon: 'file-upload-outline' },
    { label: 'Image Upload', value: 'image', icon: 'image-outline' },
    { label: 'Signature', value: 'signature', icon: 'pen' },
    { label: 'Auto-generated ID', value: 'auto_generated', icon: 'identifier' },
    { label: 'Rich Text Editor', value: 'richtext', icon: 'format-text' },
    { label: 'Section Break', value: 'section_break', icon: 'minus' },
    { label: 'Hidden Field', value: 'hidden', icon: 'eye-off-outline' },
];

const FieldBuilderPanel = ({ moduleId, moduleName, readOnly = false, initialSectionName = null }) => {
    // Stage 1: Select Section
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [loadingSections, setLoadingSections] = useState(false);
    const [showSectionMenu, setShowSectionMenu] = useState(false);
    const [sectionSearchQuery, setSectionSearchQuery] = useState('');
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);

    // Stage 2: Fields List & Form
    const [fields, setFields] = useState([]);
    const [loadingFields, setLoadingFields] = useState(false);

    // Form Inputs
    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldKey, setFieldKey] = useState('');
    const [fieldType, setFieldType] = useState('text');
    const [placeholder, setPlaceholder] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState('0');
    // New: Options for dropdowns
    const [fieldOptions, setFieldOptions] = useState([]);

    // UI state
    const [submitting, setSubmitting] = useState(false);
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState(null);
    const [idPrefix, setIdPrefix] = useState('');

    // Dialog States
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [confirmConfig, setConfirmConfig] = useState({ visible: false, title: '', message: '', onConfirm: () => { }, danger: false });

    // File Configuration Dialog State
    const [fileConfigDialogVisible, setFileConfigDialogVisible] = useState(false);
    const [fileConfigTarget, setFileConfigTarget] = useState({ mode: 'none', index: -1 }); // mode: 'edit' or 'draft'
    const [currentFileConfig, setCurrentFileConfig] = useState({});
    const [previewDates, setPreviewDates] = useState({});
    const [wizardStep, setWizardStep] = useState(1); // 1: Configuration, 2: Preview

    const parseFileConfig = (str) => {
        if (str && str.startsWith("JSON:")) {
            try { return JSON.parse(str.replace("JSON:", "")); } catch (e) { return {}; }
        }
        return {};
    };

    const openFileConfigDialog = (mode, index = -1, currentPlaceholder = '') => {
        setFileConfigTarget({ mode, index });
        setCurrentFileConfig(parseFileConfig(currentPlaceholder));
        setFileConfigDialogVisible(true);
    };

    const handleFileConfigSave = (config) => {
        const str = "JSON:" + JSON.stringify(config);
        if (fileConfigTarget.mode === 'edit') {
            setPlaceholder(str);
        } else if (fileConfigTarget.mode === 'draft') {
            updateDraftRow(fileConfigTarget.index, 'placeholder', str);
        }
        setFileConfigDialogVisible(false);
    };

    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const showConfirm = (title, message, onConfirm, danger = false) => {
        setConfirmConfig({ visible: true, title, message, onConfirm, danger });
    };

    // --- MULTI-DRAFT STATE & LOGIC ---
    // Instead of reusing the single form states, we use this array for creating new fields.
    const [draftFields, setDraftFields] = useState([]);
    const [activeTypeMenuIndex, setActiveTypeMenuIndex] = useState(null); // Which row has type menu open

    useEffect(() => {
        // Initialize with one empty row if no drafts and not editing
        if (!editingFieldId && selectedSection && draftFields.length === 0) {
            addDraftRow();
        }
    }, [selectedSection, editingFieldId]);

    const addDraftRow = () => {
        const nextSort = fields.length + draftFields.length + 1;
        setDraftFields(prev => [...prev, {
            _tempId: Date.now() + Math.random(), // unique key for list
            label: '',
            field_key: '',
            field_type: 'text',
            sort_order: nextSort.toString(),
            placeholder: '',
            is_required: false,
            is_active: true,
            options: [],
            meta_json: null
        }]);
    };

    const removeDraftRow = (index) => {
        const newDrafts = [...draftFields];
        newDrafts.splice(index, 1);
        setDraftFields(newDrafts);
    };

    const updateDraftRow = (index, key, value) => {
        const newDrafts = [...draftFields];
        newDrafts[index][key] = value;

        // Auto-key generation
        if (key === 'label') {
            const currentKey = newDrafts[index].field_key;
            const prevLabel = newDrafts[index]._prevLabel || '';
            // If key is empty OR key matches the slug of the PREVIOUS label, update it
            if (!currentKey || currentKey === generateKey(prevLabel)) {
                newDrafts[index].field_key = generateKey(value);
            }
            newDrafts[index]._prevLabel = value;
        }

        setDraftFields(newDrafts);
    };

    const handleDraftOptionChange = (rowIdx, optIdx, key, val) => {
        const newDrafts = [...draftFields];
        if (!newDrafts[rowIdx].options) newDrafts[rowIdx].options = [];

        // Clone the options array and the specific option to avoid mutation
        const opts = [...newDrafts[rowIdx].options];
        if (!opts[optIdx]) opts[optIdx] = { label: '', value: '' }; // Safety
        opts[optIdx] = { ...opts[optIdx] };

        const oldLabel = opts[optIdx].label || '';
        const oldValue = opts[optIdx].value || '';

        opts[optIdx][key] = val;

        if (key === 'label') {
            const oldSlug = oldLabel.toLowerCase().replace(/\s+/g, '_');
            // Update value if it's empty OR if it currently matches the auto-generated old label
            // Check both uppercase (legacy) and lowercase old slugs to be safe
            const isAutoGenerated = !oldValue || oldValue === oldSlug || oldValue === oldLabel.toUpperCase().replace(/\s+/g, '_');

            if (isAutoGenerated) {
                opts[optIdx].value = val.toLowerCase().replace(/\s+/g, '_');
            }
        }

        newDrafts[rowIdx].options = opts;
        setDraftFields(newDrafts);
    };

    const handleSaveAllDrafts = async () => {
        // Validation
        const conflicts = [];
        for (let i = 0; i < draftFields.length; i++) {
            const f = draftFields[i];
            if (!f.label || !f.field_key) {
                showAlert('Validation Error', `Row ${i + 1} is missing Label or Key.`, 'warning');
                return;
            }
            // Check duplicates within draft
            // Check duplicates with existing (fields)?
            // current fields list: fields
            if (fields.some(ex => ex.field_key === f.field_key)) {
                conflicts.push(`${f.field_key} (Row ${i + 1}) already exists.`);
            }
        }

        if (conflicts.length > 0) {
            showAlert('Duplicate Keys', 'The following keys already exist: ' + conflicts.join(', '), 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const promises = draftFields.map(f => {
                const payload = {
                    module_id: moduleId,
                    section_id: selectedSection.id,
                    label: f.label,
                    field_key: f.field_key,
                    field_type: f.field_type,
                    placeholder: f.placeholder,
                    is_required: f.is_required,
                    is_active: f.is_active,
                    sort_order: parseInt(f.sort_order) || 0,
                    options: f.options ? f.options.filter(o => o.label && o.value) : [],
                    meta_json: f.meta_json
                };
                return api.post('module-builder/fields', payload);
            });

            await Promise.all(promises);
            showAlert('Success', 'All fields saved.', 'success');
            setDraftFields([]); // Clear
            fetchFields(selectedSection.id);
            // Add one new empty row automatically via useEffect
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to save fields. Check console.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (moduleId) {
            fetchSections();
            setSelectedSection(null);
            setFields([]);
            resetForm();
        }
    }, [moduleId]);

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
                const sortedSections = res.data.data.sort((a, b) => {
                    const orderDiff = (a.sort_order || 0) - (b.sort_order || 0);
                    if (orderDiff !== 0) return orderDiff;
                    // Fallback to name for easier reading if orders are equal
                    return a.name.localeCompare(b.name);
                });
                setSections(sortedSections);
                // Auto-select based on initialSectionName or just first if available
                if (sortedSections.length > 0) {
                    let sectionToSelect = sortedSections[0];
                    if (initialSectionName) {
                        const found = sortedSections.find(s => s.name.toLowerCase() === initialSectionName.toLowerCase());
                        if (found) sectionToSelect = found;
                    }
                    setSelectedSection(sectionToSelect);
                    setSectionSearchQuery(sectionToSelect.name);
                }
            }
        } catch (error) {
            console.error('Fetch sections error:', error);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleQuickAddSection = async (sectionData) => {
        try {
            const res = await api.post('module-sections', sectionData);
            if (res.data.success || res.status === 200 || res.status === 201) {
                showAlert('Success', 'Section created.', 'success');
                await fetchSections();
                setShowAddSectionModal(false);
            }
        } catch (error) {
            console.error('Save section error:', error);
            showAlert('Error', 'Failed to create section.', 'error');
        }
    };

    const fetchFields = async (sectionId) => {
        try {
            setLoadingFields(true);
            const res = await api.get(`module-builder/fields?section_id=${sectionId}`);
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
        setSortOrder((fields.length + 1).toString());
        setFieldOptions([{ label: '', value: '' }]); // Reset options
        setIdPrefix('');
        setEditingFieldId(null);
    };

    const handleEdit = (field) => {
        setFieldLabel(field.label);
        setFieldKey(field.field_key);
        setFieldType(field.field_type);
        setPlaceholder(field.placeholder || '');
        setIsRequired(!!field.is_required);
        setIsActive(!!field.is_active);
        setSortOrder(String(field.sort_order));

        if (field.options && field.options.length > 0) {
            setFieldOptions(field.options.map(o => ({
                label: o.option_label || o.label,
                value: o.option_value || o.value
            })));
        } else {
            setFieldOptions([{ label: '', value: '' }]);
        }

        if (field.meta_json) {
            try {
                const meta = typeof field.meta_json === 'string' ? JSON.parse(field.meta_json) : field.meta_json;
                setIdPrefix(meta.id_code || '');
            } catch (e) {
                console.error('Error parsing meta_json:', e);
            }
        } else {
            setIdPrefix('');
        }

        setEditingFieldId(field.id);
    };

    const generateKey = (label) => {
        return label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    };

    const handleLabelChange = (text) => {
        setFieldLabel(text);
        // Only auto-generate key if we are NOT editing an existing field (to preserve keys)
        // or if the key was empty/default
        if (!editingFieldId && (!fieldKey || fieldKey === generateKey(fieldLabel))) {
            setFieldKey(generateKey(text));
        }
    };

    const handleSaveField = async () => {
        if (!fieldLabel || !fieldKey || !selectedSection) {
            showAlert('Missing Data', 'Please fill in required fields (Label, Key, Section)', 'warning');
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
                options: fieldOptions.filter(o => o.label && o.value), // Send valid options
                meta_json: fieldType === 'auto_generated' ? { id_code: idPrefix } : null
            };

            console.log('[FieldBuilder] Saving field with payload:', payload);

            let res;
            if (editingFieldId) {
                // UPDATE
                console.log(`[FieldBuilder] Updating field ID: ${editingFieldId}`);
                res = await api.put(`module-builder/fields/${editingFieldId}`, payload);
            } else {
                // CREATE
                console.log('[FieldBuilder] Creating new field');
                res = await api.post('module-builder/fields', payload);
            }

            console.log('[FieldBuilder] Server response:', res.data);

            if (res.data.success) {
                console.log('[FieldBuilder] Field saved successfully!');
                showAlert('Success', editingFieldId ? 'Field updated successfully!' : 'Field created successfully!', 'success');
                resetForm();
                fetchFields(selectedSection.id);
            } else {
                console.error('[FieldBuilder] Server returned success=false:', res.data);
                showAlert('Error', res.data.message || 'Failed to save field', 'error');
            }
        } catch (error) {
            console.error('[FieldBuilder] Error saving field:', error);
            let errorMessage = error.response?.data?.message || error.message || 'Failed to save field';

            if (error.response?.status === 404) {
                errorMessage = "API Endpoint Not Found (404). Please ensure the backend server is running the latest version.";
            }

            showAlert('Error', errorMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const performDelete = async (field) => {
        try {
            const res = await api.delete(`module-builder/fields/${field.id}`);
            if (res.data.success) {
                fetchFields(selectedSection.id);
                // If we were editing this field, reset form
                if (editingFieldId === field.id) {
                    resetForm();
                }
            }
        } catch (error) {
            console.error(error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Server error';
            showAlert('Error', 'Failed to delete field: ' + errMsg, 'error');
        }
    };

    const handleDeleteField = (field) => {
        showConfirm(
            'Confirm Delete',
            `Are you sure you want to delete the field "${field.label}"? This cannot be undone.`,
            () => performDelete(field),
            true
        );
    };

    // FIELD_TYPES moved to file scope

    const currentType = FIELD_TYPES.find(t => t.value === fieldType) || FIELD_TYPES[0];

    return (
        <View style={styles.container}>
            {/* 1. Header: Module & Section Selection */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionLabel}>MODULE STRUCTURE</Text>
                    {!!moduleName && <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>{moduleName}</Text>}
                </View>
                <Menu
                    visible={showSectionMenu}
                    onDismiss={() => {
                        setShowSectionMenu(false);
                        setSectionSearchQuery('');
                    }}
                    anchor={
                        <TouchableOpacity
                            style={[styles.sectionDropdown, (!moduleId || readOnly) && { opacity: 0.8, backgroundColor: '#f8fafc' }]}
                            onPress={() => {
                                if (readOnly || !moduleId) {
                                    if (!moduleId) Alert.alert('Attention', 'Please select a Module Name first.');
                                    return;
                                }
                                setShowSectionMenu(true);
                            }}
                            activeOpacity={readOnly ? 1 : 0.7}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name="folder-outline"
                                    size={20}
                                    color={moduleId ? (readOnly ? "#64748b" : "#3b82f6") : "#94a3b8"}
                                    style={{ marginRight: 10 }}
                                />
                                <Text style={[styles.dropdownText, (!moduleId || readOnly) && { color: '#64748b' }]}>
                                    {selectedSection ? selectedSection.name : (moduleId ? 'Select a section...' : 'Select a module above first')}
                                </Text>
                            </View>
                            {!readOnly && <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />}
                        </TouchableOpacity>
                    }
                    contentStyle={{ backgroundColor: 'white', width: '100%' }}
                >
                    <Searchbar
                        placeholder="Search sections..."
                        onChangeText={setSectionSearchQuery}
                        value={sectionSearchQuery}
                        style={styles.searchBar}
                        inputStyle={{ fontSize: 14 }}
                        autoFocus
                    />
                    <Divider />
                    <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                        {!readOnly && (
                            <>
                                <Menu.Item
                                    icon="plus"
                                    onPress={() => {
                                        setShowSectionMenu(false);
                                        setShowAddSectionModal(true);
                                    }}
                                    title="Add New Section..."
                                    titleStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                />
                                <Divider />
                            </>
                        )}
                        {sections
                            .filter(s => s.name.toLowerCase().includes(sectionSearchQuery.toLowerCase()))
                            .map(s => (
                                <Menu.Item
                                    key={s.id}
                                    onPress={() => {
                                        setSelectedSection(s);
                                        setShowSectionMenu(false);
                                        setSectionSearchQuery(s.name);
                                    }}
                                    title={s.name}
                                />
                            ))
                        }
                    </ScrollView>
                </Menu>

                <ModuleSectionFormModal
                    visible={showAddSectionModal}
                    onClose={() => setShowAddSectionModal(false)}
                    onSave={handleQuickAddSection}
                    section={null}
                    initialModuleId={moduleId}
                />
            </View>

            <Divider style={{ marginVertical: 12, backgroundColor: '#e2e8f0' }} />

            {/* 2. Wizard Indicator */}
            {!readOnly && (
                <View style={styles.wizardIndicator}>
                    {[
                        { id: 1, title: 'Configuration', icon: 'playlist-edit' },
                        { id: 2, title: 'Preview & Manage', icon: 'eye-outline' }
                    ].map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <TouchableOpacity
                                style={[styles.stepItem, wizardStep === step.id && styles.stepItemActive]}
                                onPress={() => setWizardStep(step.id)}
                            >
                                <View style={[styles.stepIcon, wizardStep === step.id && styles.stepIconActive]}>
                                    <MaterialCommunityIcons
                                        name={step.icon}
                                        size={18}
                                        color={wizardStep === step.id ? '#fff' : '#64748b'}
                                    />
                                </View>
                                <Text style={[styles.stepTitle, wizardStep === step.id && styles.stepTitleActive]}>
                                    {step.title}
                                </Text>
                            </TouchableOpacity>
                            {idx === 0 && <View style={styles.stepConnector} />}
                        </React.Fragment>
                    ))}
                </View>
            )}

            {/* 3. Main Content Area */}
            <View style={[styles.contentRow, (!selectedSection || loadingSections) && { opacity: 0.5 }]}>

                {(!readOnly && wizardStep === 1) ? (
                    /* --- STEP 1: CONFIGURATION --- */
                    <View style={styles.wizardStepContent} pointerEvents={!selectedSection ? 'none' : 'auto'}>
                        {editingFieldId ? (
                            /* EDIT MODE */
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <IconButton icon="arrow-left" size={20} onPress={resetForm} />
                                    <Text style={styles.columnTitle}>Edit Field: {fieldLabel}</Text>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 100 }}>
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Field Label</Text>
                                            <TextInput mode="outlined" value={fieldLabel} onChangeText={handleLabelChange} style={styles.input} outlineStyle={{ borderRadius: 12 }} />
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Field Type</Text>
                                            <Menu
                                                visible={showTypeMenu}
                                                onDismiss={() => setShowTypeMenu(false)}
                                                anchor={
                                                    <TouchableOpacity style={styles.typeDropdown} onPress={() => setShowTypeMenu(true)}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <MaterialCommunityIcons name={currentType.icon} size={18} color="#475569" style={{ marginRight: 8 }} />
                                                            <Text>{currentType.label}</Text>
                                                        </View>
                                                        <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
                                                    </TouchableOpacity>
                                                }
                                            >
                                                <ScrollView style={{ maxHeight: 300 }}>
                                                    {FIELD_TYPES.map(t => (
                                                        <Menu.Item key={t.value} title={t.label} leadingIcon={t.icon} onPress={() => { setFieldType(t.value); setShowTypeMenu(false); }} />
                                                    ))}
                                                </ScrollView>
                                            </Menu>
                                        </View>
                                        <View style={{ flex: 0.5 }}>
                                            <Text style={styles.fieldLabel}>Sort Order</Text>
                                            <TextInput mode="outlined" value={sortOrder} onChangeText={setSortOrder} keyboardType="numeric" style={styles.input} outlineStyle={{ borderRadius: 12 }} />
                                        </View>
                                    </View>

                                    {currentType.value === 'auto_generated' ? (
                                        <View style={{ marginBottom: 20 }}>
                                            <Text style={styles.fieldLabel}>ID Prefix / Code (e.g. VH, INV)</Text>
                                            <TextInput mode="outlined" value={idPrefix} onChangeText={setIdPrefix} style={styles.input} outlineStyle={{ borderRadius: 12 }} placeholder="e.g. VH" />
                                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>This will be used as the prefix for auto-generated IDs.</Text>
                                        </View>
                                    ) : (
                                        ['file', 'image', 'signature'].includes(currentType.value) ? (
                                            <TouchableOpacity onPress={() => openFileConfigDialog('edit', -1, placeholder)} style={{ marginBottom: 20, padding: 16, backgroundColor: '#eff6ff', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#bfdbfe', flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                                <MaterialCommunityIcons name="cog-outline" size={24} color="#3b82f6" />
                                                <View>
                                                    <Text style={{ color: '#1e40af', fontWeight: 'bold' }}>Configuration Options</Text>
                                                    <Text style={{ color: '#3b82f6', fontSize: 12 }}>Set dates, expiry, and visibility for this field</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={{ marginBottom: 20 }}>
                                                <Text style={styles.fieldLabel}>Placeholder</Text>
                                                <TextInput mode="outlined" value={placeholder} onChangeText={setPlaceholder} style={styles.input} outlineStyle={{ borderRadius: 12 }} />
                                            </View>
                                        )
                                    )}

                                    {['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(currentType.value) && (
                                        <View style={{ marginBottom: 24, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <Text style={styles.fieldLabel}>OPTIONS</Text>
                                                <Button mode="text" labelStyle={{ fontWeight: '700' }} onPress={() => setFieldOptions([...fieldOptions, { label: '', value: '' }])}>+ Add Option</Button>
                                            </View>
                                            {fieldOptions.map((opt, idx) => (
                                                <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                                                    <TextInput placeholder="Label" value={opt.label} onChangeText={(t) => {
                                                        const newOpts = [...fieldOptions];
                                                        newOpts[idx].label = t;
                                                        if (!newOpts[idx].value || newOpts[idx].value === (opt.prevValue || '').toLowerCase().replace(/\s+/g, '_')) {
                                                            newOpts[idx].value = t.toLowerCase().replace(/\s+/g, '_');
                                                        }
                                                        newOpts[idx].prevValue = t.toLowerCase().replace(/\s+/g, '_');
                                                        setFieldOptions(newOpts);
                                                    }} style={{ flex: 1, height: 40 }} dense mode="outlined" />
                                                    <TextInput placeholder="Value" value={opt.value} onChangeText={(t) => {
                                                        const newOpts = [...fieldOptions];
                                                        newOpts[idx].value = t;
                                                        setFieldOptions(newOpts);
                                                    }} style={{ flex: 1, height: 40 }} dense mode="outlined" />
                                                    <IconButton icon="close-circle" iconColor="#ef4444" size={20} onPress={() => setFieldOptions(fieldOptions.filter((_, i) => i !== idx))} />
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    <View style={styles.toggleRow}>
                                        <View style={styles.toggleItem}>
                                            <Text style={styles.toggleLabel}>Required</Text>
                                            <Switch value={isRequired} onValueChange={setIsRequired} color="#673ab7" />
                                        </View>
                                        <View style={styles.toggleItem}>
                                            <Text style={styles.toggleLabel}>Active</Text>
                                            <Switch value={isActive} onValueChange={setIsActive} color="#673ab7" />
                                        </View>
                                    </View>
                                </ScrollView>
                                <View style={{ paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', gap: 12 }}>
                                    <Button mode="outlined" style={{ flex: 1, borderRadius: 12 }} onPress={resetForm}>Cancel</Button>
                                    <Button mode="contained" style={{ flex: 2, borderRadius: 12 }} buttonColor="#673ab7" loading={submitting} onPress={handleSaveField}>Save Changes</Button>
                                </View>
                            </View>
                        ) : (
                            /* MULTI-ADD MODE */
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={styles.columnTitle}>New Fields Queue</Text>
                                    <Button mode="contained" icon="plus" buttonColor="#673ab7" style={{ borderRadius: 100 }} onPress={addDraftRow}>Add Field</Button>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 150 }}>
                                    {draftFields.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <MaterialCommunityIcons name="playlist-plus" size={48} color="#cbd5e1" />
                                            <Text style={styles.emptyText}>Add fields to the queue to save them all at once.</Text>
                                        </View>
                                    ) : (
                                        draftFields.map((draft, idx) => (
                                            <View key={draft._tempId || idx} style={styles.draftRowCard}>
                                                <IconButton icon="close" size={18} iconColor="#ef4444" style={styles.removeRowBtn} onPress={() => removeDraftRow(idx)} />
                                                <View style={styles.inputRow}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.fieldLabel}>Field Label</Text>
                                                        <TextInput mode="outlined" value={draft.label} onChangeText={(t) => updateDraftRow(idx, 'label', t)} style={{ height: 44, backgroundColor: '#fff' }} outlineStyle={{ borderRadius: 8 }} placeholder="e.g. Full Name" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.fieldLabel}>Type</Text>
                                                        <Menu
                                                            visible={activeTypeMenuIndex === idx}
                                                            onDismiss={() => setActiveTypeMenuIndex(null)}
                                                            anchor={
                                                                <TouchableOpacity style={[styles.typeDropdown, { height: 44, borderRadius: 8 }]} onPress={() => setActiveTypeMenuIndex(idx)}>
                                                                    <MaterialCommunityIcons name={(FIELD_TYPES.find(t => t.value === draft.field_type) || FIELD_TYPES[0]).icon} size={16} color="#64748b" />
                                                                    <Text style={{ fontSize: 13, flex: 1, marginLeft: 8 }}>{(FIELD_TYPES.find(t => t.value === draft.field_type) || FIELD_TYPES[0]).label}</Text>
                                                                    <MaterialCommunityIcons name="chevron-down" size={16} color="#94a3b8" />
                                                                </TouchableOpacity>
                                                            }
                                                        >
                                                            <ScrollView style={{ maxHeight: 200 }}>
                                                                {FIELD_TYPES.map(t => (
                                                                    <Menu.Item key={t.value} title={t.label} leadingIcon={t.icon} onPress={() => { updateDraftRow(idx, 'field_type', t.value); setActiveTypeMenuIndex(null); }} />
                                                                ))}
                                                            </ScrollView>
                                                        </Menu>
                                                    </View>
                                                </View>

                                                {draft.field_type === 'auto_generated' && (
                                                    <View style={{ marginBottom: 12 }}>
                                                        <Text style={styles.fieldLabel}>ID Prefix (e.g. VH)</Text>
                                                        <TextInput
                                                            mode="outlined"
                                                            dense
                                                            style={{ height: 36, backgroundColor: '#fff' }}
                                                            value={draft.meta_json?.id_code || ''}
                                                            onChangeText={(v) => {
                                                                const newMeta = { ...(draft.meta_json || {}), id_code: v };
                                                                updateDraftRow(idx, 'meta_json', newMeta);
                                                            }}
                                                            placeholder="VH"
                                                        />
                                                    </View>
                                                )}

                                                {['file', 'image', 'signature'].includes(draft.field_type) && (
                                                    <TouchableOpacity onPress={() => openFileConfigDialog('draft', idx, draft.placeholder)} style={{ marginBottom: 12, padding: 10, backgroundColor: '#f0f9ff', borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#bae6fd', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <MaterialCommunityIcons name="cog" size={18} color="#0284c7" />
                                                        <Text style={{ color: '#0369a1', fontSize: 12, fontWeight: '700' }}>Configure File Properties</Text>
                                                    </TouchableOpacity>
                                                )}

                                                {['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(draft.field_type) && (
                                                    <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b' }}>OPTIONS</Text>
                                                            <TouchableOpacity onPress={() => handleDraftOptionChange(idx, (draft.options?.length || 0), 'label', '')}>
                                                                <Text style={{ color: '#673ab7', fontSize: 11, fontWeight: 'bold' }}>+ ADD</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                        {(draft.options || []).map((opt, oIdx) => (
                                                            <View key={oIdx} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                                                                <TextInput placeholder="Label" mode="outlined" dense style={{ flex: 1, height: 32 }} value={opt.label} onChangeText={(v) => handleDraftOptionChange(idx, oIdx, 'label', v)} />
                                                                <TextInput placeholder="Value" mode="outlined" dense style={{ flex: 1, height: 32 }} value={opt.value} onChangeText={(v) => handleDraftOptionChange(idx, oIdx, 'value', v)} />
                                                                <IconButton icon="close-circle" size={16} iconColor="#94a3b8" onPress={() => {
                                                                    const newOpts = [...(draft.options || [])];
                                                                    newOpts.splice(oIdx, 1);
                                                                    updateDraftRow(idx, 'options', newOpts);
                                                                }} />
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}

                                                <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={{ fontSize: 11 }}>Required</Text>
                                                        <Switch value={draft.is_required} onValueChange={(v) => updateDraftRow(idx, 'is_required', v)} color="#673ab7" />
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={{ fontSize: 11 }}>Active</Text>
                                                        <Switch value={draft.is_active} onValueChange={(v) => updateDraftRow(idx, 'is_active', v)} color="#673ab7" />
                                                    </View>
                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                        <Text style={{ fontSize: 11 }}>Sort</Text>
                                                        <NativeTextInput value={String(draft.sort_order)} onChangeText={(v) => updateDraftRow(idx, 'sort_order', v)} style={{ width: 40, height: 32, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, textAlign: 'center', fontSize: 12 }} keyboardType="numeric" />
                                                    </View>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                ) : (
                    /* --- STEP 2: PREVIEW & MANAGE --- */
                    <View style={styles.wizardStepContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.columnTitle}>{readOnly ? 'Section Fields' : 'Preview & Management'}</Text>
                            {!readOnly && (
                                <Button mode="outlined" compact onPress={() => setWizardStep(1)} labelStyle={{ fontSize: 12 }}>Back to Config</Button>
                            )}
                        </View>
                        <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 100 }}>
                            {fields.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="form-select" size={40} color="#cbd5e1" />
                                    <Text style={styles.emptyText}>No saved fields in this section.</Text>
                                </View>
                            ) : (
                                fields.map(field => (
                                    <View key={field.id} style={styles.previewCard}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#1e293b' }}>{field.label}</Text>
                                                    {field.is_required && <Chip style={{ height: 22, backgroundColor: '#fee2e2' }} textStyle={{ fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>REQ</Chip>}
                                                </View>
                                                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                                                    <Chip icon={(FIELD_TYPES.find(t => t.value === field.field_type) || FIELD_TYPES[0]).icon} style={{ height: 24 }}>{field.field_type}</Chip>
                                                    <Chip style={{ height: 24, backgroundColor: '#f1f5f9' }}>Sort: {field.sort_order}</Chip>
                                                </View>
                                            </View>
                                            {!readOnly && (
                                                <View style={{ flexDirection: 'row' }}>
                                                    <IconButton icon="pencil-outline" size={20} iconColor="#64748b" onPress={() => handleEdit(field)} />
                                                    <IconButton icon="trash-can-outline" size={20} iconColor="#ef4444" onPress={() => handleDeleteField(field)} />
                                                </View>
                                            )}
                                        </View>

                                        {['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(field.field_type) && field.options?.length > 0 && (
                                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 8 }}>OPTIONS ({field.options.length})</Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                    {field.options.map((opt, idx) => (
                                                        <Chip key={idx} style={{ height: 26, backgroundColor: '#fff' }}>{opt.option_label || opt.label}</Chip>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* 4. Global Fixed Footer */}
            {!readOnly && (
                <View style={styles.stableFooter}>
                    <View style={styles.footerInner}>
                        {wizardStep === 1 && !editingFieldId && (
                            <Button
                                mode="outlined"
                                icon="content-save-all-outline"
                                onPress={handleSaveAllDrafts}
                                loading={submitting}
                                style={{ borderRadius: 100, borderColor: '#673ab7', height: 48, minWidth: 160 }}
                                textColor="#673ab7"
                                labelStyle={{ fontWeight: '800' }}
                                disabled={draftFields.length === 0}
                            >
                                Save All Queue
                            </Button>
                        )}
                        <Button
                            mode="contained"
                            icon={wizardStep === 1 ? "eye-outline" : "check"}
                            contentStyle={{ flexDirection: 'row-reverse', height: 48 }}
                            onPress={() => wizardStep === 1 ? setWizardStep(2) : setShowSectionMenu(false)}
                            buttonColor="#1e293b"
                            style={{ borderRadius: 100, minWidth: 140 }}
                            labelStyle={{ fontWeight: '800' }}
                        >
                            {wizardStep === 1 ? "Preview" : "Finish"}
                        </Button>
                    </View>
                </View>
            )}

            <AlertDialog
                visible={alertConfig.visible}
                onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
            <ConfirmDialog
                visible={confirmConfig.visible}
                onDismiss={() => setConfirmConfig({ ...confirmConfig, visible: false })}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                danger={confirmConfig.danger}
            />
            <FileConfigDialog
                visible={fileConfigDialogVisible}
                onDismiss={() => setFileConfigDialogVisible(false)}
                onSave={handleFileConfigSave}
                initialConfig={currentFileConfig}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 24, // Moderate top padding
    },
    // Top Section
    sectionHeader: {
        marginBottom: 24, // Added space below header
        paddingHorizontal: 32,
        paddingTop: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    sectionDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
    },
    dropdownText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '600',
    },
    searchBar: {
        elevation: 0,
        backgroundColor: 'transparent',
        borderBottomWidth: 0, // Removed border here as we use a Divider
        borderRadius: 0,
        marginBottom: 0,
    },

    // Content Columns
    contentRow: {
        flex: 1,
        paddingHorizontal: 32,
        paddingBottom: 80, // Space for footer
    },
    stableFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
    },
    footerInner: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    wizardStepContent: {
        flex: 1,
        paddingTop: 12,
    },
    wizardIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginBottom: 24,
        gap: 12,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 100,
        backgroundColor: '#f1f5f9',
    },
    stepItemActive: {
        backgroundColor: '#ede9fe',
        borderWidth: 1,
        borderColor: '#ddd6fe',
    },
    stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIconActive: {
        backgroundColor: '#673ab7',
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    stepTitleActive: {
        color: '#673ab7',
    },
    stepConnector: {
        width: 30,
        height: 2,
        backgroundColor: '#e2e8f0',
    },
    wizardNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        marginTop: 40,
        gap: 12,
    },
    wizardHint: {
        fontSize: 13,
        color: '#64748b',
        fontStyle: 'italic',
    },
    leftCol: {
        flex: 1,
        height: '100%',
        overflow: 'hidden',
    },
    rightCol: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        height: '100%',
        overflow: 'hidden',
    },
    columnTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },

    // Input Forms
    inputRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24, // More space between rows
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700', // Bold labels
        color: '#334155',
        marginBottom: 8, // More space below label
    },
    input: {
        backgroundColor: 'white',
        height: 52, // Taller inputs
        fontSize: 15,
    },
    typeDropdown: {
        height: 48,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
    },

    // Toggles
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        marginBottom: 24,
        marginTop: 8,
    },
    toggleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    saveButton: {
        backgroundColor: '#673ab7',
        borderRadius: 100,
        width: '100%',
        elevation: 0,
        height: 52,
        justifyContent: 'center',
        // Removed large marginTop as it's now in a fixed container
    },

    // Right Col Preview
    previewBox: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150,
        opacity: 0.6
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 8
    },
    previewCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    optionChip: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    livePreviewCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#3b82f6',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    liveOptionChip: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#93c5fd',
    },
    centerParams: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addDraftBtn: {
        backgroundColor: '#3b82f6',
        borderRadius: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10
    },
    draftRowCard: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 4,
        borderLeftColor: '#673ab7', // Primary accent
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        position: 'relative',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    removeRowBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 4
    }
});

export default FieldBuilderPanel;
