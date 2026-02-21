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
            options: []
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
                    options: f.options ? f.options.filter(o => o.label && o.value) : []
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
            {/* Top Section: Module Head / Section Name */}
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
                                if (readOnly) return;
                                if (!moduleId) {
                                    Alert.alert('Attention', 'Please select a Module Name first.');
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
                            {!!(!readOnly) && <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />}
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
                        {!!(!readOnly) && (
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
                        {(() => {
                            const visibleSections = sections.filter(s =>
                                s.name.toLowerCase().includes(sectionSearchQuery.toLowerCase())
                            );

                            if (visibleSections.length === 0 && sectionSearchQuery) {
                                return <Menu.Item title="No matching sections" disabled />;
                            }

                            return visibleSections.map(s => (
                                <Menu.Item
                                    key={s.id}
                                    onPress={() => {
                                        setSelectedSection(s);
                                        setShowSectionMenu(false);
                                        setSectionSearchQuery('');
                                    }}
                                    title={s.name}
                                />
                            ));
                        })()}
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

            <Divider style={{ marginVertical: 20, backgroundColor: '#e2e8f0' }} />

            {/* Wizard Step Indicator */}
            {!readOnly && (
                <View style={styles.wizardIndicator}>
                    {[
                        { id: 1, title: 'Field Configuration', icon: 'playlist-edit' },
                        { id: 2, title: 'Field Preview', icon: 'eye-outline' }
                    ].map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <TouchableOpacity
                                style={[styles.stepItem, wizardStep === step.id && styles.stepItemActive]}
                                onPress={() => setWizardStep(step.id)}
                            >
                                <View style={[styles.stepIcon, wizardStep === step.id && styles.stepIconActive]}>
                                    <MaterialCommunityIcons
                                        name={step.icon}
                                        size={20}
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

            <View style={[styles.contentRow, !selectedSection && { opacity: 0.5 }]}>
                {/* Step 1: Configuration Form */}
                {(!readOnly && wizardStep === 1) && (
                    <View style={styles.wizardStepContent} pointerEvents={!selectedSection ? 'none' : 'auto'}>

                        {/* --- MODE SWITCH: EDIT vs MULTI-DRAFT --- */}
                        {editingFieldId ? (
                            <View style={{ flex: 1, flexDirection: 'column' }}>
                                <Text style={styles.columnTitle}>Edit Field</Text>

                                {/* Scrollable Form Content */}
                                <ScrollView
                                    style={{ flex: 1 }}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                    contentContainerStyle={{ paddingBottom: 16 }}
                                >
                                    {/* Row 1: Label & Key */}
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Field Label</Text>
                                            <TextInput
                                                mode="outlined"
                                                value={fieldLabel}
                                                onChangeText={handleLabelChange}
                                                style={styles.input}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                dense
                                                disabled={!selectedSection}
                                                placeholder="e.g. Client Name"
                                                placeholderTextColor="#94a3b8"
                                            />
                                        </View>

                                    </View>

                                    {/* Row 2: Type & Sort Order */}
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Field Type</Text>
                                            <Menu
                                                visible={showTypeMenu}
                                                onDismiss={() => setShowTypeMenu(false)}
                                                anchor={
                                                    <TouchableOpacity
                                                        style={styles.typeDropdown}
                                                        onPress={() => selectedSection && setShowTypeMenu(true)}
                                                        disabled={!selectedSection}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <MaterialCommunityIcons
                                                                name={currentType.icon}
                                                                size={18}
                                                                color={!selectedSection ? '#94a3b8' : '#475569'}
                                                                style={{ marginRight: 8 }}
                                                            />
                                                            <Text style={{ fontSize: 14, color: !selectedSection ? '#94a3b8' : '#0f172a' }}>
                                                                {currentType.label}
                                                            </Text>
                                                        </View>
                                                        <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
                                                    </TouchableOpacity>
                                                }
                                                contentStyle={{ backgroundColor: 'white', maxHeight: 300 }}
                                            >
                                                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true}>
                                                    {FIELD_TYPES.map(t => (
                                                        <Menu.Item
                                                            key={t.value}
                                                            onPress={() => {
                                                                setFieldType(t.value);
                                                                setShowTypeMenu(false);
                                                            }}
                                                            title={t.label}
                                                            leadingIcon={t.icon}
                                                        />
                                                    ))}
                                                </ScrollView>
                                            </Menu>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Sort Order</Text>
                                            <TextInput
                                                mode="outlined"
                                                value={sortOrder}
                                                onChangeText={setSortOrder}
                                                keyboardType="numeric"
                                                style={styles.input}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                dense
                                                disabled={!selectedSection}
                                            />
                                        </View>

                                        {/* Inline File Options Button */}
                                        {['file', 'image', 'signature'].includes(currentType.value) && (
                                            <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 2 }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        openFileConfigDialog('edit', -1, placeholder);
                                                    }}
                                                    style={{ height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, borderStyle: 'dashed' }}
                                                >
                                                    <MaterialCommunityIcons name="cog" size={16} color="#3b82f6" />
                                                    <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>
                                                        {placeholder && placeholder.startsWith("JSON:") ? "Edit Options" : "Add Options"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>

                                    {/* Row 3: Placeholder */}
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={styles.fieldLabel}>Placeholder / Helper Text</Text>
                                        {/* File options moved inline above */}
                                        {!['file', 'image', 'signature'].includes(currentType.value) && (
                                            <TextInput
                                                mode="outlined"
                                                value={placeholder}
                                                onChangeText={setPlaceholder}
                                                style={styles.input}
                                                outlineColor="#e2e8f0"
                                                activeOutlineColor="#3b82f6"
                                                dense
                                                disabled={!selectedSection}
                                                placeholder="e.g. Enter client name"
                                                placeholderTextColor="#94a3b8"
                                            />
                                        )}
                                        {/* Enabled Fields Preview Removed */}
                                    </View>

                                    {/* Row 4: Options Configuration (Conditional) */}
                                    {['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(currentType.value) && (
                                        <View style={{ marginBottom: 24, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 8 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Field Options</Text>
                                                <Button mode="text" padding={0} onPress={() => setFieldOptions([...fieldOptions, { label: '', value: '' }])}>
                                                    + Add Option
                                                </Button>
                                            </View>

                                            {fieldOptions.map((opt, index) => (
                                                <View key={index} style={{ flexDirection: 'row', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                                                    <TextInput
                                                        mode="outlined"
                                                        placeholder="Label (e.g. High)"
                                                        value={opt.label}
                                                        onChangeText={(txt) => {
                                                            const prevOption = fieldOptions[index];
                                                            const newOpts = [...fieldOptions];
                                                            // Clone the item
                                                            newOpts[index] = { ...prevOption, label: txt };

                                                            // Check if we should auto-update the value
                                                            const oldSlugLower = (prevOption.label || '').toLowerCase().replace(/\s+/g, '_');
                                                            const oldSlugUpper = (prevOption.label || '').toUpperCase().replace(/\s+/g, '_');
                                                            const currentVal = prevOption.value || '';

                                                            if (!currentVal || currentVal === oldSlugLower || currentVal === oldSlugUpper) {
                                                                newOpts[index].value = txt.toLowerCase().replace(/\s+/g, '_');
                                                            }

                                                            setFieldOptions(newOpts);
                                                        }}
                                                        style={[styles.input, { flex: 1, height: 40 }]}
                                                        dense
                                                        outlineColor="#cbd5e1"
                                                    />
                                                    <TextInput
                                                        mode="outlined"
                                                        placeholder="Value (e.g. HIGH)"
                                                        value={opt.value}
                                                        onChangeText={(txt) => {
                                                            const newOpts = [...fieldOptions];
                                                            newOpts[index].value = txt;
                                                            setFieldOptions(newOpts);
                                                        }}
                                                        style={[styles.input, { flex: 1, height: 40 }]}
                                                        dense
                                                        outlineColor="#cbd5e1"
                                                    />
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <IconButton
                                                            icon="plus"
                                                            size={20}
                                                            iconColor="#3b82f6"
                                                            onPress={() => {
                                                                const newOpts = [...fieldOptions];
                                                                newOpts.splice(index + 1, 0, { label: '', value: '' });
                                                                setFieldOptions(newOpts);
                                                            }}
                                                        />
                                                        <IconButton
                                                            icon="close-circle-outline"
                                                            size={20}
                                                            iconColor="#ef4444"
                                                            onPress={() => {
                                                                const newOpts = fieldOptions.filter((_, i) => i !== index);
                                                                setFieldOptions(newOpts);
                                                            }}
                                                        />
                                                    </View>
                                                </View>
                                            ))}
                                            {fieldOptions.length === 0 && (
                                                <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>No options defined yet.</Text>
                                            )}
                                        </View>
                                    )}

                                    {/* Row 5: Toggles */}
                                    <View style={styles.toggleRow}>
                                        <View style={styles.toggleItem}>
                                            <Text style={styles.toggleLabel}>Required</Text>
                                            <Switch
                                                value={isRequired}
                                                onValueChange={setIsRequired}
                                                color="#3b82f6"
                                                disabled={!selectedSection}
                                            />
                                        </View>
                                        <View style={styles.toggleItem}>
                                            <Text style={styles.toggleLabel}>Active</Text>
                                            <Switch
                                                value={isActive}
                                                onValueChange={setIsActive}
                                                color="#3b82f6"
                                                disabled={!selectedSection}
                                            />
                                        </View>
                                    </View>
                                </ScrollView>

                                {/* Fixed Button Bar at Bottom */}
                                <View style={{
                                    flexDirection: 'row',
                                    gap: 12,
                                    paddingTop: 16,
                                    paddingBottom: 8,
                                    borderTopWidth: 1,
                                    borderTopColor: '#e2e8f0',
                                    backgroundColor: '#ffffff'
                                }}>
                                    <Button
                                        mode="outlined"
                                        onPress={resetForm}
                                        style={{ flex: 1, borderColor: '#cbd5e1' }}
                                        textColor="#64748b"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={handleSaveField}
                                        loading={submitting}
                                        style={[styles.saveButton, { flex: 2 }]}
                                        labelStyle={{ fontSize: 14, fontWeight: 'bold' }}
                                        contentStyle={{ height: 44 }}
                                        disabled={!selectedSection}
                                    >
                                        Update
                                    </Button>
                                </View>
                            </View>
                        ) : (
                            /* --- NEW MULTI-DRAFT ADD MODE --- */
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <Text style={[styles.columnTitle, { marginBottom: 0 }]}>
                                        {selectedSection ? `Add New Field to: ${selectedSection.name}` : 'Field Configuration'}
                                    </Text>
                                    {selectedSection && (
                                        <TouchableOpacity onPress={addDraftRow} style={styles.addDraftBtn}>
                                            <MaterialCommunityIcons name="plus" size={20} color="white" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <ScrollView
                                    style={{ flex: 1 }}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                    contentContainerStyle={{ paddingBottom: 100 }}
                                >
                                    {draftFields.map((draft, idx) => {
                                        const dType = FIELD_TYPES.find(t => t.value === draft.field_type) || FIELD_TYPES[0];
                                        return (
                                            <View key={draft._tempId || idx} style={styles.draftRowCard}>
                                                <TouchableOpacity style={styles.removeRowBtn} onPress={() => removeDraftRow(idx)}>
                                                    <MaterialCommunityIcons name="close" size={16} color="#ef4444" />
                                                </TouchableOpacity>

                                                {/* Row 1: Label & Key */}
                                                <View style={styles.inputRow}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.fieldLabel}>Field Label</Text>
                                                        <TextInput
                                                            mode="outlined"
                                                            value={draft.label}
                                                            onChangeText={(txt) => updateDraftRow(idx, 'label', txt)}
                                                            style={styles.input}
                                                            dense
                                                            outlineColor="#cbd5e1"
                                                            placeholder="e.g. Phone Number"
                                                            placeholderTextColor="#94a3b8"
                                                        />
                                                    </View>

                                                </View>

                                                {/* Row 2: Type & Sort & Config */}
                                                <View style={styles.inputRow}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.fieldLabel}>Type</Text>
                                                        <Menu
                                                            visible={activeTypeMenuIndex === idx}
                                                            onDismiss={() => setActiveTypeMenuIndex(null)}
                                                            anchor={
                                                                <TouchableOpacity
                                                                    style={styles.typeDropdown}
                                                                    onPress={() => setActiveTypeMenuIndex(idx)}
                                                                >
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                        <MaterialCommunityIcons name={dType.icon} size={18} color="#475569" style={{ marginRight: 8 }} />
                                                                        <Text>{dType.label}</Text>
                                                                    </View>
                                                                    <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
                                                                </TouchableOpacity>
                                                            }
                                                        >
                                                            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                                                                {FIELD_TYPES.map(t => (
                                                                    <Menu.Item
                                                                        key={t.value}
                                                                        onPress={() => {
                                                                            updateDraftRow(idx, 'field_type', t.value);
                                                                            setActiveTypeMenuIndex(null);
                                                                        }}
                                                                        title={t.label}
                                                                        leadingIcon={t.icon}
                                                                    />
                                                                ))}
                                                            </ScrollView>
                                                        </Menu>
                                                    </View>
                                                    <View style={{ flex: 0.6 }}>
                                                        <Text style={styles.fieldLabel}>Sort</Text>
                                                        <TextInput
                                                            mode="outlined"
                                                            value={String(draft.sort_order)}
                                                            onChangeText={(txt) => updateDraftRow(idx, 'sort_order', txt)}
                                                            keyboardType="numeric"
                                                            style={styles.input}
                                                            dense
                                                            outlineColor="#cbd5e1"
                                                        />
                                                    </View>

                                                    {/* File Fetching UI */}


                                                    {/* File Config Button inline */}
                                                    {['file', 'image', 'signature'].includes(draft.field_type) && (
                                                        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 2 }}>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    openFileConfigDialog('draft', idx, draft.placeholder);
                                                                }}
                                                                style={{ height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, borderStyle: 'dashed' }}
                                                            >
                                                                <MaterialCommunityIcons name="cog" size={16} color="#3b82f6" />
                                                                <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>
                                                                    File Configuration
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Row 3: Placeholder (Hidden for file types) */}
                                                {!['file', 'image', 'signature'].includes(draft.field_type) && (
                                                    <View style={{ marginBottom: 12 }}>
                                                        <Text style={styles.fieldLabel}>Placeholder</Text>
                                                        <TextInput
                                                            mode="outlined"
                                                            value={draft.placeholder}
                                                            onChangeText={(txt) => updateDraftRow(idx, 'placeholder', txt)}
                                                            style={styles.input}
                                                            dense
                                                            outlineColor="#cbd5e1"
                                                            placeholder="e.g. 050-1234567"
                                                            placeholderTextColor="#94a3b8"
                                                        />
                                                    </View>
                                                )}

                                                {/* File Configuration Preview */}
                                                {/* Files Preview Removed */}


                                                {/* Row 4: Options */}
                                                {['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(draft.field_type) && (
                                                    <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                            <Text style={[styles.fieldLabel, { marginBottom: 0, fontSize: 11 }]}>OPTIONS</Text>
                                                            <TouchableOpacity onPress={() => {
                                                                const newOpts = [...(draft.options || []), { label: '', value: '' }];
                                                                updateDraftRow(idx, 'options', newOpts);
                                                            }}>
                                                                <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>+ Add Option</Text>
                                                            </TouchableOpacity>
                                                        </View>

                                                        {(draft.options || []).map((opt, oIdx) => (
                                                            <View key={oIdx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                                                <TextInput
                                                                    placeholder="Label"
                                                                    value={opt.label}
                                                                    onChangeText={(t) => handleDraftOptionChange(idx, oIdx, 'label', t)}
                                                                    style={[styles.input, { flex: 1, height: 36, fontSize: 13 }]}
                                                                    dense
                                                                    mode="outlined"
                                                                    outlineColor="#cbd5e1"
                                                                />
                                                                <TextInput
                                                                    placeholder="Value"
                                                                    value={opt.value}
                                                                    onChangeText={(t) => handleDraftOptionChange(idx, oIdx, 'value', t)}
                                                                    style={[styles.input, { flex: 1, height: 36, fontSize: 13 }]}
                                                                    dense
                                                                    mode="outlined"
                                                                    outlineColor="#cbd5e1"
                                                                />
                                                                <TouchableOpacity onPress={() => {
                                                                    const newOpts = [...draft.options];
                                                                    newOpts.splice(oIdx, 1);
                                                                    updateDraftRow(idx, 'options', newOpts);
                                                                }}>
                                                                    <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}

                                                {/* Row 5: Toggles */}
                                                <View style={styles.toggleRow}>
                                                    <View style={styles.toggleItem}>
                                                        <Text style={styles.toggleLabel}>Required</Text>
                                                        <Switch value={draft.is_required} onValueChange={(v) => updateDraftRow(idx, 'is_required', v)} color="#3b82f6" />
                                                    </View>
                                                    <View style={styles.toggleItem}>
                                                        <Text style={styles.toggleLabel}>Active</Text>
                                                        <Switch value={draft.is_active} onValueChange={(v) => updateDraftRow(idx, 'is_active', v)} color="#3b82f6" />
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>

                                {!readOnly && (
                                    <Button
                                        mode="contained"
                                        onPress={handleSaveAllDrafts}
                                        loading={submitting}
                                        style={[styles.saveButton, { marginTop: 16 }]}
                                        labelStyle={{ fontWeight: 'bold' }}
                                        disabled={!selectedSection || draftFields.length === 0}
                                    >
                                        Save All Fields
                                    </Button>
                                )}
                            </View>
                        )}

                        {!readOnly && (
                            <View style={styles.wizardNav}>
                                <Text style={styles.wizardHint}>Setup your fields, then click Next to preview them.</Text>
                                <Button
                                    mode="contained"
                                    icon="arrow-right"
                                    contentStyle={{ flexDirection: 'row-reverse' }}
                                    onPress={() => setWizardStep(2)}
                                    style={{ backgroundColor: '#1e293b' }}
                                >
                                    Next: Preview
                                </Button>
                            </View>
                        )}
                    </View>
                )}

                {/* Step 2: Preview Area (Always show if readOnly, otherwise only in Step 2) */}
                {(readOnly || wizardStep === 2) && (
                    <View style={[styles.wizardStepContent, !selectedSection && { opacity: 0.8 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={[styles.columnTitle, { marginBottom: 0 }]}>
                                {readOnly ? 'Section Structure' : 'Section Fields Preview'}
                            </Text>
                            {!readOnly && (
                                <Button
                                    mode="outlined"
                                    onPress={() => setWizardStep(1)}
                                    icon="arrow-left"
                                    compact
                                    labelStyle={{ fontSize: 12 }}
                                >
                                    Back to Config
                                </Button>
                            )}
                        </View>
                        <View style={styles.previewBox}><ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true} contentContainerStyle={{ paddingBottom: 100 }}>
                            {/* Live Preview Card - Shows current single-edit form state */}
                            {!!(selectedSection && fieldLabel && editingFieldId) && (
                                <View style={styles.livePreviewCard}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                    <Text style={{ fontSize: 10, color: '#3b82f6', fontWeight: 'bold' }}>
                                                        EDITING
                                                    </Text>
                                                </View>
                                                <MaterialCommunityIcons
                                                    name={currentType.icon}
                                                    size={16}
                                                    color="#3b82f6"
                                                />
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1e293b' }}>
                                                    {fieldLabel || 'Untitled Field'}
                                                </Text>
                                                {!!isRequired && (
                                                    <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                                                        <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>REQ</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                                                {currentType.label}
                                            </Text>
                                            {['file', 'image', 'signature'].includes(currentType.value) ? (
                                                (() => {
                                                    const config = (placeholder && placeholder.startsWith("JSON:")) ? parseFileConfig(placeholder) : {};
                                                    return (
                                                        <View style={{ marginTop: 8 }}>
                                                            <View style={{ padding: 8, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                <MaterialCommunityIcons name={currentType.icon} size={20} color="#94a3b8" />
                                                                <Text style={{ color: '#64748b', fontSize: 12 }}>Upload File Area</Text>
                                                            </View>
                                                            {(config.expiry || config.startDate || config.endDate) && (
                                                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                                                    {config.startDate && (
                                                                        <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>START DATE</Text>
                                                                            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                    {config.endDate && (
                                                                        <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>END DATE</Text>
                                                                            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                    {config.expiry && (
                                                                        <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>EXPIRY DATE</Text>
                                                                            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            )}
                                                        </View>
                                                    );
                                                })()
                                            ) : (
                                                !!placeholder && (
                                                    <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                                                        Placeholder: "{placeholder}"
                                                    </Text>
                                                )
                                            )}
                                        </View>
                                    </View>
                                    {/* Live Preview Options for Edit Mode */}
                                    {['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(currentType.value) &&
                                        fieldOptions.filter(o => o.label && o.value).length > 0 && (
                                            <View style={{ marginTop: 12, backgroundColor: '#eff6ff', padding: 8, borderRadius: 6 }}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#3b82f6', marginBottom: 6, letterSpacing: 0.5 }}>
                                                    OPTIONS:
                                                </Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                    {fieldOptions.filter(o => o.label && o.value).map((opt, idx) => (
                                                        <View key={idx} style={styles.liveOptionChip}>
                                                            <Text style={{ fontSize: 11, color: '#1e40af' }}>
                                                                {opt.label}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                </View>
                            )}

                            {/* --- DRAFT FIELDS PREVIEW (Multi-Row Mode) --- */}
                            {!!draftFields.length && (
                                <View style={{ marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase' }}>
                                            New Drafts ({draftFields.length})
                                        </Text>
                                        <View style={{ height: 1, flex: 1, backgroundColor: '#fcd34d' }} />
                                    </View>

                                    {draftFields.map((draft, idx) => {
                                        const dType = FIELD_TYPES.find(t => t.value === draft.field_type) || FIELD_TYPES[0];
                                        return (
                                            <View key={draft._tempId || idx} style={[styles.previewCard, { borderColor: '#fcd34d', backgroundColor: '#fffbeb' }]}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                            <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1e293b' }}>{draft.label || '(No Label)'}</Text>
                                                            {!!draft.is_required && <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>REQ</Text></View>}
                                                            <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ fontSize: 10, color: '#d97706', fontWeight: 'bold' }}>NEW</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                                                            {dType.label}
                                                        </Text>
                                                        {['file', 'image', 'signature'].includes(draft.field_type) && (() => {
                                                            const config = (draft.placeholder && draft.placeholder.startsWith("JSON:")) ? parseFileConfig(draft.placeholder) : {};
                                                            return (
                                                                <View style={{ marginTop: 6 }}>
                                                                    <View style={{ padding: 6, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                        <MaterialCommunityIcons name={dType.icon} size={16} color="#94a3b8" />
                                                                        <Text style={{ color: '#64748b', fontSize: 11 }}>Upload Area</Text>
                                                                    </View>
                                                                    {(config.expiry || config.startDate || config.endDate) && (
                                                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                                                            {config.startDate && (
                                                                                <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>START DATE</Text>
                                                                                    <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                        <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                                    </View>
                                                                                </View>
                                                                            )}
                                                                            {config.endDate && (
                                                                                <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>END DATE</Text>
                                                                                    <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                        <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                                    </View>
                                                                                </View>
                                                                            )}
                                                                            {config.expiry && (
                                                                                <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>EXPIRY DATE</Text>
                                                                                    <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                        <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                                    </View>
                                                                                </View>
                                                                            )}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            );
                                                        })()}
                                                    </View>
                                                </View>
                                                {/* Draft Options Preview */}
                                                {(['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(draft.field_type) && draft.options && draft.options.length > 0) && (
                                                    <View style={{ marginTop: 12, backgroundColor: '#fff7ed', padding: 8, borderRadius: 6 }}>
                                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#d97706', marginBottom: 6, letterSpacing: 0.5 }}>OPTIONS:</Text>
                                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                            {draft.options.map((opt, oIdx) => (
                                                                <View key={oIdx} style={[styles.optionChip, { backgroundColor: 'white', borderColor: '#fdba74' }]}>
                                                                    <Text style={{ fontSize: 11, color: '#9a3412' }}>
                                                                        {opt.label || '...'}
                                                                    </Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Saved Fields Divider */}
                            {!!fields.length && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 8 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                                        Saved Fields
                                    </Text>
                                    <View style={{ height: 1, flex: 1, backgroundColor: '#e2e8f0' }} />
                                </View>
                            )}

                            {/* Saved Fields */}
                            {fields.length === 0 && draftFields.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>
                                        {!selectedSection ? 'Select a section to view fields.' : 'No fields yet.'}
                                    </Text>
                                </View>
                            ) : (
                                fields.map(field => (
                                    <View key={field.id} style={styles.previewCard}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1e293b' }}>{field.label}</Text>
                                                    {!!field.is_required && <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>REQ</Text></View>}
                                                </View>
                                                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                                                    {field.field_type}
                                                </Text>
                                                {['file', 'image', 'signature'].includes(field.field_type) && (() => {
                                                    const config = (field.placeholder && field.placeholder.startsWith("JSON:")) ? parseFileConfig(field.placeholder) : {};
                                                    return (
                                                        <View style={{ marginTop: 6 }}>
                                                            <View style={{ padding: 6, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                <MaterialCommunityIcons name={field.field_type === 'image' ? 'image-outline' : field.field_type === 'signature' ? 'draw' : 'file-upload-outline'} size={16} color="#94a3b8" />
                                                                <Text style={{ color: '#64748b', fontSize: 11 }}>Upload Area</Text>
                                                            </View>
                                                            {(config.expiry || config.startDate || config.endDate) && (
                                                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                                                    {config.startDate && (
                                                                        <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>START DATE</Text>
                                                                            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                    {config.endDate && (
                                                                        <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>END DATE</Text>
                                                                            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                    {config.expiry && (
                                                                        <View style={{ flexGrow: 1, flexBasis: '45%' }}>
                                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>EXPIRY DATE</Text>
                                                                            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 12, height: 40, justifyContent: 'center', backgroundColor: '#fff' }}>
                                                                                <Text style={{ color: '#cbd5e1', fontSize: 13 }}>YYYY-MM-DD</Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            )}
                                                        </View>
                                                    );
                                                })()}
                                            </View>

                                            {/* Action Buttons - HIDE IF READ ONLY */}
                                            {!readOnly && (
                                                <View style={{ flexDirection: 'row', gap: 0 }}>
                                                    <IconButton
                                                        icon="pencil-outline"
                                                        size={18}
                                                        iconColor="#64748b"
                                                        style={{ margin: 0, width: 32, height: 32 }}
                                                        onPress={() => handleEdit(field)}
                                                    />
                                                    <IconButton
                                                        icon="trash-can-outline"
                                                        size={18}
                                                        iconColor="#ef4444"
                                                        style={{ margin: 0, width: 32, height: 32 }}
                                                        onPress={() => handleDeleteField(field)}
                                                    />
                                                </View>
                                            )}
                                        </View>

                                        {/* Render Options Preview if applicable */}
                                        {!!(['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(field.field_type) && field.options && field.options.length > 0) && (
                                            <View style={{ marginTop: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6 }}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 6, letterSpacing: 0.5 }}>OPTIONS:</Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                    {field.options.map((opt, idx) => (
                                                        <View key={idx} style={styles.optionChip}>
                                                            <Text style={{ fontSize: 11, color: '#475569' }}>
                                                                {opt.option_label || opt.label}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        </View>
                    </View>
                )}
            </View>
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
        paddingTop: 40, // Increased top spacing
    },
    // Top Section
    sectionHeader: {
        marginBottom: 0,
        paddingHorizontal: 32,
        paddingTop: 16, // Added spacing from top
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
        borderColor: '#cbd5e1',
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
    },
    dropdownText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
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
        paddingTop: 8,
        paddingHorizontal: 32,
        paddingBottom: 24,
    },
    wizardStepContent: {
        flex: 1,
        height: '100%',
        overflow: 'hidden',
    },
    wizardIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginBottom: 20,
        gap: 12,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
    },
    stepItemActive: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIconActive: {
        backgroundColor: '#3b82f6',
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    stepTitleActive: {
        color: '#1e40af',
    },
    stepConnector: {
        width: 40,
        height: 2,
        backgroundColor: '#e2e8f0',
    },
    wizardNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        marginTop: 16,
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
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700', // Bold labels
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        backgroundColor: 'white',
        height: 44, // Compact but accessible
        fontSize: 14,
    },
    typeDropdown: {
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        paddingHorizontal: 12,
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
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        width: '100%',
        elevation: 0,
        height: 44,
        justifyContent: 'center',
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
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        position: 'relative',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
