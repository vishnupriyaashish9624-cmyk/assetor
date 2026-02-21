import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseModal from './BaseModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const EmployeeFormModal = ({ visible, onClose, onSave, companyId, companyName, employee = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: 'Employee', // Default role
        role_id: null,
        department_id: null,
        status: 'Active',

        // Security Settings
        auto_generate_password: true,
        password: '',
        require_reset: true,
        send_email: true,
    });

    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
    const [manualPassword, setManualPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (visible) {
            fetchRoles();
            fetchDepartments();
        }
    }, [visible]);

    const fetchRoles = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const url = companyId
                ? `${API_URL}/departments?company_id=${companyId}`
                : `${API_URL}/departments`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            if (data.success) {
                setDepartments(data.data || []);
            } else if (Array.isArray(data)) {
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                position: employee.position || '',
                role_id: employee.role_id || null,
                department_id: employee.department_id || null,
                status: employee.status || 'Active',
                auto_generate_password: false,
                password: '',
                require_reset: false,
                send_email: false,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                position: 'Employee',
                role_id: null,
                department_id: null,
                status: 'Active',
                auto_generate_password: true,
                password: '',
                require_reset: true,
                send_email: true,
            });
            setManualPassword('');
        }
    }, [employee, visible]);

    const handleSave = async () => {
        if (!formData.name) {
            setError('Employee name is required');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            // Prepare payload
            const payload = { ...formData, company_id: companyId };
            if (!formData.auto_generate_password) {
                payload.password = manualPassword;
            }
            // Remove helper fields not needed by backend if strict, but usually ignored
            await onSave(payload);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title={employee ? 'Edit User' : 'Create User'} width={500}>
            <View style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 600 }}>
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {error === 'PRIVILEGE_DENIED' ? 'This company does not have the privilege to add employees.' : error}
                            </Text>
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="John Smith"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            placeholder="john.smith@email.com"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            placeholder="+1 123 456 7890"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 16 }}>
                                <Text style={styles.label}>System Permissions Role</Text>
                                <View style={styles.roleGrid}>
                                    {roles.length === 0 ? (
                                        <Text style={styles.noRolesText}>No roles found. Create roles in Access Control.</Text>
                                    ) : (
                                        roles.map((r, index) => (
                                            <TouchableOpacity
                                                key={`${r.id}-${index}`}
                                                onPress={() => setFormData({ ...formData, role_id: r.id })}
                                                style={[styles.rolePill, formData.role_id === r.id && styles.rolePillActive]}
                                            >
                                                <MaterialCommunityIcons
                                                    name={formData.role_id === r.id ? "shield-check" : "shield-outline"}
                                                    size={14}
                                                    color={formData.role_id === r.id ? "white" : "#64748b"}
                                                />
                                                <Text style={[styles.rolePillText, formData.role_id === r.id && styles.rolePillTextActive]}>
                                                    {r.role_name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            </View>

                            <View style={{ width: 100 }}>
                                <Text style={styles.label}>Status</Text>
                                <View style={styles.statusRow}>
                                    <Switch
                                        value={formData.status === 'Active'}
                                        onValueChange={(val) => setFormData({ ...formData, status: val ? 'Active' : 'Inactive' })}
                                        trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                                        thumbColor={formData.status === 'Active' ? "#3b82f6" : "#f1f5f9"}
                                        style={{ transform: [{ scale: 0.8 }] }}
                                    />
                                    <Text style={[styles.statusText, { color: formData.status === 'Active' ? '#10b981' : '#64748b' }]}>
                                        {formData.status === 'Active' ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Department</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setDeptDropdownOpen(o => !o)}
                        >
                            <Text style={[
                                styles.dropdownText,
                                formData.department_id && { color: '#111827', fontWeight: '500' }
                            ]}>
                                {formData.department_id
                                    ? (departments.find(d => d.id === formData.department_id)?.name || 'Select Department')
                                    : 'Select Department'}
                            </Text>
                            <MaterialCommunityIcons
                                name={deptDropdownOpen ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="#64748b"
                            />
                        </TouchableOpacity>
                        {deptDropdownOpen && (
                            <View style={styles.deptList}>
                                {departments.length === 0 ? (
                                    <Text style={styles.deptEmptyText}>No departments found</Text>
                                ) : (
                                    departments.map(dept => (
                                        <TouchableOpacity
                                            key={dept.id}
                                            style={[
                                                styles.deptItem,
                                                formData.department_id === dept.id && styles.deptItemActive
                                            ]}
                                            onPress={() => {
                                                setFormData(f => ({ ...f, department_id: dept.id }));
                                                setDeptDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.deptItemText,
                                                formData.department_id === dept.id && styles.deptItemTextActive
                                            ]}>
                                                {dept.name}
                                            </Text>
                                            {formData.department_id === dept.id && (
                                                <MaterialCommunityIcons name="check" size={16} color="#3b82f6" />
                                            )}
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}
                    </View>

                    {/* Security Section */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <View style={styles.checkboxCheckedPlainIcon}>
                                <MaterialCommunityIcons name="shield-check" size={14} color="#3b82f6" />
                            </View>
                            <Text style={styles.securityTitle}>Security</Text>

                            <Switch
                                value={formData.auto_generate_password}
                                onValueChange={(val) => setFormData({ ...formData, auto_generate_password: val })}
                                trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                                thumbColor={formData.auto_generate_password ? "#3b82f6" : "#f1f5f9"}
                                style={{ transform: [{ scale: 0.8 }], marginLeft: 'auto' }}
                            />
                        </View>

                        <Text style={styles.securityLabelMain}>Auto-generate temporary password</Text>

                        {!employee && (
                            <>
                                {formData.auto_generate_password ? (
                                    <View style={styles.tempPasswordRow}>
                                        <Text style={styles.tempPassLabel}>Temporary Password</Text>
                                        <View style={styles.tempPassContainer}>
                                            <Text style={styles.tempPassDots}>••••••••</Text>
                                            <TouchableOpacity style={styles.regenerateBtn}>
                                                <Text style={styles.regenerateText}>Regenerate</Text>
                                                <MaterialCommunityIcons name="refresh" size={14} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Manual Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={manualPassword}
                                            onChangeText={setManualPassword}
                                            placeholder="Enter password"
                                            secureTextEntry
                                        />
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setFormData({ ...formData, require_reset: !formData.require_reset })}
                                >
                                    <View style={[styles.checkbox, formData.require_reset && styles.checkboxChecked]}>
                                        {formData.require_reset && <MaterialCommunityIcons name="check" size={12} color="white" />}
                                    </View>
                                    <Text style={styles.checkboxLabel}>Require password reset on first login</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setFormData({ ...formData, send_email: !formData.send_email })}
                                >
                                    <View style={[styles.checkbox, formData.send_email && styles.checkboxChecked]}>
                                        {formData.send_email && <MaterialCommunityIcons name="check" size={12} color="white" />}
                                    </View>
                                    <Text style={styles.checkboxLabel}>Send login credentials by email</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {employee && (
                            <Text style={styles.helperText}>Security settings cannot be edited after creation. Please reset password if needed.</Text>
                        )}

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
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.createText}>{employee ? 'Update User' : 'Create User'}</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    container: { padding: 8 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginBottom: 6 },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        color: '#111827',
    },
    row: { flexDirection: 'row', marginBottom: 16 },
    dropdown: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: { color: '#4b5563', fontSize: 14 },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    statusText: { fontSize: 14, color: '#1f2937', marginLeft: 8 },

    // Security Section
    securityCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    securityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    securityTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginLeft: 8, flex: 1 },
    checkboxCheckedPlainIcon: {
        width: 16, height: 16, alignItems: 'center', justifyContent: 'center'
    },
    securityLabelMain: {
        fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 12
    },

    tempPasswordRow: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tempPassLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
    tempPassContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tempPassDots: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        color: '#374151',
        fontSize: 14,
        letterSpacing: 2,
        minWidth: 100,
        textAlign: 'center',
    },
    regenerateBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    regenerateText: { color: 'white', fontSize: 12, fontWeight: '500' },

    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    checkbox: {
        width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#3b82f6', marginRight: 10, justifyContent: 'center', alignItems: 'center'
    },
    checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    checkboxLabel: { fontSize: 13, color: '#4b5563' },

    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
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
    helperText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 6,
    },
    rolePillActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    rolePillText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
    },
    rolePillTextActive: {
        color: 'white',
    },
    noRolesBox: {
        padding: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    noRolesText: {
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
    },
    deptList: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        backgroundColor: '#fff',
        maxHeight: 180,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    deptItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    deptItemActive: {
        backgroundColor: '#eff6ff',
    },
    deptItemText: {
        fontSize: 14,
        color: '#374151',
    },
    deptItemTextActive: {
        color: '#2563eb',
        fontWeight: '600',
    },
    deptEmptyText: {
        padding: 12,
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default EmployeeFormModal;
