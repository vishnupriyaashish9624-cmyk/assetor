import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const CompanyInfoView = ({ company }) => {
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        if (company) {
            fetchDocuments();
        }
    }, [company]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/companies/${company.id}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDocuments(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching company docs:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!company) return null;

    const InfoRow = ({ label, value, icon }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={icon} size={15} color="#64748b" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    const Section = ({ title, icon, children }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name={icon} size={16} color="#3b82f6" />
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {/* Header Information */}
            <View style={styles.header}>
                <View style={styles.logoBox}>
                    <MaterialCommunityIcons name="domain" size={30} color="#3b82f6" />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.subdomain}>{company.subdomain}.trakio.com</Text>
                    <View style={[styles.statusBadge, { backgroundColor: company.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2' }]}>
                        <Text style={[styles.statusText, { color: company.status === 'ACTIVE' ? '#10b981' : '#ef4444' }]}>
                            {company.status}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.grid}>
                {/* Identity & Tenancy */}
                <View style={styles.column}>
                    <Section title="Identity" icon="fingerprint">
                        <InfoRow label="Company Code" value={company.company_code} icon="barcode-scan" />
                        <InfoRow label="Trade License" value={company.trade_license} icon="file-certificate" />
                        <InfoRow label="Tax Number" value={company.tax_no} icon="book-information-variant" />
                        <InfoRow label="Industry" value={company.industry} icon="factory" />
                    </Section>

                    <Section title="Tenancy" icon="home-city">
                        <InfoRow label="Type" value={company.tenancy_type} icon="office-building" />
                        <InfoRow label="Landlord" value={company.landlord_name} icon="account-tie" />
                        <InfoRow label="Contract Start" value={company.contract_start_date} icon="calendar-import" />
                        <InfoRow label="Contract End" value={company.contract_end_date} icon="calendar-export" />
                    </Section>
                </View>

                {/* Location & Contact */}
                <View style={styles.column}>
                    <Section title="Location" icon="map-marker">
                        <InfoRow label="Country" value={company.country} icon="earth" />
                        <InfoRow label="City / State" value={`${company.city || ''}, ${company.state || ''}`} icon="city-variant" />
                        <InfoRow label="Area" value={company.area} icon="map-legend" />
                        <InfoRow label="Address" value={company.address} icon="home-map-marker" />
                        <InfoRow label="Makani" value={company.makani_number} icon="numeric" />
                    </Section>

                    <Section title="Contact" icon="phone">
                        <InfoRow label="Telephone" value={company.telephone} icon="phone" />
                        <InfoRow label="Email" value={company.email} icon="email" />
                        <InfoRow label="Website" value={company.website} icon="web" />
                    </Section>
                </View>
            </View>

            {/* Documents Section */}
            <Section title="Company Documents" icon="file-document-multiple">
                {loading ? (
                    <ActivityIndicator color="#3b82f6" style={{ marginVertical: 10 }} />
                ) : documents.length > 0 ? (
                    <View style={styles.docList}>
                        {documents.map(doc => (
                            <TouchableOpacity
                                key={doc.id}
                                style={styles.docItem}
                                onPress={() => Linking.openURL(doc.url)}
                            >
                                <View style={styles.docIconBox}>
                                    <MaterialCommunityIcons name="file-pdf-box" size={24} color="#ef4444" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.docName}>{doc.name}</Text>
                                    <Text style={styles.docType}>{doc.file_type}</Text>
                                </View>
                                <MaterialCommunityIcons name="open-in-new" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyDocs}>No documents uploaded for this company.</Text>
                )}
            </Section>

            {/* Limits Section */}
            <Section title="Allocated Limits" icon="shield-check">
                <View style={styles.limitGrid}>
                    <View style={styles.limitCard}>
                        <Text style={styles.limitVal}>{company.max_employees}</Text>
                        <Text style={styles.limitLab}>Max Staff</Text>
                    </View>
                    <View style={styles.limitCard}>
                        <Text style={styles.limitVal}>{company.max_assets}</Text>
                        <Text style={styles.limitLab}>Max Assets</Text>
                    </View>
                </View>
            </Section>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 2, maxHeight: 520 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    logoBox: {
        width: 46,
        height: 46,
        borderRadius: 8,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    headerText: { marginLeft: 12, flex: 1 },
    companyName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    subdomain: { fontSize: 12, color: '#64748b', marginTop: 1 },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
    column: { flex: 1, minWidth: 260, paddingHorizontal: 6 },
    section: { marginBottom: 12 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: { paddingLeft: 2 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconCircle: {
        width: 24,
        height: 24,
        borderRadius: 5,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTextContainer: { marginLeft: 8 },
    infoLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' },
    infoValue: { fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 0 },
    docList: { gap: 8 },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    docIconBox: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    docName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
    docType: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
    emptyDocs: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
    limitGrid: { flexDirection: 'row', gap: 10 },
    limitCard: {
        flex: 1,
        backgroundColor: '#f0f9ff',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    limitVal: { fontSize: 17, fontWeight: '800', color: '#0369a1' },
    limitLab: { fontSize: 10, color: '#0ea5e9', fontWeight: '600', marginTop: 1 },
});

export default CompanyInfoView;
