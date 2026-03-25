import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, useWindowDimensions, Image } from 'react-native';
import { Text, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/client';
import DateField from './form/DateField';

const AssetFormModal = ({ visible, onClose, onSave, asset, viewMode = false, onEditPress }) => {
    const { height, width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        asset_code: '',
        category_id: '',
        sub_category: '',
        brand: '',
        model: '',
        serial_number: '',
        asset_tag: '',
        purchase_date: '',
        warranty_expiry: '',
        cost: '',
        status: 'AVAILABLE',
        description: ''
    });

    const generateBarcode = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(100 + Math.random() * 899); // 3 digit
        return `AST-${year}${month}${day}-${random}`;
    };

    const generateAssetCode = () => {
        const now = new Date();
        const year = now.getFullYear().toString().substr(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(100 + Math.random() * 899); // 3 digit
        return `AST-${year}${month}-${random}`;
    };

    const [employees, setEmployees] = useState([]);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            if (res.data.success) {
                setEmployees(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        if (visible) {
            console.log('MODAL OPENED with Asset Prop:', JSON.stringify(asset, null, 2));
            fetchCategories();
            fetchEmployees();
            setFormData({
                name: asset?.name || '',
                asset_code: asset?.asset_code || generateAssetCode(),
                category_id: asset?.category_id ? String(asset.category_id) : '',
                sub_category: asset?.sub_category || '',
                brand: asset?.brand || '',
                model: asset?.model || '',
                serial_number: asset?.serial_number || '',
                asset_tag: asset?.asset_tag || generateBarcode(),
                purchase_date: asset?.purchase_date || '',
                warranty_expiry: asset?.warranty_expiry || '',
                cost: asset?.cost ? String(asset.cost) : '',
                status: asset?.status || 'AVAILABLE',
                description: asset?.description || '',
                quantity: asset?.quantity ? String(asset.quantity) : '1',
                current_holder_id: asset?.current_holder_id ? String(asset.current_holder_id) : ''
            });
        }
    }, [visible, asset]);

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

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const res = await api.get('categories');
            if (res.data.success) {
                setCategories(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching categories in modal:', err);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Simple validation check
        if (!formData.name.trim()) return;

        onSave(formData);
        // Reset form
        setFormData({
            name: '', asset_code: '', category_id: '', sub_category: '',
            brand: '', model: '', serial_number: '', asset_tag: '',
            purchase_date: '', warranty_expiry: '', cost: '', status: 'AVAILABLE', description: ''
        });
    };

    const renderInput = (label, value, field, placeholder = '', type = 'default') => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, viewMode && { backgroundColor: '#F8FAFC' }]}
                value={value?.toString()}
                onChangeText={(text) => handleChange(field, text)}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={type === 'number' ? 'numeric' : 'default'}
                editable={!viewMode}
            />
        </View>
    );

    const renderViewTableRow = (label, value) => (
        <View style={styles.viewTableRow}>
            <Text style={styles.viewRowLabel}>{label}</Text>
            <Text style={styles.viewRowValue}>{value || '---'}</Text>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.modalContainer, { maxHeight: height * 0.9, width: isDesktop ? 750 : '95%' }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={styles.headerIconBox}>
                                <MaterialCommunityIcons name="cube-outline" size={24} color="#3b82f6" />
                            </View>
                            <View>
                                <Text style={styles.title}>{viewMode ? 'Asset Details' : asset ? 'Edit Asset' : 'Add New Asset'}</Text>
                                <Text style={styles.subtitle}>{viewMode ? 'View details about this asset item' : 'Fill in details to register a product / equipment'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                        {viewMode ? (
                            <View style={{ padding: 16 }}>
                                {/* Section 1 */}
                                <View style={styles.viewSectionBox}>
                                    <View style={styles.viewSectionHeader}>
                                        <Text style={styles.viewSectionTitle}>1. Classification</Text>
                                    </View>
                                    <View style={styles.viewSubHeader}>
                                        <Text style={styles.viewSubHeaderText}>FIELD NAME</Text>
                                        <Text style={styles.viewSubHeaderText}>DATA VALUE</Text>
                                    </View>
                                    <View style={styles.viewTableBody}>
                                        {(() => {
                                            const cat = categories.find(c => c.id.toString() === formData.category_id);
                                            const parent = cat ? categories.find(p => p.id === cat.parent_id) : null;
                                            return (
                                                <>
                                                    {parent && renderViewTableRow('Parent Category', parent.name)}
                                                    {renderViewTableRow('Asset Category', cat?.name || '---')}
                                                    {renderViewTableRow('Quantity', formData.quantity || '1')}
                                                    {(formData.status === 'ASSIGNED' || formData.status === 'IN_USE' || formData.status === 'ALLOCATED') && (
                                                        <>
                                                            {renderViewTableRow('Assigned To', asset?.current_holder_name || '---')}
                                                            {renderViewTableRow('Department', asset?.department_name || '---')}
                                                        </>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        {renderViewTableRow('Asset Name', formData.name)}
                                        {renderViewTableRow('Internal Asset Code', formData.asset_code)}
                                    </View>
                                </View>

                                {/* Section 2 */}
                                <View style={[styles.viewSectionBox, { marginTop: 20 }]}>
                                    <View style={styles.viewSectionHeader}>
                                        <Text style={styles.viewSectionTitle}>2. Identification & Specs</Text>
                                    </View>
                                    <View style={styles.viewSubHeader}>
                                        <Text style={styles.viewSubHeaderText}>FIELD NAME</Text>
                                        <Text style={styles.viewSubHeaderText}>DATA VALUE</Text>
                                    </View>
                                    <View style={styles.viewTableBody}>
                                        {renderViewTableRow('Brand / Manufacturer', formData.brand)}
                                        {renderViewTableRow('Model Number', formData.model)}
                                        {renderViewTableRow('Serial Number / IMEI', formData.serial_number)}
                                        {renderViewTableRow('Asset Tag / Barcode', formData.asset_tag)}
                                    </View>
                                    {formData.asset_tag ? (
                                        <View style={[styles.barcodePreviewBox, { width: '100%', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                                            <Image
                                                source={{ uri: `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(formData.asset_tag)}&code=Code128&dpi=96` }}
                                                style={styles.barcodeImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    ) : null}
                                </View>

                                {/* Section 3 */}
                                <View style={[styles.viewSectionBox, { marginTop: 20 }]}>
                                    <View style={styles.viewSectionHeader}>
                                        <Text style={styles.viewSectionTitle}>3. Financials & Status</Text>
                                    </View>
                                    <View style={styles.viewSubHeader}>
                                        <Text style={styles.viewSubHeaderText}>FIELD NAME</Text>
                                        <Text style={styles.viewSubHeaderText}>DATA VALUE</Text>
                                    </View>
                                    <View style={styles.viewTableBody}>
                                        {renderViewTableRow('Purchase Date', formData.purchase_date ? new Date(formData.purchase_date).toLocaleDateString('en-GB') : '---')}
                                        {renderViewTableRow('Purchase Cost', formData.cost ? `$${formData.cost}` : '---')}
                                        {renderViewTableRow('Warranty Expiry', formData.warranty_expiry ? new Date(formData.warranty_expiry).toLocaleDateString('en-GB') : '---')}
                                        <View style={styles.viewTableRow}>
                                            <Text style={styles.viewRowLabel}>Current Status</Text>
                                            <View style={[styles.statusBadgeInline, { backgroundColor: formData.status === 'AVAILABLE' ? '#dcfce7' : '#ffedd5', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4 }]}>
                                                <Text style={{ color: formData.status === 'AVAILABLE' ? '#166534' : '#9a3412', fontSize: 13, fontWeight: '500' }}>
                                                    {formData.status.replace('_', ' ')}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Section 4 */}
                                <View style={[styles.viewSectionBox, { marginTop: 20 }]}>
                                    <View style={styles.viewSectionHeader}>
                                        <Text style={styles.viewSectionTitle}>4. Notes / Description</Text>
                                    </View>
                                    <View style={{ padding: 16 }}>
                                        <Text style={{ fontSize: 14, color: '#1E293B', lineHeight: 20 }}>
                                            {formData.description || 'No description provided.'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                                {/* Section 1: Classification */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>1. Classification</Text>
                                    <View style={styles.fieldGrid}>
                                        <View style={styles.inputGroupFull}>
                                            <Text style={styles.inputLabel}>Asset Category*</Text>
                                            {loadingCategories ? (
                                                <ActivityIndicator size="small" color="#3b82f6" style={{ alignSelf: 'flex-start', marginTop: 10 }} />
                                            ) : Platform.OS === 'web' ? (
                                                <select
                                                    style={{
                                                        ...styles.selectInput,
                                                        backgroundColor: viewMode ? '#F8FAFC' : 'white'
                                                    }}
                                                    value={formData.category_id}
                                                    onChange={(e) => handleChange('category_id', e.target.value)}
                                                    disabled={viewMode}
                                                >
                                                    <option value="">Select a category...</option>
                                                    {(() => {
                                                        const treeData = buildTree(categories);
                                                        const dropdownItems = flattenTreeForDropdown(treeData);

                                                        return dropdownItems.map(c => (
                                                            <option key={c.id} value={c.id}>
                                                                {'\u00A0'.repeat(c.depth * 4)}{c.depth > 0 ? '↳ ' : ''}{c.name}
                                                            </option>
                                                        ));
                                                    })()}
                                                </select>
                                            ) : (
                                                <View style={styles.fakePicker}>
                                                    <Text style={styles.fakePickerText}>
                                                        {categories.find(c => c.id.toString() === formData.category_id)?.name || 'Select category...'}
                                                    </Text>
                                                    <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                                                </View>
                                            )}
                                        </View>

                                        {renderInput('Asset Name*', formData.name, 'name', 'e.g. Dell Latitude 5420')}

                                        {renderInput('Internal Asset Code', formData.asset_code, 'asset_code', 'e.g. AST-001')}

                                        {!viewMode && (
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Assign to Employee (Optional)</Text>
                                                <View style={styles.pickerWrapper}>
                                                    <select
                                                        value={formData.current_holder_id || ''}
                                                        onChange={(e) => handleChange('current_holder_id', e.target.value)}
                                                        style={styles.picker}
                                                    >
                                                        <option value="">-- Leave AVAILABLE --</option>
                                                        {employees.map(emp => (
                                                            <option key={emp.id} value={emp.id}>
                                                                {emp.name} {emp.position ? `(${emp.position})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </View>
                                            </View>
                                        )}

                                        {!viewMode && (
                                            <View style={[styles.inputGroup, { marginTop: 15 }]}>
                                                <Text style={styles.inputLabel}>Product Image</Text>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => handleChange('image_data', reader.result);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    style={{ marginVertical: 8, fontSize: 13, color: '#475569' }}
                                                />
                                                {formData.image_data && (
                                                    <Image
                                                        source={{ uri: formData.image_data }}
                                                        style={{ width: 120, height: 120, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' }}
                                                    />
                                                )}
                                            </View>
                                        )}

                                        {viewMode && formData.image_data && (
                                            <View style={[styles.inputGroup, { alignItems: 'center', marginTop: 15 }]}>
                                                <Text style={[styles.inputLabel, { width: '100%', textAlign: 'left' }]}>Product Image</Text>
                                                <Image
                                                    source={{ uri: formData.image_data }}
                                                    style={{ width: 160, height: 160, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' }}
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Section 2: Identification */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>2. Identification & Specs</Text>
                                    <View style={styles.fieldGrid}>
                                        {renderInput('Brand / Manufacturer', formData.brand, 'brand', 'e.g. Dell, HP, Apple')}
                                        {renderInput('Model Number', formData.model, 'model', 'e.g. Latitude 5420')}
                                        {renderInput('Serial Number / IMEI', formData.serial_number, 'serial_number', 'e.g. CN-0X1234')}
                                        {renderInput('Quantity', formData.quantity, 'quantity', 'e.g. 1', 'numeric')}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Asset Tag / Barcode</Text>
                                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                                <TextInput
                                                    style={[styles.input, { flex: 1, height: 44 }, viewMode && { backgroundColor: '#F8FAFC' }]}
                                                    value={formData.asset_tag}
                                                    onChangeText={(text) => handleChange('asset_tag', text)}
                                                    placeholder="e.g. AST-202611-102"
                                                    placeholderTextColor="#94A3B8"
                                                    editable={!viewMode}
                                                />
                                                {!viewMode && (
                                                    <TouchableOpacity style={styles.generateBtn} onPress={() => handleChange('asset_tag', generateBarcode())}>
                                                        <MaterialCommunityIcons name="auto-fix" size={20} color="white" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            {formData.asset_tag ? (
                                                <View style={styles.barcodePreviewBox}>
                                                    <Image
                                                        source={{ uri: `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(formData.asset_tag)}&code=Code128&dpi=96` }}
                                                        style={styles.barcodeImage}
                                                        resizeMode="contain"
                                                    />
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>

                                {/* Section 3: Financial & Status */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>3. Financials & Status</Text>
                                    <View style={styles.fieldGrid}>
                                        <View style={styles.inputGroup}>
                                            <DateField
                                                label="Purchase Date"
                                                value={formData.purchase_date}
                                                onChange={(val) => handleChange('purchase_date', val)}
                                                readOnly={viewMode}
                                            />
                                        </View>
                                        {renderInput('Purchase Cost', formData.cost, 'cost', 'e.g. 1500', 'number')}
                                        <View style={styles.inputGroup}>
                                            <DateField
                                                label="Warranty Expiry"
                                                value={formData.warranty_expiry}
                                                onChange={(val) => handleChange('warranty_expiry', val)}
                                                readOnly={viewMode}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Current Status</Text>
                                            <View style={styles.chipRow}>
                                                {['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'].map(status => (
                                                    <Chip
                                                        key={status}
                                                        selected={formData.status === status}
                                                        onPress={() => !viewMode && handleChange('status', status)}
                                                        style={[styles.statusChip, formData.status === status && styles.statusChipSelected]}
                                                        textStyle={styles.statusChipText}
                                                    >
                                                        {status.replace('_', ' ')}
                                                    </Chip>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Section 4: Description */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>4. Notes / Description</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, viewMode && { backgroundColor: '#F8FAFC' }]}
                                        value={formData.description}
                                        onChangeText={(text) => handleChange('description', text)}
                                        placeholder="Add additional specs, configurations, or allocation notes..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        numberOfLines={3}
                                        editable={!viewMode}
                                    />
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>{viewMode ? 'Close' : 'Cancel'}</Text>
                        </TouchableOpacity>
                        {viewMode ? (
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#3b82f6' }]} onPress={() => onEditPress && onEditPress()}>
                                <Text style={styles.saveButtonText}>Edit Details</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.saveButton, !formData.name.trim() && { opacity: 0.6 }]} onPress={handleSave} disabled={!formData.name.trim()}>
                                <Text style={styles.saveButtonText}>Save Asset</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', // Slate style backdrop
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    closeBtn: {
        padding: 8,
    },
    scrollArea: {
        padding: 24,
        flex: 1,
    },
    section: {
        marginBottom: 28,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    inputGroup: {
        flexBasis: '48%',
        minWidth: 240,
        flexGrow: 1,
    },
    inputGroupFull: {
        width: '100%',
        marginBottom: 4,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: '#1E293B',
        height: 44,
    },
    selectInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: '#1E293B',
        height: 44,
        width: '100%',
        outline: 'none',
    },
    fakePicker: {
        height: 44,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
    },
    fakePickerText: {
        fontSize: 14,
        color: '#64748B',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    statusChip: {
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    statusChipSelected: {
        backgroundColor: '#DBEAFE',
    },
    statusChipText: {
        fontSize: 11,
        fontWeight: '600',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    generateBtn: {
        height: 44,
        width: 44,
        backgroundColor: '#3b82f6',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    barcodePreviewBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 12,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    barcodeImage: {
        width: '100%',
        height: '100%',
    },
    viewSectionBox: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    viewSectionHeader: {
        backgroundColor: '#4338CA', // Indigo primary lookup matching header specs
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    viewSectionTitle: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    viewSubHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    viewSubHeaderText: {
        flex: 1,
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    viewTableBody: {},
    viewTableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    viewRowLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    viewRowValue: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    viewSection: {
        marginBottom: 8,
    },
    viewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    viewFieldContainer: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    viewFieldLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 4,
    },
    viewFieldValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    viewDescriptionText: {
        fontSize: 14,
        color: '#1E293B',
        lineHeight: 20,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 12,
    },
    statusBadgeInline: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
});

export default AssetFormModal;
