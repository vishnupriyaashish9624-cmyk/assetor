import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Switch, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseModal from './BaseModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const MODULES = [
    { name: 'Dashboard', key: 'dashboard' },
    { name: 'Premises', key: 'assetdisplay' },
    { name: 'Vehicles', key: 'vehicledisplay' },
    { name: 'Employees', key: 'employees' },
    { name: 'Maintenance', key: 'maintenance' },
    { name: 'Reports', key: 'reports' },
    { name: 'Module Configuration', key: 'moduleshome' }
];

const RoleFormModal = ({ visible, onClose, onSave, role = null, readOnly = false }) => {
    const [formData, setFormData] = useState({
        role_name: '',
        description: '',
        is_active: true,
        permissions: MODULES.map(m => ({
            module_name: m.key,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_approve: false
        }))
    });

    const [loading, setLoading] = useState(false);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (role && visible) {
            fetchRoleDetails(role.id);
        } else {
            setFormData({
                role_name: '',
                description: '',
                is_active: true,
                permissions: MODULES.map(m => ({
                    module_name: m.key,
                    can_view: false,
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: false
                }))
            });
            setAssignedUsers([]);
        }
    }, [role, visible]);

    const fetchRoleDetails = async (id) => {
        setFetchingDetails(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/roles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const data = response.data.data;
                // Merge fetched permissions with all modules (to handle new modules added later)
                const mergedPermissions = MODULES.map(m => {
                    const existing = (data.permissions && Array.isArray(data.permissions))
                        ? data.permissions.find(p => p.module_name === m.key)
                        : null;
                    return existing || {
                        module_name: m.key,
                        can_view: false,
                        can_create: false,
                        can_edit: false,
                        can_delete: false,
                        can_approve: false
                    };
                });
                setFormData({
                    role_name: data.role_name,
                    description: data.description || '',
                    is_active: data.is_active,
                    permissions: mergedPermissions
                });
                setAssignedUsers(data.users || []);
            }
        } catch (err) {
            console.error('Error fetching role details:', err);
            setError('Failed to load role details');
        } finally {
            setFetchingDetails(false);
        }
    };

    const handlePermissionChange = (moduleKey, field, value) => {
        if (readOnly) return;
        const newPermissions = formData.permissions.map(p => {
            if (p.module_name === moduleKey) {
                return { ...p, [field]: value };
            }
            return p;
        });
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleSelectAll = (moduleKey, value) => {
        if (readOnly) return;
        const newPermissions = formData.permissions.map(p => {
            if (p.module_name === moduleKey) {
                return {
                    ...p,
                    can_view: value,
                    can_create: value,
                    can_edit: value,
                    can_delete: value,
                    can_approve: value
                };
            }
            return p;
        });
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleSave = async () => {
        if (!formData.role_name) {
            setError('Role name is required');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (role) {
                await axios.put(`${API_URL}/roles/${role.id}`, formData, config);
            } else {
                await axios.post(`${API_URL}/roles`, formData, config);
            }
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderPermissionRow = (module) => {
        if (!formData || !formData.permissions) return null;
        const perm = formData.permissions.find(p => p.module_name === module.key) || {};
        const isAllSelected = perm.can_view && perm.can_create && perm.can_edit && perm.can_delete && perm.can_approve;

        return (
            <View key={module.key} style={styles.permRow}>
                {/* 1. Module Name Column */}
                <View style={styles.colModule}>
                    <View style={styles.moduleBadge}>
                        <Text style={styles.moduleBadgeText}>{module.name}</Text>
                    </View>
                </View>

                {/* 2. Checkbox Columns */}
                {['can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve'].map(field => (
                    <TouchableOpacity
                        key={field}
                        style={styles.colPerm}
                        onPress={() => handlePermissionChange(module.key, field, !perm[field])}
                    >
                        <View style={[styles.checkbox, perm[field] && styles.checkboxActive]}>
                            {perm[field] && <MaterialCommunityIcons name="check" size={12} color="white" />}
                        </View>
                        <Text style={styles.permLabel}>
                            {field.split('_')[1].charAt(0).toUpperCase() + field.split('_')[1].slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}

                {/* 3. Action Column */}
                <View style={styles.colAction}>
                    {!readOnly && (
                        <TouchableOpacity
                            onPress={() => handleSelectAll(module.key, !isAllSelected)}
                            style={styles.selectAllBtn}
                        >
                            <Text style={[styles.selectAllText, isAllSelected && styles.selectAllActive]}>
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <BaseModal
            visible={visible}
            onClose={onClose}
            title={readOnly ? 'View Role Details' : (role ? 'Edit Role' : 'Add New Role')}
            width={1000}
        >
            <View style={styles.container}>
                {fetchingDetails ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Loading role details...</Text>
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Header Area */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Role Permissions</Text>
                            <View style={styles.headerDivider} />
                        </View>

                        {/* Basic Info Row */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Basic Information</Text>
                            {error && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}
                            <View style={styles.basicInfoRow}>
                                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                    <Text style={styles.label}>Role Name *</Text>
                                    <TextInput
                                        style={[styles.input, readOnly && styles.readOnlyInput]}
                                        value={formData.role_name}
                                        onChangeText={(val) => setFormData({ ...formData, role_name: val })}
                                        placeholder="e.g. Finance Manager"
                                        editable={!readOnly}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 2 }]}>
                                    <Text style={styles.label}>Description</Text>
                                    <TextInput
                                        style={[styles.input, readOnly && styles.readOnlyInput]}
                                        value={formData.description}
                                        onChangeText={(val) => setFormData({ ...formData, description: val })}
                                        placeholder="What can this role do?"
                                        editable={!readOnly}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Active Status</Text>
                                    <View style={[styles.statusToggle, readOnly && styles.readOnlyInput]}>
                                        <Switch
                                            value={formData.is_active}
                                            onValueChange={(val) => setFormData({ ...formData, is_active: val })}
                                            trackColor={{ false: "#e2e8f0", true: "#d1fae5" }}
                                            thumbColor={formData.is_active ? "#10b981" : "#f4f3f4"}
                                            disabled={readOnly}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Module Permissions Area */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Module Permissions</Text>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false} style={styles.permScroll}>
                                {MODULES.map(renderPermissionRow)}
                            </ScrollView>
                        </View>

                        {/* Assigned Users Section - Only in View Mode */}
                        {readOnly && (
                            <View style={[styles.section, { marginTop: 12 }]}>
                                <Text style={styles.sectionTitle}>Assigned Personnel ({assignedUsers.length})</Text>
                                <ScrollView style={styles.usersScroll} showsVerticalScrollIndicator={false}>
                                    {assignedUsers.length === 0 ? (
                                        <View style={styles.emptyUsersBox}>
                                            <Text style={styles.emptyUsersText}>No users currently assigned to this role.</Text>
                                        </View>
                                    ) : (
                                        assignedUsers.map((u, idx) => (
                                            <View key={u.id || idx} style={styles.userItem}>
                                                <View style={styles.userAvatarSmall}>
                                                    <Text style={styles.userAvatarText}>{u.name.charAt(0).toUpperCase()}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.userItemName}>{u.name}</Text>
                                                    <Text style={styles.userItemEmail}>{u.email}</Text>
                                                </View>
                                                <View style={styles.userStatusBadge}>
                                                    <View style={[styles.dot, { backgroundColor: u.status === 'ACTIVE' ? '#10b981' : '#ef4444' }]} />
                                                    <Text style={styles.userStatusText}>{u.status}</Text>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelLabel}>{readOnly ? 'Close' : 'Cancel'}</Text>
                    </TouchableOpacity>
                    {!readOnly && (
                        <TouchableOpacity
                            style={[styles.saveBtn, loading && styles.disabledBtn]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveLabel}>{role ? 'Update Role' : 'Save Role'}</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 0,
        margin: 0,
    },
    content: {
        padding: 24,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 8,
    },
    headerDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        width: '100%',
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    basicInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
        gap: 20,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 10,
        height: 44, // Explicit height for better alignment
        fontSize: 14,
        color: '#1e293b',
    },
    readOnlyInput: {
        backgroundColor: '#f1f5f9',
        borderColor: '#e2e8f0',
        color: '#64748b',
    },
    statusToggle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44, // Match input height
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    permScroll: {
        maxHeight: 280,
    },
    permRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 1,
    },
    colModule: {
        flex: 1.8,
    },
    colPerm: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    colAction: {
        flex: 1.2,
        alignItems: 'flex-end',
    },
    moduleBadge: {
        backgroundColor: '#EEF2F7',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    moduleBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    checkboxActive: {
        backgroundColor: '#2563EB',
    },
    permLabel: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    selectAllBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    selectAllText: {
        fontSize: 13,
        color: '#2563EB',
        fontWeight: '500',
    },
    selectAllActive: {
        color: '#64748b',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    saveLabel: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    disabledBtn: {
        backgroundColor: '#93c5fd',
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
    },
    loadingBox: {
        padding: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#64748b',
    },
    usersScroll: {
        maxHeight: 200,
        marginTop: 8,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    userAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userAvatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    userItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
    userItemEmail: {
        fontSize: 11,
        color: '#64748b',
    },
    userStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    userStatusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
    },
    emptyUsersBox: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    emptyUsersText: {
        fontSize: 13,
        color: '#94a3b8',
    },
});

export default RoleFormModal;
