import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
import { Card, Text, Button, IconButton, ActivityIndicator, DataTable, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import ModuleSectionFormModal from '../../components/modals/ModuleSectionFormModal';

const ModuleSectionsScreen = ({ navigation }) => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState(null);
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { width } = useWindowDimensions();
    const isMobile = width < 1024;
    const [viewingSection, setViewingSection] = useState(null);
    const [viewingFields, setViewingFields] = useState([]);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);

    useEffect(() => {
        setPage(0);
    }, [search]);

    useEffect(() => {
        fetchSections();
    }, []);


    const fetchSections = async () => {
        try {
            setLoading(true);
            const response = await api.get('module-sections');
            setSections(response.data.data || []);
        } catch (error) {
            console.error('Fetch sections error:', error);
            Alert.alert('Error', 'Failed to load module sections.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSection = async (sectionData) => {
        try {
            if (editingSection) {
                await api.put(`module-sections/${editingSection.id}`, sectionData);
                Alert.alert('Success', 'Section updated successfully.');
            } else {
                await api.post('module-sections', sectionData);
                Alert.alert('Success', 'Section created successfully.');
            }

            fetchSections();
            setModalVisible(false);
            setEditingSection(null);
        } catch (error) {
            console.error('Save section error:', error);
            const msg = error.response?.data?.message || 'Failed to save section';
            Alert.alert('Error', msg);
        }
    };

    const handleDeleteSection = (id) => {
        setSectionToDelete(id);
        setDeleteConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (!sectionToDelete) return;
        try {
            setLoading(true);
            await api.delete(`module-sections/${sectionToDelete}`);
            setDeleteConfirmVisible(false);
            setSectionToDelete(null);
            fetchSections();
        } catch (error) {
            console.error('Delete section error:', error);
            Alert.alert('Error', 'Failed to delete section');
        } finally {
            setLoading(false);
        }
    };



    const handleViewSection = async (section) => {
        setViewingSection(section);
        setViewModalVisible(true);
        setFieldsLoading(true);
        try {
            const response = await api.get(`module-builder/sections/${section.id}/fields`);
            setViewingFields(response.data.data || []);
        } catch (error) {
            console.error('Fetch section fields error:', error);
            setViewingFields([]);
        } finally {
            setFieldsLoading(false);
        }
    };

    const handleEditSection = (section) => {
        setEditingSection(section);
        setModalVisible(true);
    };

    const handleAddSection = () => {
        setEditingSection(null);
        setModalVisible(true);
    };

    const filteredSections = sections.filter(s => {
        const name = (s.name || '').toLowerCase();
        const module = (s.module_name || '').toLowerCase();
        const searchStr = (search || '').toLowerCase();
        return name.includes(searchStr) || module.includes(searchStr);
    });

    return (
        <AppLayout navigation={navigation} title="Module Sections">
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.title}>Module Sections</Text>
                        <Text style={styles.subtitle}>Manage layout sections for your dynamic modules</Text>
                    </View>
                </View>

                <View style={[styles.controlsHeader, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.searchWrapper, isMobile && { width: '100%', maxWidth: '100%' }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#64748b" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search sections or modules..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, isMobile && { width: '100%' }]}
                        onPress={handleAddSection}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.addButtonText}>Add Section</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : filteredSections.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="view-grid-plus-outline" size={48} color="#94a3b8" />
                        </View>
                        <Text style={styles.emptyTitle}>No sections found</Text>
                        <Text style={styles.emptySubtitle}>
                            {search
                                ? `No results matching "${search}"`
                                : "Click + Add Section to create your first layout section."}
                        </Text>
                    </View>
                ) : (
                    <Card style={styles.tableCard}>
                        {isMobile ? (
                            <ScrollView style={{ maxHeight: 'calc(100vh - 350px)' }}>
                                {filteredSections
                                    .slice(page * itemsPerPage, (page + 1) * itemsPerPage)
                                    .map((item) => (
                                        <View key={item.id} style={styles.mobileCardItem}>
                                            <View style={styles.mobileCardInfos}>
                                                <View style={styles.mobileHeaderRow}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                                                        <MaterialCommunityIcons name="layers-outline" size={16} color="rgb(255, 152, 0)" style={{ marginRight: 8 }} />
                                                        <Text style={{ fontSize: 13, color: '#64748b' }} numberOfLines={1}>{item.module_name}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        <TouchableOpacity onPress={() => handleViewSection(item)} activeOpacity={0.7}>
                                                            <MaterialCommunityIcons name="eye-outline" size={20} color="rgb(239, 149, 10)" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleEditSection(item)} activeOpacity={0.7}>
                                                            <MaterialCommunityIcons name="pencil-outline" size={20} color="rgb(99, 102, 241)" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDeleteSection(item.id)} activeOpacity={0.7}>
                                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="rgb(152, 37, 152)" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>{item.name}</Text>
                                                <View style={styles.mobileStatsRow}>
                                                    <View style={styles.mobileStatBadge}>
                                                        <Text style={styles.mobileStatLabel}>Order:</Text>
                                                        <Text style={styles.mobileStatValue}>{item.sort_order}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                            </ScrollView>
                        ) : (
                            <DataTable>
                                <DataTable.Header style={styles.tableHeader}>
                                    <DataTable.Title style={{ flex: 3 }} textStyle={styles.headerText}>Module</DataTable.Title>
                                    <DataTable.Title style={{ flex: 3 }} textStyle={styles.headerText}>Section Name</DataTable.Title>
                                    <DataTable.Title numeric style={{ flex: 1 }} textStyle={styles.headerText}>Order</DataTable.Title>
                                    <DataTable.Title numeric style={{ flex: 2 }} textStyle={styles.headerText}>Actions</DataTable.Title>
                                </DataTable.Header>

                                <ScrollView style={styles.tableScrollView} showsVerticalScrollIndicator={true}>
                                    {filteredSections
                                        .slice(page * itemsPerPage, (page + 1) * itemsPerPage)
                                        .map((item) => (
                                            <DataTable.Row key={item.id} style={styles.row}>
                                                <DataTable.Cell style={{ flex: 3 }}>
                                                    <View style={styles.moduleCell}>
                                                        <MaterialCommunityIcons name="layers-outline" size={16} color="rgb(255, 152, 0)" style={{ marginRight: 8 }} />
                                                        <Text style={styles.moduleNameText} numberOfLines={1}>{item.module_name}</Text>
                                                    </View>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ flex: 3 }}>
                                                    <Text style={styles.sectionNameText} numberOfLines={1}>{item.name}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell numeric style={{ flex: 1 }}>
                                                    <Text style={styles.cellText}>{item.sort_order}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell numeric style={{ flex: 2 }}>
                                                    <View style={styles.actionButtons}>
                                                        <TouchableOpacity
                                                            style={[styles.actionBtn, styles.viewActionBtn]}
                                                            onPress={() => handleViewSection(item)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <MaterialCommunityIcons name="eye-outline" size={18} color="rgb(239, 149, 10)" />
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={[styles.actionBtn, styles.editActionBtn]}
                                                            onPress={() => handleEditSection(item)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <MaterialCommunityIcons name="pencil-outline" size={18} color="rgb(99, 102, 241)" />
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={[styles.actionBtn, styles.deleteActionBtn]}
                                                            onPress={() => handleDeleteSection(item.id)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="rgb(152, 37, 152)" />
                                                        </TouchableOpacity>
                                                    </View>

                                                </DataTable.Cell>
                                            </DataTable.Row>
                                        ))}
                                </ScrollView>

                            </DataTable>
                        )}

                        {/* Custom Premium Pagination Footer */}
                        <View style={[styles.paginationFooter, isMobile && { justifyContent: 'center', height: 'auto', paddingVertical: 16 }]}>
                            {!isMobile && (
                                <View style={styles.paginationLeft}>
                                    <Text style={styles.paginationInfo}>
                                        Showing <Text style={styles.paginationBold}>{page * itemsPerPage + 1}</Text> to <Text style={styles.paginationBold}>{Math.min((page + 1) * itemsPerPage, filteredSections.length)}</Text> of <Text style={styles.paginationBold}>{filteredSections.length}</Text>
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.paginationRight, isMobile && { flexWrap: 'wrap', justifyContent: 'center', gap: 4 }]}>
                                <TouchableOpacity
                                    style={[styles.pageBtn, styles.pageBtnNav, page === 0 && styles.pageBtnDisabled]}
                                    onPress={() => setPage(0)}
                                    disabled={page === 0}
                                >
                                    <MaterialCommunityIcons name="chevron-double-left" size={18} color={page === 0 ? "#cbd5e1" : "#673ab7"} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.pageBtn, styles.pageBtnNav, page === 0 && styles.pageBtnDisabled]}
                                    onPress={() => setPage(page - 1)}
                                    disabled={page === 0}
                                >
                                    <MaterialCommunityIcons name="chevron-left" size={18} color={page === 0 ? "#cbd5e1" : "#673ab7"} />
                                </TouchableOpacity>

                                {/* Page Numbers */}
                                {Array.from({ length: Math.ceil(filteredSections.length / itemsPerPage) }).map((_, i) => {
                                    if (i === page || i === 0 || i === Math.ceil(filteredSections.length / itemsPerPage) - 1 || (i >= page - 1 && i <= page + 1)) {
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                style={[styles.pageBtn, page === i ? styles.pageBtnActive : styles.pageBtnOutlined]}
                                                onPress={() => setPage(i)}
                                            >
                                                <Text style={[styles.pageBtnText, page === i ? styles.pageBtnTextActive : styles.pageBtnTextOutlined]}>
                                                    {i + 1}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }
                                    return null;
                                })}

                                <TouchableOpacity
                                    style={[styles.pageBtn, styles.pageBtnNav, (page >= Math.ceil(filteredSections.length / itemsPerPage) - 1) && styles.pageBtnDisabled]}
                                    onPress={() => setPage(page + 1)}
                                    disabled={page >= Math.ceil(filteredSections.length / itemsPerPage) - 1}
                                >
                                    <MaterialCommunityIcons name="chevron-right" size={18} color={(page >= Math.ceil(filteredSections.length / itemsPerPage) - 1) ? "#cbd5e1" : "#673ab7"} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.pageBtn, styles.pageBtnNav, (page >= Math.ceil(filteredSections.length / itemsPerPage) - 1) && styles.pageBtnDisabled]}
                                    onPress={() => setPage(Math.ceil(filteredSections.length / itemsPerPage) - 1)}
                                    disabled={page >= Math.ceil(filteredSections.length / itemsPerPage) - 1}
                                >
                                    <MaterialCommunityIcons name="chevron-double-right" size={18} color={(page >= Math.ceil(filteredSections.length / itemsPerPage) - 1) ? "#cbd5e1" : "#673ab7"} />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </Card>
                )}

                <View style={styles.decorationLine} />

                <ModuleSectionFormModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSave={handleSaveSection}
                    section={editingSection}
                />

                {/* View Details Modal */}
                <Portal>
                    <Modal
                        visible={viewModalVisible}
                        onDismiss={() => setViewModalVisible(false)}
                        contentContainerStyle={styles.detailModal}
                    >
                        <View style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <View style={styles.detailIconCircle}>
                                    <MaterialCommunityIcons name="information-outline" size={28} color="#6366f1" />
                                </View>
                                <View>
                                    <Text style={styles.detailTitle}>Section Details</Text>
                                    <Text style={styles.detailSubtitle}>Detailed information about this section</Text>
                                </View>
                                <IconButton
                                    icon="close"
                                    onPress={() => setViewModalVisible(false)}
                                    style={styles.closeBtn}
                                />
                            </View>

                            <View style={styles.detailContent}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Module Name</Text>
                                    <View style={styles.detailValueWrapper}>
                                        <MaterialCommunityIcons name="layers" size={16} color="#6366f1" style={{ marginRight: 8 }} />
                                        <Text style={styles.detailValue}>{viewingSection?.module_name}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Section Name</Text>
                                    <Text style={[styles.detailValue, { fontWeight: '700', color: '#1e293b' }]}>
                                        {viewingSection?.name}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Creation Date</Text>
                                    <Text style={styles.detailValue}>
                                        {viewingSection?.created_at ? new Date(viewingSection.created_at).toLocaleDateString() : 'N/A'}
                                    </Text>
                                </View>

                                <View style={styles.sectionDivider} />

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Fields & Options</Text>
                                    {fieldsLoading ? (
                                        <ActivityIndicator size="small" color="#6366f1" style={{ marginTop: 10 }} />
                                    ) : viewingFields.length === 0 ? (
                                        <Text style={styles.emptySmallText}>No fields defined for this section.</Text>
                                    ) : (
                                        <View style={{ marginTop: 8 }}>
                                            {viewingFields.map((field, idx) => (
                                                <View key={field.id} style={styles.fieldDetailRow}>
                                                    <View style={styles.fieldInfo}>
                                                        <Text style={styles.fieldName}>{idx + 1}. {field.label}</Text>
                                                        <Text style={styles.fieldType}>{field.field_type.toUpperCase()}</Text>
                                                    </View>
                                                    {field.options && field.options.length > 0 && (
                                                        <View style={styles.optionsWrapper}>
                                                            {field.options.map((opt, i) => (
                                                                <View key={i} style={styles.optionTag}>
                                                                    <Text style={styles.optionText}>{opt.option_label}</Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.detailFooter}>
                                <Button
                                    mode="contained"
                                    onPress={() => setViewModalVisible(false)}
                                    style={styles.detailCloseBtn}
                                    labelStyle={styles.detailCloseBtnText}
                                    buttonColor="#5e35a1"
                                >
                                    Close Details
                                </Button>
                            </View>
                        </View>
                    </Modal>
                </Portal>

                <Portal>
                    <Modal
                        visible={deleteConfirmVisible}
                        onDismiss={() => setDeleteConfirmVisible(false)}
                        contentContainerStyle={styles.confirmModal}
                    >
                        <View style={styles.confirmHeader}>
                            <View style={styles.warningIconCircle}>
                                <MaterialCommunityIcons name="alert-outline" size={32} color="#ef4444" />
                            </View>
                            <Text style={styles.confirmTitle}>Delete Section?</Text>
                            <Text style={styles.confirmSubtitle}>
                                Are you sure you want to delete this section? This action cannot be undone and may affect the layout of your modules.
                            </Text>
                        </View>

                        <View style={styles.confirmFooter}>
                            <Button
                                mode="outlined"
                                onPress={() => setDeleteConfirmVisible(false)}
                                style={styles.cancelBtn}
                                labelStyle={{ color: '#64748b' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={confirmDelete}
                                style={styles.deleteBtn}
                                loading={loading}
                            >
                                Delete Now
                            </Button>
                        </View>
                    </Modal>
                </Portal>
            </ScrollView>
        </AppLayout>
    );
};


const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    pageHeader: {

        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#673ab7',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
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
        borderColor: 'rgb(255, 255, 255)',
        paddingHorizontal: 16,
        height: 48,
        shadowColor: 'rgba(99, 99, 99, 0.2)',
        shadowOffset: { width: -5, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 18,
        elevation: 6,
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
        backgroundColor: '#673ab7',
        paddingHorizontal: 20,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#673ab7',
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
    tableScrollView: {
        maxHeight: 420, // Adjusted to fit 7-8 rows + footer comfortably on most screens
    },
    tableCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#e8e0f0',
        overflow: 'hidden',
        width: '100%',
        flexShrink: 1,
        shadowColor: '#673ab7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },



    tableHeader: {
        backgroundColor: '#673ab7',
        borderBottomWidth: 1,
        borderBottomColor: '#5e35a1',
    },
    headerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    row: {
        borderBottomColor: '#e2e8f0',
        borderBottomWidth: 1,
        borderStyle: 'dotted',
        height: 64,
    },
    moduleCell: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moduleNameText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    sectionNameText: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    cellText: {
        fontSize: 13,
        color: '#64748b',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewActionBtn: {
        backgroundColor: 'transparent',
    },
    editActionBtn: {
        backgroundColor: 'transparent',
    },
    deleteActionBtn: {
        backgroundColor: 'transparent',
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
    },
    paginationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 72,
        paddingHorizontal: 24,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },


    paginationLeft: {
        flex: 1,
        justifyContent: 'center',
    },

    paginationInfo: {
        fontSize: 13,
        color: '#64748b',
    },
    paginationRight: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    pageBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pageBtnNav: {
        backgroundColor: '#f8fafc',
    },
    pageBtnOutlined: {
        backgroundColor: 'white',
        borderColor: '#e2e8f0',
    },
    pageBtnActive: {
        backgroundColor: '#673ab7',
        borderColor: '#673ab7',
    },
    pageBtnDisabled: {
        opacity: 0.5,
        backgroundColor: '#f1f5f9',
    },
    pageBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    pageBtnTextActive: {
        color: 'white',
    },
    pageBtnTextOutlined: {
        color: '#673ab7',
    },
    paginationBold: {
        fontWeight: '700',
        color: '#1e293b',
    },



    confirmModal: {

        backgroundColor: 'white',
        padding: 32,
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: 24,
    },
    confirmHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    warningIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
    },
    confirmSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
    confirmFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        borderRadius: 12,
        borderColor: '#e2e8f0',
    },
    deleteBtn: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: '#ef4444',
    },
    detailModal: {
        backgroundColor: 'transparent',
        padding: 20,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    detailCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
    },
    detailSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    detailContent: {
        padding: 24,
        gap: 20,
    },
    detailRow: {
        gap: 6,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValueWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailValue: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '500',
    },
    detailFooter: {
        padding: 24,
        paddingTop: 0,
    },
    detailCloseBtn: {
        borderRadius: 12,
        paddingVertical: 4,
        backgroundColor: '#5e35a1',
    },
    detailCloseBtnText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    decorationLine: {
        height: 1,
        backgroundColor: '#e2e8f0',
        width: '100%',
        marginVertical: 10,
        opacity: 0.5,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 8,
    },
    fieldDetailRow: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    fieldInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    fieldName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    fieldType: {
        fontSize: 10,
        color: '#6366f1',
        fontWeight: '700',
        backgroundColor: '#eef2ff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    optionsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    optionTag: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    optionText: {
        fontSize: 11,
        color: '#64748b',
    },
    emptySmallText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 8,
    },
    // Mobile Styles
    mobileCardItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: 'white',
    },
    mobileCardInfos: {
        gap: 8,
    },
    mobileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mobileStatsRow: {
        marginTop: 8,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    mobileStatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    mobileStatLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    mobileStatValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e293b',
    },
});



export default ModuleSectionsScreen;
