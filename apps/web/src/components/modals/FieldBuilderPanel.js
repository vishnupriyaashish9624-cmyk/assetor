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

const FieldBuilderPanel = ({ moduleId, moduleName, readOnly = false, initialSectionName = null, onClose = null }) => {
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

    // Options Configuration state for draft fields
    const [optionsConfigVisible, setOptionsConfigVisible] = useState(false);
    const [optionsConfigTarget, setOptionsConfigTarget] = useState(-1); // Index in draftFields
    const [optionsConfigData, setOptionsConfigData] = useState([]);

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
    const [draftFields, setDraftFields] = useState([]);
    const [activeTypeMenuIndex, setActiveTypeMenuIndex] = useState(null);
    const [expandedOptionsIdx, setExpandedOptionsIdx] = useState(null);

    const toggleOptionsEditor = (index) => {
        setExpandedOptionsIdx(expandedOptionsIdx === index ? null : index);
    };

    const addFieldOption = (fieldIdx) => {
        const newDrafts = [...draftFields];
        const currentOptions = newDrafts[fieldIdx].options || [];
        newDrafts[fieldIdx].options = [...currentOptions, { label: '', value: '' }];
        setDraftFields(newDrafts);
    };

    const removeFieldOption = (fieldIdx, optIdx) => {
        const newDrafts = [...draftFields];
        newDrafts[fieldIdx].options = newDrafts[fieldIdx].options.filter((_, i) => i !== optIdx);
        setDraftFields(newDrafts);
    };

    const updateFieldOption = (fieldIdx, optIdx, field, value) => {
        const newDrafts = [...draftFields];
        const newOptions = [...newDrafts[fieldIdx].options];
        newOptions[optIdx][field] = value;

        if (field === 'label') {
            const autoValue = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (!newOptions[optIdx].value || newOptions[optIdx].value === (newOptions[optIdx]._prevLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '_')) {
                newOptions[optIdx].value = autoValue;
            }
            newOptions[optIdx]._prevLabel = value;
        }

        newDrafts[fieldIdx].options = newOptions;
        setDraftFields(newDrafts);
    };

    useEffect(() => {
        if (!editingFieldId && selectedSection && draftFields.length === 0) {
            addDraftRow();
        }
    }, [selectedSection, editingFieldId]);

    const addDraftRow = () => {
        const nextSort = fields.length + draftFields.length + 1;
        setDraftFields(prev => [...prev, {
            _tempId: Date.now() + Math.random(),
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
        if (key === 'label') {
            const currentKey = newDrafts[index].field_key;
            const prevLabel = newDrafts[index]._prevLabel || '';
            if (!currentKey || currentKey === generateKey(prevLabel)) {
                newDrafts[index].field_key = generateKey(value);
            }
            newDrafts[index]._prevLabel = value;
        }
        setDraftFields(newDrafts);
    };

    const handleSaveAllDrafts = async () => {
        const conflicts = [];
        for (let i = 0; i < draftFields.length; i++) {
            const f = draftFields[i];
            if (!f.label || !f.field_key) {
                showAlert('Validation Error', `Row ${i + 1} is missing Label or Key.`, 'warning');
                return;
            }
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
            setDraftFields([]);
            fetchFields(selectedSection.id);
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
                const sortedSections = res.data.data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
                setSections(sortedSections);
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
        setFieldOptions([{ label: '', value: '' }]);
        setIdPrefix('');
        setEditingFieldId(null);
    };

    const handleEdit = (field) => {
        if (readOnly) return; // Don't allow entering edit mode if readOnly
        setFieldLabel(field.label);
        setFieldKey(field.field_key);
        setFieldType(field.field_type);
        setPlaceholder(field.placeholder || '');
        setIsRequired(!!field.is_required);
        setIsActive(!!field.is_active);
        setSortOrder(String(field.sort_order));
        if (field.options && field.options.length > 0) {
            setFieldOptions(field.options.map(o => ({ label: o.option_label || o.label, value: o.option_value || o.value })));
        } else {
            setFieldOptions([{ label: '', value: '' }]);
        }
        if (field.meta_json) {
            try {
                const meta = typeof field.meta_json === 'string' ? JSON.parse(field.meta_json) : field.meta_json;
                setIdPrefix(meta.id_code || '');
            } catch (e) { console.error(e); }
        } else { setIdPrefix(''); }
        setEditingFieldId(field.id);
        setWizardStep(1); // Switch to configuration step to show edit form
    };

    const generateKey = (label) => label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const handleLabelChange = (text) => {
        setFieldLabel(text);
        if (!editingFieldId && (!fieldKey || fieldKey === generateKey(fieldLabel))) {
            setFieldKey(generateKey(text));
        }
    };

    const handleSaveField = async () => {
        if (!fieldLabel || !fieldKey || !selectedSection) {
            showAlert('Missing Data', 'Please fill in required fields', 'warning');
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
                options: fieldOptions.filter(o => o.label && o.value),
                meta_json: fieldType === 'auto_generated' ? { id_code: idPrefix } : null
            };
            let res = editingFieldId ? await api.put(`module-builder/fields/${editingFieldId}`, payload) : await api.post('module-builder/fields', payload);
            if (res.data.success) {
                showAlert('Success', 'Field saved.', 'success');
                resetForm();
                fetchFields(selectedSection.id);
            }
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to save field.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const performDelete = async (field) => {
        try {
            await api.delete(`module-builder/fields/${field.id}`);
            fetchFields(selectedSection.id);
            if (editingFieldId === field.id) resetForm();
        } catch (error) { console.error(error); }
    };

    const handleDeleteField = (field) => {
        showConfirm('Confirm Delete', `Delete "${field.label}"?`, () => performDelete(field), true);
    };

    const currentType = FIELD_TYPES.find(t => t.value === fieldType) || FIELD_TYPES[0];

    return (
        <View style={styles.container}>
            {/* 1. MODULE STRUCTURE SECTION */}
            <View style={styles.sectionGrouping}>
                <View style={styles.graySectionHeader}>
                    <Text style={styles.graySectionHeaderText}>MODULE STRUCTURE</Text>
                </View>

                <View style={styles.sectionBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>{moduleName || 'Module'}</Text>
                        <MaterialCommunityIcons name="chevron-up" size={24} color="#64748b" />
                    </View>

                    <Menu
                        visible={showSectionMenu}
                        onDismiss={() => { setShowSectionMenu(false); setSectionSearchQuery(''); }}
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
                                    <View style={styles.folderIconContainer}>
                                        <MaterialCommunityIcons name="folder-outline" size={18} color="#673ab7" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.dropdownText, (!moduleId || readOnly) && { color: '#64748b' }]}>
                                            {selectedSection ? selectedSection.name : (moduleId ? 'Select a section...' : 'Select a module above first')}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        }
                        contentStyle={{ backgroundColor: 'white', width: 400 }}
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
                                        onPress={() => { setShowSectionMenu(false); setShowAddSectionModal(true); }}
                                        title="Add New Section..."
                                        titleStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                    />
                                    <Divider />
                                </>
                            )}
                            {sections
                                .filter(s => s.name.toLowerCase().includes(sectionSearchQuery.toLowerCase()))
                                .map(s => (
                                    <Menu.Item key={s.id} onPress={() => { setSelectedSection(s); setShowSectionMenu(false); setSectionSearchQuery(s.name); }} title={s.name} />
                                ))
                            }
                        </ScrollView>
                    </Menu>

                    <View style={styles.structureControlsRow}>
                        <View style={styles.wizardPillContainer}>
                            <TouchableOpacity style={[styles.wizardPill, wizardStep === 1 && styles.wizardPillActive]} onPress={() => setWizardStep(1)}>
                                {wizardStep === 1 && <MaterialCommunityIcons name="sparkles" size={14} color="#fff" style={{ marginRight: 6 }} />}
                                <Text style={[styles.wizardPillText, wizardStep === 1 && styles.wizardPillTextActive]}>Configuration</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.wizardPill, wizardStep === 2 && styles.wizardPillActive]} onPress={() => setWizardStep(2)}>
                                {wizardStep === 2 && <MaterialCommunityIcons name="check" size={14} color="#fff" style={{ marginRight: 6 }} />}
                                <Text style={[styles.wizardPillText, wizardStep === 2 && styles.wizardPillTextActive]}>Preview & Manage</Text>
                            </TouchableOpacity>
                        </View>
                        {!editingFieldId && !readOnly && (
                            <Button mode="contained" icon="plus" onPress={addDraftRow} buttonColor="#673ab7" style={styles.addFieldButton} contentStyle={{ paddingHorizontal: 16 }} labelStyle={{ fontWeight: 'bold' }}>Add Field</Button>
                        )}
                    </View>
                </View>
            </View>

            <ModuleSectionFormModal visible={showAddSectionModal} onClose={() => setShowAddSectionModal(false)} onSave={handleQuickAddSection} section={null} initialModuleId={moduleId} />

            <View style={[styles.contentRow, (!selectedSection || loadingSections) && { opacity: 0.5 }]}>
                {(wizardStep === 1) ? (
                    <View style={styles.wizardStepContent} pointerEvents={!selectedSection ? 'none' : 'auto'}>
                        {editingFieldId ? (
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
                                                    {FIELD_TYPES
                                                        .filter(t => t.value !== 'auto_generated' || String(moduleId) === '1')
                                                        .map(t => (
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
                                            <Text style={styles.fieldLabel}>ID Prefix / Code</Text>
                                            <TextInput mode="outlined" value={idPrefix} onChangeText={setIdPrefix} style={styles.input} outlineStyle={{ borderRadius: 12 }} placeholder="e.g. VH" />
                                        </View>
                                    ) : (
                                        ['file', 'image', 'signature'].includes(currentType.value) ? (
                                            <TouchableOpacity onPress={() => openFileConfigDialog('edit', -1, placeholder)} style={{ marginBottom: 20, padding: 16, backgroundColor: '#eff6ff', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#bfdbfe', flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                                <MaterialCommunityIcons name="cog-outline" size={24} color="#3b82f6" />
                                                <View><Text style={{ color: '#1e40af', fontWeight: 'bold' }}>Configuration Options</Text></View>
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
                                            <Button mode="text" onPress={() => setFieldOptions([...fieldOptions, { label: '', value: '' }])}>+ Add Option</Button>
                                            {fieldOptions.map((opt, idx) => (
                                                <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                                                    <TextInput placeholder="Label" value={opt.label} onChangeText={(t) => {
                                                        const newOpts = [...fieldOptions];
                                                        newOpts[idx].label = t;
                                                        setFieldOptions(newOpts);
                                                    }} style={{ flex: 1, height: 40 }} dense mode="outlined" />
                                                    <IconButton icon="close-circle" iconColor="#ef4444" size={20} onPress={() => setFieldOptions(fieldOptions.filter((_, i) => i !== idx))} />
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    <View style={styles.toggleRow}>
                                        <View style={styles.toggleItem}><Text style={styles.toggleLabel}>Required</Text><Switch value={isRequired} onValueChange={setIsRequired} color="#673ab7" /></View>
                                        <View style={styles.toggleItem}><Text style={styles.toggleLabel}>Active</Text><Switch value={isActive} onValueChange={setIsActive} color="#673ab7" /></View>
                                    </View>
                                </ScrollView>
                                <View style={{ paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', gap: 12 }}>
                                    <Button mode="outlined" style={{ flex: 1, borderRadius: 12 }} onPress={resetForm}>Cancel</Button>
                                    <Button mode="contained" style={{ flex: 2, borderRadius: 12 }} buttonColor="#673ab7" loading={submitting} onPress={handleSaveField}>Save Changes</Button>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.wizardStepContent}>
                                <View style={styles.tableHeaderRow}><Text style={styles.columnTitleSmall}>NEW FIELDS</Text></View>
                                <View style={styles.fieldsTable}>
                                    <View style={styles.tableHeader}>
                                        <View style={{ width: 40 }} />
                                        <Text style={[styles.headerCell, { flex: 3 }]}>Field Label</Text>
                                        <Text style={[styles.headerCell, { flex: 2 }]}>Type</Text>
                                        <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Required</Text>
                                        <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Active</Text>
                                        <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>Sort</Text>
                                        <View style={{ width: 80 }} />
                                        <View style={{ width: 12 }} /> {/* Scrollbar spacer */}
                                    </View>
                                    <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 200 }}>
                                        {draftFields.length === 0 ? (
                                            <View style={styles.emptyTableState}><Text style={styles.emptyTableText}>No new fields added.</Text></View>
                                        ) : (
                                            draftFields.map((draft, idx) => (
                                                <View key={draft._tempId || idx}>
                                                    <View style={styles.tableRow}>
                                                        <View style={{ width: 40, alignItems: 'center' }}>
                                                            <IconButton
                                                                icon="pencil-outline"
                                                                size={18}
                                                                iconColor="#94a3b8"
                                                                onPress={() => { /* No longer used for advanced config */ }}
                                                                style={{ margin: 0 }}
                                                            />
                                                        </View>
                                                        <View style={{ flex: 3, paddingRight: 10 }}>

                                                            <NativeTextInput
                                                                value={draft.label}
                                                                onChangeText={(t) => updateDraftRow(idx, 'label', t)}
                                                                placeholder="Label"
                                                                style={styles.tableInput}
                                                            />
                                                        </View>
                                                        <View style={{ flex: 2, paddingRight: 10 }}>
                                                            <Menu
                                                                visible={activeTypeMenuIndex === idx}
                                                                onDismiss={() => setActiveTypeMenuIndex(null)}
                                                                anchor={
                                                                    <TouchableOpacity style={styles.tableTypeSelect} onPress={() => setActiveTypeMenuIndex(idx)}>
                                                                        <MaterialCommunityIcons name={(FIELD_TYPES.find(t => t.value === draft.field_type) || FIELD_TYPES[0]).icon} size={14} color="#64748b" style={{ marginRight: 4 }} />
                                                                        <Text style={[styles.tableTypeText, { fontSize: 11 }]} numberOfLines={1}>{(FIELD_TYPES.find(t => t.value === draft.field_type) || FIELD_TYPES[0]).label}</Text>
                                                                        <MaterialCommunityIcons name="chevron-down" size={14} color="#94a3b8" />
                                                                    </TouchableOpacity>
                                                                }
                                                            >
                                                                <ScrollView style={{ maxHeight: 200 }}>
                                                                    {FIELD_TYPES.map(t => (<Menu.Item key={t.value} title={t.label} leadingIcon={t.icon} onPress={() => { updateDraftRow(idx, 'field_type', t.value); setActiveTypeMenuIndex(null); }} />))}
                                                                </ScrollView>
                                                            </Menu>
                                                        </View>
                                                        <View style={{ flex: 1, alignItems: 'center' }}><Switch value={draft.is_required} onValueChange={(v) => updateDraftRow(idx, 'is_required', v)} color="#673ab7" style={{ transform: [{ scale: 0.75 }] }} /></View>
                                                        <View style={{ flex: 1, alignItems: 'center' }}><Switch value={draft.is_active} onValueChange={(v) => updateDraftRow(idx, 'is_active', v)} color="#673ab7" style={{ transform: [{ scale: 0.75 }] }} /></View>
                                                        <View style={{ flex: 0.8, alignItems: 'center' }}>
                                                            <NativeTextInput
                                                                value={String(draft.sort_order)}
                                                                onChangeText={(t) => updateDraftRow(idx, 'sort_order', t)}
                                                                keyboardType="numeric"
                                                                style={[styles.tableInput, { width: 40, textAlign: 'center' }]}
                                                            />
                                                        </View>
                                                        <View style={[styles.tableRowActions, { width: 80, gap: 4 }]}>
                                                            {['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(draft.field_type) && (
                                                                <IconButton
                                                                    icon={draft.options?.length > 0 ? "playlist-check" : "playlist-plus"}
                                                                    size={16}
                                                                    onPress={() => toggleOptionsEditor(idx)}
                                                                    iconColor={draft.options?.length > 0 ? "#22c55e" : "#f97316"}
                                                                    style={{ margin: 0, backgroundColor: draft.options?.length > 0 ? '#f0fdf4' : '#fff7ed' }}
                                                                />
                                                            )}
                                                            <IconButton icon="close" size={16} iconColor="#ef4444" onPress={() => removeDraftRow(idx)} style={{ margin: 0, backgroundColor: '#fff1f2' }} />
                                                        </View>
                                                    </View>

                                                    {/* Inline Options Editor */}
                                                    {expandedOptionsIdx === idx && ['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(draft.field_type) && (
                                                        <View style={styles.inlineOptionsContainer}>
                                                            <View style={styles.inlineOptionsHeader}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                    <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#673ab7" style={{ marginRight: 8 }} />
                                                                    <Text style={styles.inlineOptionsTitle}>CONFIGURE FIELD CHOICES</Text>
                                                                </View>
                                                                <Button
                                                                    mode="contained"
                                                                    onPress={() => addFieldOption(idx)}
                                                                    icon="plus"
                                                                    buttonColor="#673ab7"
                                                                    labelStyle={{ fontSize: 10, fontWeight: 'bold' }}
                                                                    compact
                                                                    style={{ borderRadius: 6, height: 28 }}
                                                                >
                                                                    Add Option
                                                                </Button>
                                                            </View>

                                                            <View style={styles.inlineOptionsList}>
                                                                {(draft.options || []).map((opt, optIdx) => (
                                                                    <View key={optIdx} style={styles.inlineOptionWrapper}>
                                                                        <View style={styles.inlineOptionRow}>
                                                                            <View style={{ flex: 1, paddingRight: 10 }}>
                                                                                <Text style={styles.miniLabel}>LABEL</Text>
                                                                                <NativeTextInput
                                                                                    placeholder="Option label..."
                                                                                    value={opt.label}
                                                                                    onChangeText={(t) => updateFieldOption(idx, optIdx, 'label', t)}
                                                                                    style={styles.premiumInlineInput}
                                                                                />
                                                                            </View>
                                                                            <View style={{ flex: 1, paddingRight: 10 }}>
                                                                                <Text style={styles.miniLabel}>VALUE</Text>
                                                                                <NativeTextInput
                                                                                    placeholder="system_value"
                                                                                    value={opt.value}
                                                                                    onChangeText={(t) => updateFieldOption(idx, optIdx, 'value', t)}
                                                                                    style={styles.premiumInlineInput}
                                                                                />
                                                                            </View>
                                                                            <TouchableOpacity
                                                                                style={styles.removeOptionBtn}
                                                                                onPress={() => removeFieldOption(idx, optIdx)}
                                                                            >
                                                                                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    </View>
                                                                ))}

                                                                {(draft.options || []).length === 0 && (
                                                                    <View style={styles.inlineEmptyState}>
                                                                        <MaterialCommunityIcons name="playlist-remove" size={32} color="#cbd5e1" />
                                                                        <Text style={styles.inlineEmptyText}>No choices defined yet. Click "Add Option" to begin.</Text>
                                                                    </View>
                                                                )}
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
                ) : (
                    <View style={styles.wizardStepContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.columnTitle}>Preview & Management</Text>
                            {!readOnly && <Button mode="outlined" onPress={() => setWizardStep(1)}>Back</Button>}
                        </View>
                        <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 100 }}>
                            {fields.map(field => (
                                <View key={field.id} style={styles.previewCard}>
                                    <Text style={{ fontWeight: 'bold' }}>{field.label}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <IconButton icon="pencil-outline" size={20} onPress={() => handleEdit(field)} />
                                        <IconButton icon="trash-can-outline" size={20} iconColor="#ef4444" onPress={() => handleDeleteField(field)} />
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {!readOnly && (
                <View style={styles.stableFooterFixed}>
                    <View style={styles.footerInnerFixed}>
                        <Button mode="outlined" onPress={onClose}>Close</Button>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {wizardStep === 1 && !editingFieldId && (
                                <Button mode="contained" onPress={handleSaveAllDrafts} loading={submitting} disabled={draftFields.length === 0}>Save</Button>
                            )}
                            <Button mode="outlined" onPress={onClose}>Cancel</Button>
                        </View>
                    </View>
                </View>
            )}

            <AlertDialog visible={alertConfig.visible} onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} />
            <ConfirmDialog visible={confirmConfig.visible} onDismiss={() => setConfirmConfig({ ...confirmConfig, visible: false })} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} danger={confirmConfig.danger} />
            <FileConfigDialog visible={fileConfigDialogVisible} onDismiss={() => setFileConfigDialogVisible(false)} onSave={handleFileConfigSave} initialConfig={currentFileConfig} />
        </View>

    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 24 },
    sectionGrouping: { marginHorizontal: 32, marginBottom: 24, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
    graySectionHeader: { backgroundColor: '#f8fafc', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
    graySectionHeaderText: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1.2 },
    sectionBody: { padding: 16 },
    folderIconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center' },
    sectionDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, height: 52, paddingHorizontal: 16, backgroundColor: '#f8fafc' },
    dropdownText: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
    searchBar: { elevation: 0, backgroundColor: 'transparent', borderRadius: 0 },
    structureControlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    wizardPillContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4 },
    wizardPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    wizardPillActive: { backgroundColor: '#673ab7' },
    wizardPillText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
    wizardPillTextActive: { color: '#fff' },
    addFieldButton: { borderRadius: 10, height: 44 },
    contentRow: { flex: 1, paddingHorizontal: 32, paddingBottom: 80 },
    wizardStepContent: { flex: 1, paddingTop: 12 },
    tableHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    columnTitleSmall: { fontSize: 12, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
    inlineOptionsContainer: {
        backgroundColor: '#f1f5f9',
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: -8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1
    },
    inlineOptionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    inlineOptionsTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
        letterSpacing: 1
    },
    inlineOptionsList: {
        gap: 10
    },
    inlineOptionWrapper: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    inlineOptionRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    miniLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginBottom: 4,
        letterSpacing: 0.5
    },
    premiumInlineInput: {
        fontSize: 13,
        paddingVertical: 6,
        paddingHorizontal: 8,
        color: '#1e293b',
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 36
    },
    removeOptionBtn: {
        height: 36,
        width: 36,
        borderRadius: 8,
        backgroundColor: '#fff1f1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineEmptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20
    },
    inlineEmptyText: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 8,
        fontWeight: '500'
    },
    fieldsTable: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerCell: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tableInput: { height: 38, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, fontSize: 13 },
    tableTypeSelect: { height: 38, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#fff' },
    tableTypeText: { flex: 1, fontSize: 12, color: '#1e293b', marginLeft: 6 },
    tableRowActions: { width: 100, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    emptyTableState: { padding: 60, alignItems: 'center', justifyContent: 'center' },
    emptyTableText: { marginTop: 12, color: '#94a3b8', fontSize: 14 },
    stableFooterFixed: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 16, paddingHorizontal: 32, zIndex: 100 },
    footerInnerFixed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    columnTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#fff', marginBottom: 16 },
    inputRow: { flexDirection: 'row', gap: 16 },
    typeDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, height: 52, paddingHorizontal: 16, backgroundColor: '#fff', marginBottom: 16 },
    toggleRow: { flexDirection: 'row', gap: 24, marginTop: 8 },
    toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    toggleLabel: { fontSize: 14, color: '#475569' },
    previewCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
});

export default FieldBuilderPanel;
