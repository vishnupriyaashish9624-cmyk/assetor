import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, IconButton, Surface, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import api from '../api/client';

const AddCategoryScreen = ({ navigation, route }) => {
    const editingCategory = route.params?.category || null;
    const viewOnly = route.params?.viewOnly || false;
    const [formData, setFormData] = useState({
        name: editingCategory ? editingCategory.name : '',
        description: editingCategory ? editingCategory.description : '',
        parent_id: editingCategory ? editingCategory.parent_id : null
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

    useEffect(() => {
        fetchParentCategories();
    }, []);

    useEffect(() => {
        setFormData({
            name: editingCategory ? editingCategory.name : '',
            description: editingCategory ? editingCategory.description : '',
            parent_id: editingCategory ? editingCategory.parent_id : null
        });
        fetchParentCategories();
    }, [editingCategory]);

    const fetchParentCategories = async () => {
        try {
            const res = await api.get('categories');
            if (res.data.success) {
                // Filter out the current category to avoid circular dependency
                const list = res.data.data.filter(c => !editingCategory || c.id !== editingCategory.id);
                setCategories(list);
            }
        } catch (err) {
            console.error('Error fetching parent categories:', err);
        } finally {
            setLoading(false);
        }
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

    const flattenTreeForDropdown = (nodes, depth = 0) => {
        let results = [];
        nodes.forEach(node => {
            results.push({ ...node, depth });
            if (node.children && node.children.length > 0) {
                results = [...results, ...flattenTreeForDropdown(node.children, depth + 1)];
            }
        });
        return results;
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setSnackbar({ visible: true, message: 'Category name is required' });
            return;
        }

        try {
            setSubmitting(true);
            let response;
            if (editingCategory) {
                response = await api.put(`categories/${editingCategory.id}`, formData);
            } else {
                response = await api.post('categories', formData);
            }

            if (response.data.success) {
                navigation.navigate('AssetCategories', { refresh: true });
            }
        } catch (err) {
            console.error('Error saving category:', err);
            setSnackbar({ visible: true, message: err.response?.data?.message || 'Failed to save category' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title={viewOnly ? "Category Details" : (editingCategory ? "Edit Category" : "Add New Category")} navigation={navigation}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <IconButton icon="arrow-left" onPress={() => navigation.navigate('AssetCategories')} size={24} />
                    <View>
                        <Text style={styles.title}>{viewOnly ? 'Category Information' : (editingCategory ? 'Modify Category' : 'Create New Category')}</Text>
                        <Text style={styles.subtitle}>
                            {viewOnly ? 'Review category details and structural placement' : 'Define categories to organize your assets systematically'}
                        </Text>
                    </View>
                </View>

                <Surface style={styles.formCard}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {viewOnly ? (
                            <View style={styles.viewerContainer}>
                                <View style={styles.viewRow}>
                                    <Text style={styles.viewLabel}>Category Name</Text>
                                    <Text style={styles.viewValue}>{formData.name}</Text>
                                </View>

                                <View style={styles.viewRow}>
                                    <Text style={styles.viewLabel}>Parent Category</Text>
                                    <Text style={styles.viewValue}>
                                        {formData.parent_id
                                            ? categories.find(c => c.id === formData.parent_id)?.name || 'Parent'
                                            : 'None (Root Category)'}
                                    </Text>
                                </View>

                                <View style={styles.viewRow}>
                                    <Text style={styles.viewLabel}>Description</Text>
                                    <Text style={styles.viewValue}>
                                        {formData.description || 'No description provided.'}
                                    </Text>
                                </View>

                                <View style={[styles.viewRow, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.viewLabel}>Placement</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <MaterialCommunityIcons name={formData.parent_id ? "subdirectory-arrow-right" : "database"} size={16} color="#4F46E5" />
                                        <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '500' }}>
                                            {formData.parent_id ? 'Nested Child Branch' : 'Primary Root Node'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Category Name</Text>
                                    <TextInput
                                        mode="outlined"
                                        value={formData.name}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        placeholder="e.g. IT Equipment, Office Furniture"
                                        outlineColor="#e2e8f0"
                                        activeOutlineColor="#4f46e5"
                                        style={styles.textInput}
                                        left={<TextInput.Icon icon="shape" color="#64748b" />}
                                        editable={!viewOnly}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Parent Category (Optional)</Text>
                                    <TouchableOpacity
                                        onPress={() => !viewOnly && setMenuVisible(!menuVisible)}
                                        style={[styles.selector, menuVisible && styles.selectorActive, viewOnly && { backgroundColor: '#f1f5f9', opacity: 0.8 }]}
                                        disabled={viewOnly}
                                    >
                                        <View style={styles.selectorContent}>
                                            <MaterialCommunityIcons name="file-tree" size={20} color="#64748b" style={{ marginRight: 12 }} />
                                            <Text style={[styles.selectorText, !formData.parent_id && { color: '#94a3b8' }]}>
                                                {formData.parent_id
                                                    ? categories.find(c => c.id == formData.parent_id)?.name
                                                    : 'Select Parent (Root Category)'}
                                            </Text>
                                        </View>
                                        {!viewOnly && <MaterialCommunityIcons name={menuVisible ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />}
                                    </TouchableOpacity>

                                    {menuVisible && (
                                        <Surface style={styles.dropdown}>
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                <TouchableOpacity
                                                    style={styles.dropdownItem}
                                                    onPress={() => { setFormData({ ...formData, parent_id: null }); setMenuVisible(false); }}
                                                >
                                                    <Text style={styles.dropdownItemText}>None (Root Category)</Text>
                                                </TouchableOpacity>
                                                {(() => {
                                                    const treeData = buildTree(categories);
                                                    const dropdownItems = flattenTreeForDropdown(treeData);

                                                    return dropdownItems.map((cat) => (
                                                        <TouchableOpacity
                                                            key={cat.id}
                                                            style={[styles.dropdownItem, cat.depth > 0 && { paddingLeft: 16 + (cat.depth * 24) }]}
                                                            onPress={() => { setFormData({ ...formData, parent_id: cat.id }); setMenuVisible(false); }}
                                                        >
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                {cat.depth > 0 && (
                                                                    <MaterialCommunityIcons name="subdirectory-arrow-right" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                                                                )}
                                                                <Text style={[styles.dropdownItemText, cat.depth > 0 && { color: '#64748b', fontSize: 13 }]}>
                                                                    {cat.name}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ));
                                                })()}
                                            </ScrollView>
                                        </Surface>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Description</Text>
                                    <TextInput
                                        mode="outlined"
                                        value={formData.description}
                                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                                        placeholder="What kind of assets belong to this category?"
                                        multiline
                                        numberOfLines={5}
                                        outlineColor="#e2e8f0"
                                        activeOutlineColor="#4f46e5"
                                        style={[styles.textInput, { height: 120 }]}
                                        left={<TextInput.Icon icon="text-subject" color="#64748b" />}
                                        editable={!viewOnly}
                                    />
                                </View>
                            </>
                        )}

                        <View style={styles.footer}>
                            <Button
                                mode="outlined"
                                onPress={() => navigation.navigate('AssetCategories')}
                                style={styles.cancelBtn}
                                textColor="#64748b"
                            >
                                {viewOnly ? 'CLOSE' : 'CANCEL'}
                            </Button>
                            {!viewOnly && (
                                <Button
                                    mode="contained"
                                    onPress={handleSave}
                                    loading={submitting}
                                    disabled={submitting}
                                    style={styles.saveBtn}
                                >
                                    {editingCategory ? 'SAVE CHANGES' : 'CREATE CATEGORY'}
                                </Button>
                            )}
                        </View>
                    </ScrollView>
                </Surface>
            </View>

            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={3000}
            >
                {snackbar.message}
            </Snackbar>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 40,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        maxWidth: 800,
        marginBottom: 32,
    },
    viewerContainer: {
        padding: 4,
    },
    viewRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    viewLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        width: 160,
    },
    viewValue: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    formCard: {
        width: '100%',
        maxWidth: 800,
        padding: 32,
        borderRadius: 24,
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    textInput: {
        backgroundColor: '#fff',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    selectorActive: {
        borderColor: '#4f46e5',
        borderWidth: 2,
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 15,
        color: '#1e293b',
    },
    dropdown: {
        marginTop: 4,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        elevation: 8,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#334155',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    cancelBtn: {
        borderRadius: 12,
        borderColor: '#e2e8f0',
    },
    saveBtn: {
        borderRadius: 12,
        backgroundColor: '#4f46e5',
        paddingHorizontal: 24,
    }
});

export default AddCategoryScreen;
