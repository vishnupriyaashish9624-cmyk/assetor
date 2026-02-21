import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import SMTPConfigModal from '../components/modals/SMTPConfigModal';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const SMTPSettingsScreen = ({ navigation }) => {
    const { token } = useAuthStore();
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [error, setError] = useState(null);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/smtp`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConfigs(response.data.configs);
            }
        } catch (err) {
            console.error('Error fetching SMTP configs:', err);
            setError('Failed to load configurations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async (data) => {
        try {
            if (selectedConfig) {
                await axios.put(`${API_URL}/smtp/${selectedConfig.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/smtp`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            fetchConfigs();
            setModalVisible(false);
        } catch (err) {
            throw err; // Modal handles error display
        }
    };

    const handleDelete = (id) => {
        // Confirm dialog would be nice, but using window.confirm for web or just direct delete for now
        // In React Native Web, Alert.alert works nicely
        if (confirm('Are you sure you want to delete this configuration?')) {
            deleteConfig(id);
        }
    };

    const deleteConfig = async (id) => {
        try {
            await axios.delete(`${API_URL}/smtp/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchConfigs();
        } catch (err) {
            alert('Failed to delete config');
        }
    }

    const openEdit = (config) => {
        setSelectedConfig(config);
        setModalVisible(true);
    };

    const openNew = () => {
        setSelectedConfig(null);
        setModalVisible(true);
    };

    return (
        <AppLayout title="SMTP Master" navigation={navigation} activeRoute="SMTPSettings">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>SMTP Configurations</Text>
                    <TouchableOpacity style={styles.addButton} onPress={openNew}>
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text style={styles.addButtonText}>New Configuration</Text>
                    </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {loading ? (
                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView contentContainerStyle={styles.listContainer}>
                        {configs.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="email-off-outline" size={48} color="#9ca3af" />
                                <Text style={styles.emptyText}>No SMTP configurations found.</Text>
                                <Text style={styles.emptySubText}>Add a new configuration to start sending emails via SMTP.</Text>
                            </View>
                        ) : (
                            configs.map((config, idx) => (
                                <View key={`smtp-${config.id || idx}`} style={styles.card}>
                                    <View style={[styles.statusStrip, { backgroundColor: config.is_active ? '#10b981' : '#d1d5db' }]} />
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <View>
                                                <Text style={styles.configName}>{config.name}</Text>
                                                <Text style={styles.hostText}>{config.host}:{config.port}</Text>
                                            </View>
                                            <View style={styles.badgeContainer}>
                                                {config.is_active && (
                                                    <View style={styles.activeBadge}>
                                                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                                    </View>
                                                )}
                                                <View style={styles.encryptionBadge}>
                                                    <Text style={styles.encryptionText}>{config.encryption.toUpperCase()}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.detailsGrid}>
                                            <View style={styles.detailItem}>
                                                <Text style={styles.detailLabel}>Username</Text>
                                                <Text style={styles.detailValue}>{config.username}</Text>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <Text style={styles.detailLabel}>From Email</Text>
                                                <Text style={styles.detailValue}>{config.from_email}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardActions}>
                                            <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(config)}>
                                                <MaterialCommunityIcons name="pencil" size={18} color="#4b5563" />
                                                <Text style={styles.actionText}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.actionBtn, { marginLeft: 12 }]} onPress={() => handleDelete(config.id)}>
                                                <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
                                                <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}

                <SMTPConfigModal
                    key={selectedConfig ? `edit-${selectedConfig.id}` : 'new-config'}
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSave={handleSave}
                    config={selectedConfig}
                />
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        color: '#111827',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    listContainer: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        flexDirection: 'row',
    },
    statusStrip: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    configName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    hostText: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'monospace', // Gives technical feel
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    activeBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeBadgeText: {
        color: '#059669',
        fontSize: 11,
        fontWeight: 'bold',
    },
    encryptionBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    encryptionText: {
        color: '#4b5563',
        fontSize: 11,
        fontWeight: 'bold',
    },
    detailsGrid: {
        flexDirection: 'row',
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f9fafb',
        paddingTop: 16,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4b5563',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 16,
    },
});

export default SMTPSettingsScreen;
