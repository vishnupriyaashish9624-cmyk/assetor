import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, IconButton, Divider, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FieldAdvancedConfigDialog = ({ visible, onDismiss, onSave, initialData = {} }) => {
    const [options, setOptions] = useState([{ label: '', value: '' }]);
    const [placeholder, setPlaceholder] = useState('');
    const [fieldKey, setFieldKey] = useState('');
    const [type, setType] = useState('');

    useEffect(() => {
        if (visible) {
            setOptions(initialData.options?.length > 0 ? [...initialData.options] : [{ label: '', value: '' }]);
            setPlaceholder(initialData.placeholder || '');
            setFieldKey(initialData.field_key || '');
            setType(initialData.field_type || '');
        }
    }, [visible, initialData]);

    const addOption = () => {
        setOptions([...options, { label: '', value: '' }]);
    };

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions.length > 0 ? newOptions : [{ label: '', value: '' }]);
    };

    const updateOption = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index][field] = value;

        if (field === 'label') {
            const autoValue = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (!newOptions[index].value || newOptions[index].value === (newOptions[index]._prevLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '_')) {
                newOptions[index].value = autoValue;
            }
            newOptions[index]._prevLabel = value;
        }
        setOptions(newOptions);
    };

    const handleSave = () => {
        onSave({
            options: ['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(type) ? options.filter(o => o.label.trim() !== '') : [],
        });
    };

    const showOptions = ['dropdown', 'radio', 'checkbox', 'select', 'multiselect'].includes(type);

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#673ab7" style={{ marginRight: 12 }} />
                        <Text style={styles.title}>Manage Options</Text>
                    </View>
                    <IconButton icon="close" size={20} onPress={onDismiss} />
                </View>

                <Divider />

                <ScrollView style={styles.content}>
                    {showOptions ? (
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.label}>Options / Choices</Text>
                            <Text style={styles.helperText}>Define the choices available for this field.</Text>

                            <View style={{ marginTop: 10 }}>
                                {options.map((opt, idx) => (
                                    <View key={idx} style={styles.optionRow}>
                                        <View style={{ flex: 1.5 }}>
                                            <TextInput
                                                label="Label"
                                                value={opt.label}
                                                onChangeText={(t) => updateOption(idx, 'label', t)}
                                                mode="outlined"
                                                dense
                                                style={styles.input}
                                                outlineStyle={{ borderRadius: 8 }}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <TextInput
                                                label="Value"
                                                value={opt.value}
                                                onChangeText={(t) => updateOption(idx, 'value', t)}
                                                mode="outlined"
                                                dense
                                                style={styles.input}
                                                outlineStyle={{ borderRadius: 8 }}
                                            />
                                        </View>
                                        <IconButton
                                            icon="trash-can-outline"
                                            iconColor="#ef4444"
                                            size={20}
                                            onPress={() => removeOption(idx)}
                                        />
                                    </View>
                                ))}
                                <Button
                                    mode="text"
                                    onPress={addOption}
                                    icon="plus"
                                    contentStyle={{ alignSelf: 'flex-start' }}
                                    textColor="#673ab7"
                                >
                                    Add Option
                                </Button>
                            </View>
                        </View>
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#64748b' }}>No options required for this field type.</Text>
                        </View>
                    )}
                </ScrollView>

                <Divider />

                <View style={styles.actions}>
                    <Button onPress={onDismiss} textColor="#64748b">Cancel</Button>
                    <Button mode="contained" onPress={handleSave} buttonColor="#673ab7" style={styles.saveButton}>
                        Done
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
        borderRadius: 16,
        maxWidth: 500,
        alignSelf: 'center',
        width: '90%',
        maxHeight: '80%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 6
    },
    helperText: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
        alignItems: 'center'
    },
    input: {
        backgroundColor: '#fff',
        fontSize: 13
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        gap: 12,
        backgroundColor: '#f8fafc'
    },
    saveButton: {
        borderRadius: 8,
        paddingHorizontal: 8
    }
});

export default FieldAdvancedConfigDialog;
