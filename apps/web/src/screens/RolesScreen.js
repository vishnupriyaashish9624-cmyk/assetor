import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import RoleFormModal from '../components/modals/RoleFormModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const RolesScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchRoles();
    }, []);

    // Reset to page 1 on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const fetchRoles = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (id) => {
        const confirmDelete = () => {
            if (Platform.OS === 'web') {
                return window.confirm('Are you sure you want to delete this role?');
            }
            return true; // Simplified for non-web, usually use Alert.alert
        };

        if (!confirmDelete()) return;

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/roles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                fetchRoles();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const filteredRoles = roles.filter(role =>
        role.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
    const paginatedRoles = filteredRoles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <View style={styles.nameCell}>
                <View style={styles.roleIconBox}>
                    <MaterialCommunityIcons name="shield-account" size={20} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.roleName}>{item.role_name}</Text>
                    <Text style={styles.roleDesc} numberOfLines={1}>{item.description || 'No description'}</Text>
                </View>
            </View>

            <View style={styles.cell}>
                <View style={styles.userCountBadge}>
                    <MaterialCommunityIcons name="account-group" size={14} color="#64748b" />
                    <Text style={styles.userCountText}>{item.user_count} Users</Text>
                </View>
            </View>

            <View style={styles.cell}>
                <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#ecfdf5' : '#fef2f2' }]}>
                    <Text style={[styles.statusText, { color: item.is_active ? '#10b981' : '#ef4444' }]}>
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            <View style={styles.actionCell}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        setEditingRole(item);
                        setIsViewOnly(true);
                        setModalVisible(true);
                    }}
                >
                    <MaterialCommunityIcons name="eye-outline" size={18} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        setEditingRole(item);
                        setIsViewOnly(false);
                        setModalVisible(true);
                    }}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteRole(item.id)}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <AppLayout navigation={navigation}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Role Management</Text>
                    <Text style={styles.subtitle}>Define permissions for your team</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                        setEditingRole(null);
                        setIsViewOnly(false);
                        setModalVisible(true);
                    }}
                >
                    <MaterialCommunityIcons name="plus" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.addBtnText}>Add Role</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search roles or descriptions..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            </View>

            <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerText, { flex: 2 }]}>ROLE NAME</Text>
                    <Text style={[styles.headerText, { flex: 1 }]}>USERS ASSIGNED</Text>
                    <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
                    <Text style={[styles.headerText, { width: 80, textAlign: 'right' }]}>ACTIONS</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={paginatedRoles}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="shield-off-outline" size={48} color="#e2e8f0" />
                                    <Text style={styles.emptyText}>No roles found</Text>
                                </View>
                            )}
                        />
                        {totalPages > 1 && (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                    onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <MaterialCommunityIcons name="chevron-left" size={20} color={currentPage === 1 ? "#cbd5e1" : "#475569"} />
                                </TouchableOpacity>
                                <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>
                                <TouchableOpacity
                                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                                    onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={currentPage === totalPages ? "#cbd5e1" : "#475569"} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </View>

            <RoleFormModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditingRole(null);
                }}
                onSave={() => {
                    fetchRoles();
                    setModalVisible(false);
                    setEditingRole(null);
                }}
                role={editingRole}
                readOnly={isViewOnly}
            />
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    addBtn: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    addBtnText: {
        color: 'white',
        fontWeight: '600',
    },
    searchContainer: {
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1e293b',
        ...Platform.select({
            web: { outlineStyle: 'none' }
        })
    },
    tableCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        flex: 1,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        } : {}),
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    nameCell: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    roleName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    roleDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    cell: {
        flex: 1,
    },
    userCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    userCountText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    actionCell: {
        width: 80,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyContainer: {
        padding: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94a3b8',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: 16,
    },
    pageBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageBtnDisabled: {
        backgroundColor: '#f8fafc',
        borderColor: '#f1f5f9',
    },
    pageInfo: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
});

export default RolesScreen;
