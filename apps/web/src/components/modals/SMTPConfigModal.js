import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseModal from './BaseModal';

const SMTPConfigModal = ({ visible, onClose, onSave, config = null }) => {
    const isEditing = !!config;

    const [formData, setFormData] = useState({
        name: '',
        host: '',
        port: '587',
        username: '',
        password: '',
        encryption: 'tls',
        from_email: '',
        from_name: '',
        reply_to: '',
        is_active: true,
        debug_mode: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (config) {
            setFormData({
                name: config.name || '',
                host: config.host || '',
                port: String(config.port || '587'),
                username: config.username || '',
                password: config.password || '',
                encryption: config.encryption || 'tls',
                from_email: config.from_email || '',
                from_name: config.from_name || '',
                reply_to: config.reply_to || '',
                is_active: config.is_active || false,
                debug_mode: config.debug_mode || false,
            });
        }
    }, [config]);

    const handleSave = async () => {
        if (!formData.name || !formData.host || !formData.username || !formData.password || !formData.from_email) {
            setError('Please fill all required fields');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal
            visible={visible}
            onClose={onClose}
            title={isEditing ? 'Edit SMTP Configuration' : 'New SMTP Configuration'}
            width={800}
        >
            <View style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 600 }}>
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>General Information</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 16 }]}>
                            <Text style={styles.label}>Configuration Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholder="e.g. Gmail SMTP"
                                autoComplete="off"
                            />
                        </View>
                        <View style={[styles.formGroup, { width: 150 }]}>
                            <Text style={styles.label}>Status</Text>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: formData.is_active ? '#10b981' : '#6b7280' }]}>
                                    {formData.is_active ? 'Active' : 'Inactive'}
                                </Text>
                                <Switch
                                    value={formData.is_active}
                                    onValueChange={(val) => setFormData({ ...formData, is_active: val })}
                                    trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                                    thumbColor={formData.is_active ? "#3b82f6" : "#f1f5f9"}
                                    style={{ transform: [{ scale: 0.8 }], marginLeft: 'auto' }}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 2, marginRight: 16 }]}>
                            <Text style={styles.label}>SMTP Host *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.host}
                                onChangeText={(text) => setFormData({ ...formData, host: text })}
                                placeholder="smtp.example.com"
                                autoComplete="off"
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>SMTP Port *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.port}
                                onChangeText={(text) => setFormData({ ...formData, port: text })}
                                placeholder="587"
                                keyboardType="numeric"
                                autoComplete="off"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 16 }]}>
                            <Text style={styles.label}>SMTP Username *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: '#f0f9ff' }]}
                                value={formData.username}
                                onChangeText={(text) => setFormData({ ...formData, username: text })}
                                placeholder="noreply@example.com"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>SMTP Password *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: '#f0f9ff' }]}
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                                placeholder="••••••••"
                                secureTextEntry
                                autoComplete="password"
                            />
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Sender Details</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 16 }]}>
                            <Text style={styles.label}>From Email *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.from_email}
                                onChangeText={(text) => setFormData({ ...formData, from_email: text })}
                                placeholder="noreply@example.com"
                                keyboardType="email-address"
                                autoComplete="off"
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>From Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.from_name}
                                onChangeText={(text) => setFormData({ ...formData, from_name: text })}
                                placeholder="e.g. My Company"
                                autoComplete="off"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 16 }]}>
                            <Text style={styles.label}>Reply To Address</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.reply_to}
                                onChangeText={(text) => setFormData({ ...formData, reply_to: text })}
                                placeholder="support@example.com"
                                keyboardType="email-address"
                                autoComplete="off"
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Security Protocol</Text>
                            <View style={styles.radioGroup}>
                                {['tls', 'ssl', 'none'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.radioBtn, formData.encryption === type && styles.radioBtnActive]}
                                        onPress={() => setFormData({ ...formData, encryption: type })}
                                    >
                                        <Text style={[styles.radioText, formData.encryption === type && styles.radioTextActive]}>
                                            {type.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { width: 150 }]}>
                            <Text style={styles.label}>Debug Mode</Text>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: formData.debug_mode ? '#10b981' : '#6b7280' }]}>
                                    {formData.debug_mode ? 'Enabled' : 'Disabled'}
                                </Text>
                                <Switch
                                    value={formData.debug_mode}
                                    onValueChange={(val) => setFormData({ ...formData, debug_mode: val })}
                                    trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                                    thumbColor={formData.debug_mode ? "#3b82f6" : "#f1f5f9"}
                                    style={{ transform: [{ scale: 0.8 }], marginLeft: 'auto' }}
                                />
                            </View>
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.createBtn, loading && styles.disabledBtn]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.createText}>{isEditing ? 'Update Configuration' : 'Create Configuration'}</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </BaseModal>

    );
};

const styles = StyleSheet.create({
    container: { padding: 8 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        color: '#111827',
    },
    row: { flexDirection: 'row', marginBottom: 8 },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        height: 42,
        paddingHorizontal: 8,
    },
    statusText: { fontSize: 13, fontWeight: '500', marginRight: 8 },

    sectionHeader: {
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginTop: 8,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cancelText: { color: '#6b7280', fontWeight: '500' },
    createBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 6,
    },
    disabledBtn: { backgroundColor: '#93c5fd' },
    createText: { color: 'white', fontWeight: '500' },

    errorBox: {
        backgroundColor: '#fef2f2',
        padding: 10,
        borderRadius: 6,
        marginBottom: 16,
    },
    errorText: { color: '#ef4444', fontSize: 12 },

    radioGroup: { flexDirection: 'row', gap: 8 },
    radioBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },
    radioBtnActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    radioText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
    radioTextActive: { color: '#3b82f6', fontWeight: 'bold' },
});

export default SMTPConfigModal;
