import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Switch, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseModal from './BaseModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const MODULES = [
    { name: 'Dashboard', key: 'dashboard', desc: 'Overview & basic analytics' },
    { name: 'Premises', key: 'assetdisplay', desc: 'Facility and location data' },
    { name: 'Vehicles', key: 'vehicledisplay', desc: 'Fleet and logistics' },
    { name: 'Employees', key: 'employees', desc: 'Staff and workforce' },
    { name: 'Maintenance', key: 'maintenance', desc: 'Service and repairs' },
    { name: 'Reports', key: 'reports', desc: 'Business insights' },
    { name: 'Module Configuration', key: 'moduleshome', desc: 'System settings' }
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

        const permFields = ['can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve'];

        return (
            <View key={module.key} style={styles.permRow}>
                {/* 1. Module Name and Description */}
                <View style={styles.colModule}>
                    <Text style={styles.moduleNameText}>{module.name}</Text>
                    <Text style={styles.moduleDescText}>{module.desc}</Text>
                </View>

                {/* 2. Checkbox Columns */}
                <View style={styles.checkboxWrapper}>
                    {permFields.map(field => (
                        <TouchableOpacity
                            key={field}
                            style={styles.colPerm}
                            onPress={() => handlePermissionChange(module.key, field, !perm[field])}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.circularCheckbox, perm[field] && styles.circularCheckboxActive]}>
                                {perm[field] && <MaterialCommunityIcons name="check" size={12} color="white" />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 3. Action Column */}
                <View style={styles.colAction}>
                    {!readOnly && (
                        <TouchableOpacity
                            onPress={() => handleSelectAll(module.key, !isAllSelected)}
                            style={styles.selectAllBtn}
                        >
                            <Text style={styles.selectAllText}>SELECT ALL</Text>
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
                        {/* Basic Info Row */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.verticalBar} />
                                <Text style={styles.sectionTitle}>Basic Information</Text>
                            </View>

                            {error && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}
                            <View style={styles.basicInfoRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>ROLE NAME</Text>
                                    <TextInput
                                        style={[styles.input, readOnly && styles.readOnlyInput]}
                                        value={formData.role_name}
                                        onChangeText={(val) => setFormData({ ...formData, role_name: val })}
                                        placeholder="e.g. Regional Manager"
                                        editable={!readOnly}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                    <Text style={styles.label}>DESCRIPTION</Text>
                                    <TextInput
                                        style={[styles.input, readOnly && styles.readOnlyInput]}
                                        value={formData.description}
                                        onChangeText={(val) => setFormData({ ...formData, description: val })}
                                        placeholder="Briefly describe the purpose of this role..."
                                        editable={!readOnly}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 0.4, alignItems: 'center' }]}>
                                    <Text style={styles.label}>ACTIVE STATUS</Text>
                                    <Switch
                                        value={formData.is_active}
                                        onValueChange={(val) => setFormData({ ...formData, is_active: val })}
                                        trackColor={{ false: "#e2e8f0", true: "#673ab7" }}
                                        thumbColor={formData.is_active ? "#ffffff" : "#f4f3f4"}
                                        disabled={readOnly}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Module Permissions Area */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.verticalBar} />
                                <Text style={styles.sectionTitle}>Module Permissions</Text>
                            </View>

                            <View style={styles.tableHeaderBar}>
                                <Text style={[styles.tableHeaderText, { width: 220 }]}>MODULE NAME</Text>
                                <View style={styles.headerCheckboxes}>
                                    <Text style={styles.tableHeaderText}>VIEW</Text>
                                    <Text style={styles.tableHeaderText}>CREATE</Text>
                                    <Text style={styles.tableHeaderText}>EDIT</Text>
                                    <Text style={styles.tableHeaderText}>DELETE</Text>
                                    <Text style={styles.tableHeaderText}>APPROVE</Text>
                                </View>
                                <Text style={[styles.tableHeaderText, { width: 100, textAlign: 'right' }]}>SETTINGS</Text>
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
        borderRadius: 16,
        padding: 0,
        margin: 0,
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    verticalBar: {
        width: 4,
        height: 20,
        backgroundColor: '#673ab7',
        borderRadius: 2,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    basicInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 8,
    },
    inputGroup: {
        // flex assigned in JSX
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#f1f5f9',
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 14,
        color: '#1e293b',
    },
    readOnlyInput: {
        backgroundColor: '#e2e8f0',
        color: '#64748b',
    },
    tableHeaderBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 8,
    },
    tableHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    headerCheckboxes: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    permScroll: {
        maxHeight: 400,
    },
    permRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        // card style
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    colModule: {
        width: 220,
    },
    moduleNameText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    moduleDescText: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    checkboxWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    colPerm: {
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circularCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circularCheckboxActive: {
        backgroundColor: '#673ab7',
        borderColor: '#673ab7',
    },
    colAction: {
        width: 100,
        alignItems: 'flex-end',
    },
    selectAllBtn: {
        paddingVertical: 6,
    },
    selectAllText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#673ab7',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 24,
        paddingVertical: 20,
        paddingHorizontal: 32,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    cancelBtn: {
        padding: 8,
    },
    cancelLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '700',
    },
    saveBtn: {
        backgroundColor: '#673ab7',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 14,
        shadowColor: '#673ab7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveLabel: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '800',
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
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
        backgroundColor: '#673ab7',
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
