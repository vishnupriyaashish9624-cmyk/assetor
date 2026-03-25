import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button, DataTable, Searchbar, IconButton, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

const AssetCategoriesScreen = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

    useFocusEffect(
        React.useCallback(() => {
            fetchCategories();
        }, [])
    );

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get('categories');
            if (res.data.success) {
                setCategories(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            showSnackbar('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await api.delete(`categories/${id}`);
            if (res.data.success) {
                showSnackbar('Category deleted');
                fetchCategories();
            }
        } catch (err) {
            console.error('Error deleting category:', err);
            showSnackbar(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const openModal = (category = null) => {
        if (category) {
            navigation.navigate('AddCategory', { category });
        } else {
            navigation.navigate('AddCategory');
        }
    };

    const handleView = (category) => {
        navigation.navigate('AddCategory', { category, viewOnly: true });
    };

    const showSnackbar = (message) => {
        setSnackbar({ visible: true, message });
    };

    const buildTree = (items) => {
        const itemMap = {};
        const roots = [];

        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });

        items.forEach(item => {
            if (item.parent_id) {
                if (itemMap[item.parent_id]) {
                    itemMap[item.parent_id].children.push(itemMap[item.id]);
                } else {
                    roots.push(itemMap[item.id]);
                }
            } else {
                roots.push(itemMap[item.id]);
            }
        });
        return roots;
    };

    const renderCategoryNode = (node, depth = 0) => {
        const rowItems = [];
        rowItems.push(
            <DataTable.Row key={node.id} style={styles.tableRow}>
                <DataTable.Cell style={{ flex: 1.5 }}>
                    <View style={[styles.nameContainer, depth > 0 && { paddingLeft: depth * 28 }]}>
                        <View style={[styles.iconCircle, depth > 0 && { backgroundColor: '#F1F5F9' }]}>
                            <MaterialCommunityIcons
                                name={depth > 0 ? "subdirectory-arrow-right" : "shape"}
                                size={16}
                                color={depth > 0 ? "#64748B" : "#4f46e5"}
                            />
                        </View>
                        <Text style={[styles.categoryName, depth > 0 && { color: '#475569', fontSize: 13, fontWeight: '500' }]}>
                            {node.name}
                        </Text>
                    </View>
                </DataTable.Cell>
                <DataTable.Cell>
                    <View style={styles.parentPill}>
                        <Text style={styles.parentText}>{node.parent_name || 'Root'}</Text>
                    </View>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2 }}>
                    <Text style={styles.descriptionText} numberOfLines={1}>
                        {node.description || 'No description provided'}
                    </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric style={{ flex: 0.8 }}>
                    <View style={styles.actionButtons}>
                        <IconButton icon="eye-outline" size={18} iconColor="#64748b" onPress={() => handleView(node)} style={{ margin: 0 }} />
                        <IconButton icon="pencil-outline" size={18} iconColor="#2563eb" onPress={() => openModal(node)} style={{ margin: 0 }} />
                        <IconButton icon="delete-outline" size={18} iconColor="#ef4444" onPress={() => handleDelete(node.id)} style={{ margin: 0 }} />
                    </View>
                </DataTable.Cell>
            </DataTable.Row>
        );

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                rowItems.push(...renderCategoryNode(child, depth + 1));
            });
        }

        return rowItems;
    };

    const filteredCategories = (Array.isArray(categories) ? categories : []).filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const treeCategories = buildTree(filteredCategories);

    return (
        <AppLayout title="Product Category" navigation={navigation} activeRoute="AssetCategories">
            <View style={styles.container}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Product Categories</Text>
                        <Text style={styles.subtitle}>Manage types and groupings for your assets</Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={() => openModal()}
                        style={styles.addBtn}
                        icon="plus"
                        labelStyle={{ fontWeight: 'bold' }}
                    >
                        NEW CATEGORY
                    </Button>
                </View>

                {/* Search & Actions Area */}
                <View style={styles.searchArea}>
                    <Searchbar
                        placeholder="Search categories..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchBarInput}
                        iconColor="#6366f1"
                    />
                </View>

                {/* Table Content */}
                <View style={styles.tableCard}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#6366f1" style={{ margin: 50 }} />
                    ) : (
                        <DataTable>
                            <DataTable.Header style={styles.tableHeader}>
                                <DataTable.Title textStyle={styles.headerText}>TITLE / NAME</DataTable.Title>
                                <DataTable.Title textStyle={styles.headerText}>PARENT</DataTable.Title>
                                <DataTable.Title textStyle={styles.headerText}>DESCRIPTION</DataTable.Title>
                                <DataTable.Title numeric textStyle={styles.headerText}>ACTIONS</DataTable.Title>
                            </DataTable.Header>

                            {treeCategories.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="shape-outline" size={48} color="#cbd5e1" />
                                    <Text style={styles.emptyText}>No categories found</Text>
                                </View>
                            ) : (
                                treeCategories.flatMap(node => renderCategoryNode(node))
                            )}
                        </DataTable>
                    )}
                </View>
            </View>

            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={3000}
                action={{
                    label: 'OK',
                    onPress: () => setSnackbar({ ...snackbar, visible: false }),
                }}
            >
                {snackbar.message}
            </Snackbar>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 32,
        maxWidth: 1400,
        alignSelf: 'stretch',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 4,
    },
    addBtn: {
        borderRadius: 12,
        backgroundColor: '#4f46e5',
        paddingVertical: 6,
    },
    searchArea: {
        marginBottom: 24,
    },
    searchBar: {
        elevation: 0,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        backgroundColor: '#ffffff',
    },
    searchBarInput: {
        fontSize: 15,
    },
    tableCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerText: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    tableRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    descriptionText: {
        color: '#64748b',
        fontSize: 13,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 16,
    },
    parentPill: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    parentText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    }
});

export default AssetCategoriesScreen;
