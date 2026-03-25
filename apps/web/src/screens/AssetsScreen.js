import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Card, Text, Button, IconButton, ActivityIndicator, DataTable } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/client';
import AppLayout from '../components/AppLayout';
import AssetFormModal from '../components/AssetFormModal';
import AssignAssetModal from '../components/AssignAssetModal';

const AssetsScreen = ({ navigation }) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [viewMode, setViewMode] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAsset = async (newAsset) => {
        try {
            setLoading(true);
            const payload = {
                category_id: newAsset.category_id ? Number(newAsset.category_id) : null,
                asset_code: newAsset.asset_code || '',
                name: newAsset.name,
                sub_category: newAsset.sub_category || '',
                brand: newAsset.brand || '',
                model: newAsset.model || '',
                serial_number: newAsset.serial_number || '',
                purchase_date: newAsset.purchase_date || null,
                purchase_cost: newAsset.cost ? Number(newAsset.cost) : null,
                status: newAsset.status || 'AVAILABLE',
                location: '',
                notes: newAsset.description || '',
                quantity: newAsset.quantity ? Number(newAsset.quantity) : 1,
                current_holder_id: newAsset.current_holder_id ? Number(newAsset.current_holder_id) : null,
                image_data: newAsset.image_data || null,
            };

            const response = selectedAsset
                ? await api.put(`/assets/${selectedAsset.id}`, payload)
                : await api.post('/assets', payload);

            if (response.data.success) {
                fetchAssets();
            }
        } catch (error) {
            console.error('Error saving asset:', error);
        } finally {
            setModalVisible(false);
            setLoading(false);
        }
    };


    const handleDelete = async (asset) => {
        if (window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
            try {
                const response = await api.delete(`/assets/${asset.id}`);
                if (response.data.success) {
                    fetchAssets();
                }
            } catch (error) {
                console.error('Error deleting asset:', error);
            }
        }
    };

    const handleAssignAsset = async (assetId, employeeId, notes) => {
        try {
            const response = await api.post(`/assets/${assetId}/assign`, { employee_id: employeeId, notes });
            if (response.data.success) {
                fetchAssets();
                setAssignModalVisible(false);
            }
        } catch (error) {
            console.error('Error assigning asset:', error);
        }
    };

    const handleReturnAsset = async (assetId) => {
        if (window.confirm('Are you sure you want to return this asset into inventory?')) {
            try {
                const response = await api.post(`/assets/${assetId}/return`, { notes: 'Returned via dashboard' });
                if (response.data.success) {
                    fetchAssets();
                }
            } catch (error) {
                console.error('Error returning asset:', error);
            }
        }
    };

    const stats = {
        total: assets.length,
        available: assets.filter(a => a.status === 'AVAILABLE').length,
        inUse: assets.filter(a => a.status === 'IN_USE' || a.status === 'ALLOCATED').length,
        maintenance: assets.filter(a => a.status === 'MAINTENANCE').length
    };

    const getAssetIcon = (asset) => {
        const name = (asset.name || '').toLowerCase();
        const sub = (asset.sub_category || '').toLowerCase();
        if (name.includes('laptop') || sub.includes('laptop')) return 'laptop';
        if (name.includes('desk') || sub.includes('desk')) return 'table-large';
        if (name.includes('chair') || sub.includes('chair')) return 'chair-rolling';
        if (name.includes('phone') || sub.includes('phone') || name.includes('mobile')) return 'cellphone';
        if (name.includes('printer') || sub.includes('printer')) return 'printer';
        if (name.includes('camera') || sub.includes('camera')) return 'camera';
        if (name.includes('car') || name.includes('vehicle')) return 'car';
        return 'cube-outline';
    };

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.asset_code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout navigation={navigation} title="Asset Management">
            <View style={styles.container}>
                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statsCard}>
                        <View style={[styles.statsIconBox, { backgroundColor: '#EFF6FF' }]}>
                            <MaterialCommunityIcons name="cube-scan" size={24} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.statsValue}>{stats.total}</Text>
                            <Text style={styles.statsLabel}>Total Assets</Text>
                        </View>
                    </View>
                    <View style={styles.statsCard}>
                        <View style={[styles.statsIconBox, { backgroundColor: '#DCFCE7' }]}>
                            <MaterialCommunityIcons name="check-circle-outline" size={24} color="#166534" />
                        </View>
                        <View>
                            <Text style={styles.statsValue}>{stats.available}</Text>
                            <Text style={styles.statsLabel}>Available</Text>
                        </View>
                    </View>
                    <View style={styles.statsCard}>
                        <View style={[styles.statsIconBox, { backgroundColor: '#DBEAFE' }]}>
                            <MaterialCommunityIcons name="account-arrow-right" size={24} color="#1E3A8A" />
                        </View>
                        <View>
                            <Text style={styles.statsValue}>{stats.inUse}</Text>
                            <Text style={styles.statsLabel}>Allocated</Text>
                        </View>
                    </View>
                    <View style={styles.statsCard}>
                        <View style={[styles.statsIconBox, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="wrench-clock-outline" size={24} color="#B45309" />
                        </View>
                        <View>
                            <Text style={styles.statsValue}>{stats.maintenance}</Text>
                            <Text style={styles.statsLabel}>Maintenance</Text>
                        </View>
                    </View>
                </View>

                {/* Controls Header */}
                <View style={styles.controlsHeader}>
                    <View style={styles.searchWrapper}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#64748b" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search assets, employees, departments..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                            setViewMode(false);
                            setSelectedAsset(null);
                            setModalVisible(true);
                        }}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.addButtonText}>Add Asset</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : filteredAssets.length === 0 ? (
                    /* Empty State UI */
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="package-variant" size={48} color="#94a3b8" />
                        </View>
                        <Text style={styles.emptyTitle}>No assets found</Text>
                        <Text style={styles.emptySubtitle}>
                            {search
                                ? `No results matching "${search}"`
                                : "You haven't added any assets yet. Click the button above to get started."}
                        </Text>
                        {search.length > 0 && (
                            <Button mode="text" onPress={() => setSearch('')} textColor="#3b82f6">
                                Clear Search
                            </Button>
                        )}
                    </View>
                ) : (
                    /* Asset Grid */
                    <Card style={styles.tableCard}>
                        <DataTable>
                            <DataTable.Header style={styles.tableHeader}>
                                <DataTable.Title textStyle={styles.headerText}>ASSET NAME</DataTable.Title>
                                <DataTable.Title textStyle={styles.headerText}>CODE</DataTable.Title>
                                <DataTable.Title textStyle={styles.headerText}>BRAND</DataTable.Title>
                                <DataTable.Title textStyle={styles.headerText}>STATUS</DataTable.Title>
                                <DataTable.Title numeric textStyle={styles.headerText}>ACTIONS</DataTable.Title>
                            </DataTable.Header>

                            {filteredAssets.map((asset) => (
                                <DataTable.Row key={asset.id} style={styles.tableRow}>
                                    <DataTable.Cell style={{ flex: 1.5 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={[styles.iconBoxMini, { backgroundColor: '#EFF6FF' }]}>
                                                <MaterialCommunityIcons name={getAssetIcon(asset)} size={20} color="#3B82F6" />
                                            </View>
                                            <Text style={styles.cellMainText}>{asset.name}</Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell><Text style={styles.cellText}>{asset.asset_code || '---'}</Text></DataTable.Cell>
                                    <DataTable.Cell><Text style={styles.cellText}>{asset.brand || '---'}</Text></DataTable.Cell>
                                    <DataTable.Cell>
                                        <View style={[styles.statusBadge, { backgroundColor: asset.status === 'AVAILABLE' ? '#DCFCE7' : '#FFEDD5' }]}>
                                            <Text style={{ color: asset.status === 'AVAILABLE' ? '#166534' : '#9A3412', fontSize: 11, fontWeight: '700' }}>
                                                {asset.status}
                                            </Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <View style={{ flexDirection: 'row', gap: 4 }}>
                                            <IconButton
                                                icon="eye-outline"
                                                size={18}
                                                iconColor="#64748b"
                                                style={{ margin: 0 }}
                                                onPress={() => {
                                                    setViewMode(true);
                                                    setSelectedAsset(asset);
                                                    setModalVisible(true);
                                                }}
                                            />
                                            <IconButton
                                                icon="pencil-outline"
                                                size={18}
                                                iconColor="#6366f1"
                                                style={{ margin: 0 }}
                                                onPress={() => {
                                                    setViewMode(false);
                                                    setSelectedAsset(asset);
                                                    setModalVisible(true);
                                                }}
                                            />
                                            {asset.status === 'AVAILABLE' ? (
                                                <IconButton icon="account-arrow-right" size={18} iconColor="#10B981" style={{ margin: 0 }} onPress={() => { setSelectedAsset(asset); setAssignModalVisible(true); }} />
                                            ) : (
                                                <IconButton icon="account-arrow-left" size={18} iconColor="#F59E0B" style={{ margin: 0 }} onPress={() => handleReturnAsset(asset.id)} />
                                            )}
                                            <IconButton
                                                icon="delete-outline"
                                                size={18}
                                                iconColor="#EF4444"
                                                style={{ margin: 0 }}
                                                onPress={() => handleDelete(asset)}
                                            />
                                        </View>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))}
                        </DataTable>
                    </Card>
                )}

                <AssetFormModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSave={handleSaveAsset}
                    asset={selectedAsset}
                    viewMode={viewMode}
                />

                <AssignAssetModal
                    visible={assignModalVisible}
                    onClose={() => setAssignModalVisible(false)}
                    onAssign={handleAssignAsset}
                    asset={selectedAsset}
                />
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 24,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    statsCard: {
        flex: 1,
        minWidth: 220,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
    },
    statsIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
    },
    statsLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    tableCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        elevation: 0,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    tableHeader: {
        backgroundColor: '#6366f1', // Purple indigo fully styled
    },
    headerText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
    tableRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cellMainText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    cellText: {
        fontSize: 13,
        color: '#64748B',
    },
    iconBoxMini: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlsHeader: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 16,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
        height: 48,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        outlineStyle: 'none',
        height: '100%',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        maxWidth: 300,
        marginBottom: 24,
    },
    list: {
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    card: {
        width: '32%',
        minWidth: 280,
        minHeight: 230,
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 0,
        backgroundColor: 'white',
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    cardContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    assetName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    assetCode: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brandText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    detailsList: {
        marginTop: 12,
        marginBottom: 16,
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    detailLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 12,
        color: '#1E293B',
        fontWeight: '600',
    },
});

export default AssetsScreen;
