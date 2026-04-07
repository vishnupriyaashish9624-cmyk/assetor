import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseModal from './BaseModal';

import { getCompanyModules } from '../../api/officeApi';

const Section = ({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

const Field = ({ label, value, fullWidth = false }) => {
    if (!value && value !== 0) return null;
    return (
        <View style={[styles.field, fullWidth && { width: '100%' }]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{value}</Text>
        </View>
    );
};

const StatusPill = ({ status }) => {
    const isInactive = status === 'INACTIVE';
    return (
        <View style={[styles.pill, isInactive ? styles.pillInactive : styles.pillActive]}>
            <Text style={[styles.pillText, isInactive ? styles.pillTextInactive : styles.pillTextActive]}>
                {status || 'ACTIVE'}
            </Text>
        </View>
    );
};

const PremiseDetailsModal = ({ visible, onClose, data, onEdit }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [linkedModules, setLinkedModules] = useState([]);

    useEffect(() => {
        if (visible && data) {
            fetchLinkedModules();
        }
    }, [visible, data]);

    const fetchLinkedModules = async () => {
        if (!data) return;
        try {
            const result = await getCompanyModules();
            if (result.success) {
                // Filter Logic:
                // 1. Module MUST have a premises_type set (otherwise it's not a premise-linked module)
                // 2. That type MUST match current premise type (premises_use)
                // 3. IF module has a country set, it MUST match premise country. If module country is null, it's global? (Assumed)
                const matches = result.data.filter(m => {
                    if (!m.premises_type) return false;
                    const typeMatch = m.premises_type.toLowerCase() === (data.premises_use || data.premise_type || '').toLowerCase();
                    if (!typeMatch) return false;

                    if (m.country) {
                        return m.country.toLowerCase() === (data.country || '').toLowerCase();
                    }
                    return true;
                });
                setLinkedModules(matches);
            }
        } catch (e) {
            console.error('Failed to link modules', e);
        }
    };

    if (!data) return null;

    const isOwned = data.premise_type === 'OWNED';

    return (
        <BaseModal
            visible={visible}
            onClose={onClose}
            title="Premises Details"
            width={900}
        >
            <View style={styles.container}>
                {/* Header Summary */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>{data.premises_name}</Text>
                        <Text style={styles.headerSub}>{data.premise_type} • {data.building_name}</Text>
                    </View>
                    <StatusPill status={data.status} />
                </View>

                <ScrollView style={styles.scrollContent} contentContainerStyle={{ padding: 24, gap: 24 }}>

                    {/* A) Basic Info */}
                    <Section title="Basic Information">
                        <Field label="Premises Name" value={data.premises_name} />
                        <Field label="Building Name" value={data.building_name} />
                        <Field label="Premises Type" value={data.premises_use || data.premise_type} />
                        {isOwned ? (
                            <>
                                <Field label="Area (Sq ft)" value={data.property_size_sqft} />
                                <Field label="Floors" value={data.floors_count} />
                            </>
                        ) : null}
                        <Field label="Capacity" value={data.capacity} />
                        <Field label="Notes" value={data.location_notes || data.notes} fullWidth />
                    </Section>

                    {/* Custom / Dynamic Fields */}
                    {Object.keys(data).filter(key =>
                        !['premises_name', 'building_name', 'premises_use', 'premise_type', 'property_size_sqft', 'floors_count', 'capacity', 'location_notes', 'notes', 'country', 'city', 'full_address', 'address_line2', 'landmark', 'google_map_url', 'buy_date', 'purchase_value', 'renewal_date', 'title_deed_ref', 'owner_name', 'landlord_name', 'landlord_contact_person', 'landlord_phone', 'contract_start', 'contract_end', 'security_deposit', 'renewal_reminder_date', 'payment_frequency', 'yearly_rent', 'monthly_rent', 'next_payment_date', 'electricity_available', 'water_available', 'internet_available', 'electricity_id', 'water_id', 'document_path', 'image_path', 'premise_id', 'id', 'created_at', 'updated_at', 'status', 'company_id'].includes(key) &&
                        !key.endsWith('_name') && !key.endsWith('_policy_no') && !key.endsWith('_coverage_type') && !key.endsWith('_issue_date') && !key.endsWith('_start_date') && !key.endsWith('_end_date') && !key.endsWith('_expiry_date') && !key.endsWith('_reminder') &&
                        data[key] !== null && data[key] !== ''
                    ).length > 0 && (
                            <Section title="Additional Information">
                                {Object.keys(data).filter(key =>
                                    !['premises_name', 'building_name', 'premises_use', 'premise_type', 'property_size_sqft', 'floors_count', 'capacity', 'location_notes', 'notes', 'country', 'city', 'full_address', 'address_line2', 'landmark', 'google_map_url', 'buy_date', 'purchase_value', 'renewal_date', 'title_deed_ref', 'owner_name', 'landlord_name', 'landlord_contact_person', 'landlord_phone', 'contract_start', 'contract_end', 'security_deposit', 'renewal_reminder_date', 'payment_frequency', 'yearly_rent', 'monthly_rent', 'next_payment_date', 'electricity_available', 'water_available', 'internet_available', 'electricity_id', 'water_id', 'document_path', 'image_path', 'premise_id', 'id', 'created_at', 'updated_at', 'status', 'company_id'].includes(key) &&
                                    !key.endsWith('_name') && !key.endsWith('_policy_no') && !key.endsWith('_coverage_type') && !key.endsWith('_issue_date') && !key.endsWith('_start_date') && !key.endsWith('_end_date') && !key.endsWith('_expiry_date') && !key.endsWith('_reminder') &&
                                    data[key] !== null && data[key] !== ''
                                ).map(key => (
                                    <Field key={key} label={key.replace(/_/g, ' ').toUpperCase()} value={data[key]} />
                                ))}
                            </Section>
                        )}

                    {/* B) Location */}
                    <Section title="Location Details">
                        <Field label="Country" value={data.country} />
                        <Field label="City" value={data.city} />
                        <Field label="Address Line 1" value={data.full_address} fullWidth />
                        <Field label="Address Line 2" value={data.address_line2} />
                        <Field label="Landmark" value={data.landmark} />
                        {data.google_map_url ? (
                            <View style={[styles.field, { width: '100%' }]}>
                                <Text style={styles.fieldLabel}>Google Map Link</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(data.google_map_url)}>
                                    <Text style={[styles.fieldValue, { color: '#3b82f6', textDecorationLine: 'underline' }]}>View on Map</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </Section>

                    {/* C) Ownership / Contract */}
                    <Section title={isOwned ? "Ownership Details" : "Contract Details"}>
                        {isOwned ? (
                            <>
                                <Field label="Buy Date" value={data.buy_date ? new Date(data.buy_date).toLocaleDateString() : 'N/A'} />
                                <Field label="Purchase Value" value={data.purchase_value ? `$${data.purchase_value.toLocaleString()}` : null} />
                                <Field label="Warranty / Renewal Date" value={data.renewal_date ? new Date(data.renewal_date).toLocaleDateString() : null} />
                                <Field label="Ownership Reference" value={data.title_deed_ref || data.owner_name} />
                            </>
                        ) : (
                            <>
                                <Field label="Landlord Name" value={data.landlord_name} />
                                <Field label="Landlord Contact" value={data.landlord_contact_person} />
                                <Field label="Phone/Email" value={data.landlord_phone} />
                                <Field label="Contract Start" value={data.contract_start ? new Date(data.contract_start).toLocaleDateString() : '-'} />
                                <Field label="Contract End" value={data.contract_end ? new Date(data.contract_end).toLocaleDateString() : '-'} />
                                <Field label="Deposit Amount" value={data.security_deposit ? `$${data.security_deposit.toLocaleString()}` : null} />
                                <Field label="Renewal Date" value={data.renewal_reminder_date ? new Date(data.renewal_reminder_date).toLocaleDateString() : null} />
                            </>
                        )}
                    </Section>

                    {/* D) Financial Summary */}
                    <Section title="Financial Summary">
                        <Field label="Payment Frequency" value={data.payment_frequency} />
                        <Field label="Rent / Annual Amount" value={data.yearly_rent ? `$${data.yearly_rent.toLocaleString()}` : (data.monthly_rent ? `$${data.monthly_rent.toLocaleString()} / mo` : null)} />
                        {/* Currency assumed from context for now or add if in DB */}
                        <Field label="Next Due Date" value={data.next_payment_date ? new Date(data.next_payment_date).toLocaleDateString() : null} />
                    </Section>

                    {/* E) Utilities */}
                    {(data.electricity_available || data.water_available || data.internet_available || data.electricity_id || data.water_id) && (
                        <Section title="Utilities">
                            {/* Attempt to map fields to Spec names */}
                            <Field label="Electricity / DEWA No" value={data.electricity_id || (data.electricity_available ? 'Available' : null)} />
                            <Field label="Water No" value={data.water_id || (data.water_available ? 'Available' : null)} />
                            <Field label="Internet Provider" value={data.internet_available ? 'Available' : null} />
                            {/* Utility Notes not in DB explicitly but could be 'notes' subfield */}
                        </Section>
                    )}

                    {/* F) Documents */}
                    {/* F) Documents */}
                    <Section title="Documents">
                        {/* Static Document */}
                        {(data.document_path || data.image_path) && (
                            <View style={styles.docCard}>
                                <MaterialCommunityIcons name="file-document-outline" size={32} color="#3b82f6" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.docName}>{data.document_name || 'Main Document'}</Text>
                                    <Text style={styles.docMeta}>Attached Document</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        style={styles.docBtn}
                                        onPress={() => {
                                            const baseUrl = 'http://localhost:5032';
                                            const url = data.document_url || `${baseUrl}${data.document_path || data.image_path}`;
                                            if (Platform.OS === 'web') window.open(url, '_blank');
                                        }}
                                    >
                                        <Text style={styles.docBtnText}>View</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.docBtn}
                                        onPress={() => {
                                            const baseUrl = 'http://localhost:5032';
                                            const url = data.document_url || `${baseUrl}${data.document_path || data.image_path}`;
                                            if (Platform.OS === 'web') {
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = data.document_name || 'download';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }
                                        }}
                                    >
                                        <Text style={styles.docBtnText}>Download</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Dynamic Documents */}
                        {Object.keys(data).filter(key =>
                            typeof data[key] === 'string' &&
                            data[key].includes('/uploads/') &&
                            !['document_path', 'image_path'].includes(key) &&
                            !key.endsWith('_name')
                        ).map(key => (
                            <View key={key} style={[styles.docCard, { marginTop: 12 }]}>
                                <MaterialCommunityIcons name="file-document-outline" size={32} color="#10b981" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.docName}>{data[`${key}_name`] || key.replace(/_/g, ' ')}</Text>
                                    <Text style={styles.docMeta}>Dynamic Field Document</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        style={styles.docBtn}
                                        onPress={() => {
                                            const baseUrl = 'http://localhost:5032';
                                            const url = data[key].startsWith('http') ? data[key] : `${baseUrl}${data[key]}`;
                                            if (Platform.OS === 'web') window.open(url, '_blank');
                                        }}
                                    >
                                        <Text style={styles.docBtnText}>View</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.docBtn}
                                        onPress={() => {
                                            const baseUrl = 'http://localhost:5032';
                                            const url = data[key].startsWith('http') ? data[key] : `${baseUrl}${data[key]}`;
                                            if (Platform.OS === 'web') {
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = data[`${key}_name`] || 'download';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }
                                        }}
                                    >
                                        <Text style={styles.docBtnText}>Download</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {!data.document_path && !data.image_path &&
                            !Object.keys(data).some(key => typeof data[key] === 'string' && data[key].includes('/uploads/') && !['document_path', 'image_path'].includes(key)) && (
                                <Text style={styles.noDocs}>No documents uploaded</Text>
                            )}
                    </Section>

                    {/* G) Associated Modules */}
                    {linkedModules.length > 0 && (
                        <Section title="Associated Modules">
                            {linkedModules.map(mod => (
                                <View key={mod.id} style={styles.moduleCard}>
                                    <MaterialCommunityIcons name="layers-outline" size={24} color="#3b82f6" />
                                    <View>
                                        <Text style={styles.moduleName}>{mod.name}</Text>
                                        <Text style={styles.moduleMeta}>
                                            {mod.country ? `${mod.country} • ` : ''}{mod.premises_type}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </Section>
                    )}

                </ScrollView>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={onClose} style={styles.secondaryBtn}>
                        <Text style={styles.secondaryBtnText}>Close</Text>
                    </TouchableOpacity>
                    {onEdit && (
                        <TouchableOpacity onPress={() => onEdit(data)} style={styles.primaryBtn}>
                            <MaterialCommunityIcons name="pencil" size={16} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.primaryBtnText}>Edit Details</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#f8fafc', overflow: 'hidden', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, width: '100%', maxHeight: '80vh' },
    scrollContent: {},

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    headerSub: { fontSize: 13, color: '#64748b', marginTop: 2, textTransform: 'uppercase', fontWeight: '600' },

    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    pillActive: { backgroundColor: '#dcfce7' },
    pillInactive: { backgroundColor: '#f1f5f9' },
    pillText: { fontSize: 12, fontWeight: '600' },
    pillTextActive: { color: '#15803d' },
    pillTextInactive: { color: '#475569' },

    section: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    sectionContent: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },

    field: { width: '45%', minWidth: 200 },
    fieldLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
    fieldValue: { fontSize: 15, color: '#1e293b', fontWeight: '500' },

    docCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', width: '100%', gap: 12 },
    docName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    docMeta: { fontSize: 12, color: '#64748b' },
    docBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6 },
    docBtnText: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
    noDocs: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },

    footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12 },
    secondaryBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
    secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3b82f6' },
    primaryBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },

    moduleCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#EFF6FF', borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE', gap: 12, width: '100%' },
    moduleName: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
    moduleMeta: { fontSize: 12, color: '#60A5FA' },
});

export default PremiseDetailsModal;
