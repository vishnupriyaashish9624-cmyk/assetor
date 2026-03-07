import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import {
    Text, Button, List, IconButton, Title, Portal, Modal, TextInput,
    useTheme, DataTable, Switch, ActivityIndicator, Chip, Card, Surface
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';

const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width > 768;

const ModuleDetailsScreen = ({ route, navigation }) => {
    const { moduleId, moduleName } = route.params;
    const theme = useTheme();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection state for Two-Pane Layout
    const [selectedSectionId, setSelectedSectionId] = useState(null);

    // Section Modal
    const [sectionModalVisible, setSectionModalVisible] = useState(false);
    const [sectionName, setSectionName] = useState('');
    const [editingSectionId, setEditingSectionId] = useState(null);

    // Field Modal
    const [fieldModalVisible, setFieldModalVisible] = useState(false);
    const [currentSectionId, setCurrentSectionId] = useState(null);
    const [editingFieldId, setEditingFieldId] = useState(null);
    const [fieldForm, setFieldForm] = useState({
        label: '',
        field_key: '',
        field_type: 'text',
        required: false,
        placeholder: '',
        help_text: '',
        options: [], // for select/radio
        meta: {} // for min/max/unit etc
    });

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/module-builder/${moduleId}/sections`);
            const data = response.data.data;
            setSections(data);
            if (data.length > 0 && !selectedSectionId) {
                setSelectedSectionId(data[0].id);
            }
        } catch (error) {
            console.error('Fetch sections error:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Section Actions ---
    const handleSaveSection = async () => {
        try {
            if (editingSectionId) {
                await api.put(`/module-builder/sections/${editingSectionId}`, { name: sectionName, sort_order: 0 });
            } else {
                await api.post(`/module-builder/${moduleId}/sections`, { name: sectionName, sort_order: sections.length + 1 });
            }
            setSectionModalVisible(false);
            setSectionName('');
            setEditingSectionId(null);
            fetchSections();
        } catch (error) {
            console.error('Save section error:', error);
        }
    };

    const handleDeleteSection = async (id) => {
        if (!confirm('Delete this section and all its fields?')) return;
        try {
            await api.delete(`/module-builder/sections/${id}`);
            fetchSections();
            if (selectedSectionId === id) setSelectedSectionId(null);
        } catch (error) {
            console.error('Delete section error:', error);
        }
    };

    // --- Field Actions ---
    const openAddField = (sectionId) => {
        setCurrentSectionId(sectionId);
        setEditingFieldId(null);
        setFieldForm({
            label: '',
            field_key: '',
            field_type: 'text',
            required: false,
            placeholder: '',
            help_text: '',
            options: [],
            meta: {}
        });
        setFieldModalVisible(true);
    };

    const openEditField = (sectionId, field) => {
        setCurrentSectionId(sectionId);
        setEditingFieldId(field.id);
        setFieldForm({
            label: field.label,
            field_key: field.field_key,
            field_type: field.field_type,
            required: !!field.required,
            placeholder: field.meta_json?.placeholder || '',
            help_text: field.meta_json?.help_text || '',
            options: field.options_json || [],
            meta: field.meta_json || {}
        });
        setFieldModalVisible(true);
    };

    const handleSaveField = async () => {
        try {
            const payload = {
                ...fieldForm,
                meta: {
                    ...fieldForm.meta,
                    placeholder: fieldForm.placeholder,
                    help_text: fieldForm.help_text
                }
            };
            if (editingFieldId) {
                await api.put(`/module-builder/fields/${editingFieldId}`, payload);
            } else {
                await api.post(`/module-builder/sections/${currentSectionId}/fields`, payload);
            }
            setFieldModalVisible(false);
            fetchSections();
        } catch (error) {
            console.error('Save field error:', error);
        }
    };

    const handleDeleteField = async (id) => {
        if (!confirm('Delete this field?')) return;
        try {
            await api.delete(`/module-builder/fields/${id}`);
            fetchSections();
        } catch (error) {
            console.error('Delete field error:', error);
        }
    };

    const addOption = () => {
        setFieldForm({ ...fieldForm, options: [...fieldForm.options, { label: '', value: '' }] });
    };

    const updateOption = (index, key, value) => {
        const newOptions = [...fieldForm.options];
        newOptions[index][key] = value;
        setFieldForm({ ...fieldForm, options: newOptions });
    };

    const removeOption = (index) => {
        setFieldForm({ ...fieldForm, options: fieldForm.options.filter((_, i) => i !== index) });
    };

    const slugify = (text) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '_')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const onLabelChange = (text) => {
        if (!editingFieldId) {
            setFieldForm({ ...fieldForm, label: text, field_key: slugify(text) });
        } else {
            setFieldForm({ ...fieldForm, label: text });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                    <View>
                        <Text style={styles.title}>{moduleName}</Text>
                        <Text style={styles.subtitle}>Form Builder</Text>
                    </View>
                </View>
                <Button mode="contained" icon="plus" onPress={() => { setEditingSectionId(null); setSectionName(''); setSectionModalVisible(true); }}>
                    Add Section
                </Button>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} color={theme.colors.primary} />
            ) : (
                <View style={[styles.builderContainer, !isDesktop && { flexDirection: 'column' }]}>

                    {/* LEFT PANEL: Sections List */}
                    <View style={[styles.leftPanel, !isDesktop && { width: '100%', marginBottom: 16 }]}>
                        <Surface style={styles.panelSurface}>
                            <View style={styles.panelHeader}>
                                <Text style={styles.panelTitle}>Sections</Text>
                            </View>
                            <ScrollView>
                                {sections.map((section, idx) => (
                                    <TouchableOpacity
                                        key={section.id}
                                        style={[
                                            styles.sectionItem,
                                            selectedSectionId === section.id && styles.sectionItemSelected
                                        ]}
                                        onPress={() => setSelectedSectionId(section.id)}
                                    >
                                        <Text style={[styles.sectionName, selectedSectionId === section.id && { color: '#3b82f6', fontWeight: 'bold' }]}>
                                            {idx + 1}. {section.name}
                                        </Text>
                                        <View style={{ flexDirection: 'row' }}>
                                            <IconButton icon="pencil" size={16} onPress={() => { setEditingSectionId(section.id); setSectionName(section.name); setSectionModalVisible(true); }} />
                                            <IconButton icon="delete" size={16} iconColor="#ef4444" onPress={() => handleDeleteSection(section.id)} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                {sections.length === 0 && (
                                    <Text style={styles.emptyText}>No sections. Add one to start.</Text>
                                )}
                            </ScrollView>
                        </Surface>
                    </View>

                    {/* RIGHT PANEL: Fields List */}
                    <View style={styles.rightPanel}>
                        {selectedSectionId ? (
                            <Surface style={styles.panelSurface}>
                                <View style={styles.panelHeader}>
                                    <View>
                                        <Text style={styles.panelTitle}>
                                            Fields in "{sections.find(s => s.id === selectedSectionId)?.name || 'Section'}"
                                        </Text>
                                    </View>
                                    <Button mode="outlined" icon="plus" onPress={() => openAddField(selectedSectionId)}>Add Field</Button>
                                </View>

                                <ScrollView>
                                    <DataTable>
                                        <DataTable.Header>
                                            <DataTable.Title>Label</DataTable.Title>
                                            <DataTable.Title>Type</DataTable.Title>
                                            <DataTable.Title>Required</DataTable.Title>
                                            <DataTable.Title>Options</DataTable.Title>
                                            <DataTable.Title numeric>Actions</DataTable.Title>
                                        </DataTable.Header>

                                        {(() => {
                                            const section = sections.find(s => s.id === selectedSectionId);
                                            if (!section || !section.fields) return null;

                                            return section.fields.map((field) => (
                                                <DataTable.Row key={field.id}>
                                                    <DataTable.Cell style={{ flex: 2 }}>
                                                        <View>
                                                            <Text style={{ fontWeight: '500' }}>{field.label}</Text>
                                                            <Text style={{ fontSize: 11, color: '#94A3B8' }}>{field.field_key}</Text>
                                                        </View>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell>
                                                        <Chip style={styles.typeChip} textStyle={{ fontSize: 10 }}>{field.field_type}</Chip>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell>{field.required ? 'Yes' : 'No'}</DataTable.Cell>
                                                    <DataTable.Cell>
                                                        {field.options && field.options.length > 0 ? (
                                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                                                {field.options.map((opt, i) => (
                                                                    <Chip key={i} style={{ height: 20 }} textStyle={{ fontSize: 9 }}>{opt.option_label}</Chip>
                                                                ))}
                                                            </View>
                                                        ) : (
                                                            <Text style={{ fontSize: 11, color: '#94a3b8' }}>-</Text>
                                                        )}
                                                    </DataTable.Cell>
                                                    <DataTable.Cell numeric>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            <IconButton icon="pencil" size={18} onPress={() => openEditField(selectedSectionId, field)} />
                                                            <IconButton icon="trash-can-outline" iconColor="#ef4444" size={18} onPress={() => handleDeleteField(field.id)} />
                                                        </View>
                                                    </DataTable.Cell>
                                                </DataTable.Row>
                                            ))
                                        })()}

                                        {(!sections.find(s => s.id === selectedSectionId)?.fields?.length) ? (
                                            <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>No fields in this section.</Text>
                                            </View>
                                        ) : null}
                                    </DataTable>
                                </ScrollView>
                            </Surface>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="arrow-left" size={32} color="#CBD5E1" />
                                <Text style={styles.emptyText}>Select a section to view fields</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Section Modal */}
            <Portal>
                <Modal visible={sectionModalVisible} onDismiss={() => setSectionModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <Title>{editingSectionId ? 'Edit Section' : 'Add Section'}</Title>
                    <TextInput
                        label="Section Name"
                        value={sectionName}
                        onChangeText={setSectionName}
                        mode="outlined"
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setSectionModalVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleSaveSection} disabled={!sectionName}>Save Section</Button>
                    </View>
                </Modal>
            </Portal>

            {/* Field Builder Modal */}
            <Portal>
                <Modal visible={fieldModalVisible} onDismiss={() => setFieldModalVisible(false)} contentContainerStyle={[styles.modalContent, styles.fieldModal]}>
                    <Title>{editingFieldId ? 'Edit Field' : 'Add Field'}</Title>
                    <ScrollView style={{ maxHeight: '80vh' }} showsVerticalScrollIndicator={false}>
                        <View style={styles.fieldGrid}>
                            <View style={styles.fieldCol}>
                                <TextInput label="Field Label*" value={fieldForm.label} onChangeText={onLabelChange} mode="outlined" style={styles.input} />
                                <TextInput label="Field Key*" value={fieldForm.field_key} onChangeText={text => setFieldForm({ ...fieldForm, field_key: text })} mode="outlined" style={styles.input} disabled={!!editingFieldId} />
                            </View>
                            <View style={styles.fieldCol}>
                                <View style={styles.pickerContainer}>
                                    <Text style={styles.label}>Field Type</Text>
                                    <View style={styles.fakePicker}>
                                        <Text>{fieldForm.field_type}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={20} />
                                    </View>
                                    <View style={styles.typeRow}>
                                        {['text', 'textarea', 'number', 'date', 'select', 'radio', 'switch', 'file_pdf', 'currency', 'phone', 'email', 'auto_generated'].map(t => (
                                            <Chip
                                                key={t}
                                                selected={fieldForm.field_type === t}
                                                onPress={() => setFieldForm({ ...fieldForm, field_type: t })}
                                                style={styles.selectableChip}
                                            >
                                                {t}
                                            </Chip>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.switchRow}>
                            <Text>Mark as Required</Text>
                            <Switch value={fieldForm.required} onValueChange={v => setFieldForm({ ...fieldForm, required: v })} />
                        </View>

                        {fieldForm.field_type === 'auto_generated' && (
                            <View style={{ marginBottom: 16 }}>
                                <View style={{ padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <MaterialCommunityIcons name="information" size={16} color="#16a34a" />
                                        <Text style={{ fontSize: 13, color: '#16a34a', fontWeight: 'bold' }}>AUTO-ID CONFIGURATION</Text>
                                    </View>
                                    <View style={{ marginTop: 8 }}>
                                        <Text style={{ fontSize: 11, color: '#15803d', marginBottom: 4 }}>This field will automatically generate sequential IDs based on the module type.</Text>
                                        <Text style={{ fontSize: 14, color: '#15803d', fontWeight: '700' }}>
                                            Format: {"{PREFIX}"}-{moduleId === '1' ? 'PR' : (moduleId === '2' ? 'VH' : (moduleName || 'AS').substring(0, 2).toUpperCase())}-YY-MM-DD-{"{XXX}"}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
                                            Example: COMP-{moduleId === '1' ? 'PR' : (moduleId === '2' ? 'VH' : (moduleName || 'AS').substring(0, 2).toUpperCase())}-26-02-26-100
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        {fieldForm.field_type !== 'auto_generated' && (
                            <TextInput label="Placeholder" value={fieldForm.placeholder} onChangeText={t => setFieldForm({ ...fieldForm, placeholder: t })} mode="outlined" style={styles.input} />
                        )}
                        <TextInput label="Help Text" value={fieldForm.help_text} onChangeText={t => setFieldForm({ ...fieldForm, help_text: t })} mode="outlined" style={styles.input} />

                        {fieldForm.field_type === 'number' && (
                            <View style={styles.metaBox}>
                                <Text style={styles.label}>Number Constraints</Text>
                                <View style={styles.fieldGrid}>
                                    <TextInput label="Min" value={fieldForm.meta.min} onChangeText={t => setFieldForm({ ...fieldForm, meta: { ...fieldForm.meta, min: t } })} mode="outlined" style={[styles.input, { flex: 1 }]} keyboardType="numeric" />
                                    <TextInput label="Max" value={fieldForm.meta.max} onChangeText={t => setFieldForm({ ...fieldForm, meta: { ...fieldForm.meta, max: t } })} mode="outlined" style={[styles.input, { flex: 1 }]} keyboardType="numeric" />
                                    <TextInput label="Unit (sqm, kW..)" value={fieldForm.meta.unit} onChangeText={t => setFieldForm({ ...fieldForm, meta: { ...fieldForm.meta, unit: t } })} mode="outlined" style={[styles.input, { flex: 1 }]} />
                                </View>
                            </View>
                        )}

                        {['select', 'radio'].includes(fieldForm.field_type) && (
                            <View style={styles.metaBox}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.label}>Options List</Text>
                                    <Button compact icon="plus" onPress={addOption}>Add Option</Button>
                                </View>
                                {fieldForm.options.map((opt, i) => (
                                    <View key={i} style={styles.optionRow}>
                                        <TextInput label="Label" value={opt.label} onChangeText={t => updateOption(i, 'label', t)} style={{ flex: 1 }} dense />
                                        <TextInput label="Value" value={opt.value} onChangeText={t => updateOption(i, 'value', t)} style={{ flex: 1 }} dense />
                                        <IconButton icon="close-circle" iconColor="#ef4444" onPress={() => removeOption(i)} />
                                    </View>
                                ))}
                                {fieldForm.options.length === 0 && <Text style={styles.helperText}>No options added yet.</Text>}
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <Button onPress={() => setFieldModalVisible(false)}>Cancel</Button>
                            <Button mode="contained" onPress={handleSaveField} disabled={!fieldForm.label || !fieldForm.field_key}>Save Field</Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    builderContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 24,
    },
    leftPanel: {
        width: 300,
        backgroundColor: 'transparent',
    },
    rightPanel: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    panelSurface: {
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 1,
        flex: 1,
        padding: 16,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    panelTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    sectionItem: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionItemSelected: {
        backgroundColor: '#EFF6FF',
    },
    sectionName: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    typeChip: {
        height: 20,
        backgroundColor: '#F1F5F9',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 30,
        margin: 20,
        borderRadius: 16,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    fieldModal: {
        maxWidth: 700,
    },
    input: {
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    fieldGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 16,
    },
    fieldCol: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    typeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
        marginBottom: 16,
    },
    selectableChip: {
        marginBottom: 4,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    metaBox: {
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    helperText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        marginTop: 8
    }
});

export default ModuleDetailsScreen;
