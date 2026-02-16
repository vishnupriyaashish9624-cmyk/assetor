import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock Data
const recentAssets = [
    { id: '1', name: 'MacBook Pro M2', assetId: 'AST-0092', category: 'Laptop', serial: 'SN-MW2023X', company: 'Acme Corp', status: 'Assigned', date: 'Nov 10, 2025' },
    { id: '2', name: 'Dell XPS 15', assetId: 'AST-0091', category: 'Laptop', serial: 'SN-DL9982Y', company: 'Globex Inc', status: 'Available', date: 'Nov 11, 2025' },
    { id: '3', name: 'Herman Miller Chair', assetId: 'AST-0090', category: 'Furniture', serial: 'SN-HM7721A', company: 'Acme Corp', status: 'Maintenance', date: 'Nov 12, 2025' },
    { id: '4', name: 'iPhone 15', assetId: 'AST-0089', category: 'Mobile', serial: 'SN-AP5512B', company: 'Acme Corp', status: 'Assigned', date: 'Nov 13, 2025' },
    { id: '5', name: 'Samsung Monitor', assetId: 'AST-0088', category: 'Monitor', serial: 'SN-SM1102C', company: 'Globex Inc', status: 'Available', date: 'Nov 14, 2025' },
    { id: '6', name: 'iPad Air', assetId: 'AST-0087', category: 'Tablet', serial: 'SN-AP8821D', company: 'Tech Solutions', status: 'Assigned', date: 'Nov 15, 2025' },
];

const StatusPill = ({ status }) => {
    let bg, color;
    switch (status) {
        case 'Assigned': bg = '#dcfce7'; color = '#15803d'; break; // Green-ish for active-like
        case 'Available': bg = '#dcfce7'; color = '#15803d'; break; // Green
        case 'Maintenance': bg = '#fee2e2'; color = '#b91c1c'; break; // Red
        default: bg = '#f1f5f9'; color = '#475569';
    }
    // Using Active/Deactive logic from image for visual parity if needed, but keeping status names
    // Image has 'Active' (Green) and 'Deactive' (Red).
    // Mapping: Available/Assigned -> Active (Green), Maintenance -> Deactive (Red)

    return (
        <View style={[styles.pill, { backgroundColor: bg }]}>
            <Text style={[styles.pillText, { color }]}>{status}</Text>
        </View>
    );
};

const RecentAssetsPanel = ({ showCompany = true }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1200;

    // Helper for conditional styles
    const getColStyle = (fixedWidth, flexVal, align = 'left') => {
        return isMobile
            ? { width: fixedWidth, textAlign: align, justifyContent: align === 'center' ? 'center' : 'flex-start' }
            : { flex: flexVal, textAlign: align, justifyContent: align === 'center' ? 'center' : 'flex-start' };
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Recent Assets</Text>
                <TouchableOpacity>
                    <Text style={styles.link}>View All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal={isMobile} style={styles.scrollContainer} showsHorizontalScrollIndicator={isMobile}>
                <View style={[styles.table, !isMobile && { minWidth: '100%' }]}>
                    {/* Table Header */}
                    <View style={styles.headerRow}>
                        <Text style={[styles.headerCell, getColStyle(100, 0.8)]}>#ID</Text>
                        <Text style={[styles.headerCell, getColStyle(200, 2)]}>Asset Name</Text>
                        <Text style={[styles.headerCell, getColStyle(150, 1.2)]}>Category</Text>
                        <Text style={[styles.headerCell, getColStyle(150, 1.2)]}>Serial No.</Text>
                        <Text style={[styles.headerCell, getColStyle(120, 1)]}>Date</Text>
                        {showCompany && <Text style={[styles.headerCell, getColStyle(150, 1.2)]}>Company</Text>}
                        <Text style={[styles.headerCell, getColStyle(100, 1, 'center')]}>Status</Text>
                        <Text style={[styles.headerCell, getColStyle(100, 0.8, 'center')]}>Actions</Text>
                    </View>

                    {recentAssets.map((item, index) => (
                        <View key={item.id} style={styles.row}>
                            <Text style={[styles.cellTextBold, getColStyle(100, 0.8)]}>#{item.assetId}</Text>

                            <View style={[styles.cell, getColStyle(200, 2), { flexDirection: 'row', alignItems: 'center' }]}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.cellTextPrimary}>{item.name}</Text>
                            </View>

                            <Text style={[styles.cellTextSecondary, getColStyle(150, 1.2)]}>{item.category}</Text>
                            <Text style={[styles.cellTextSecondary, getColStyle(150, 1.2)]}>{item.serial}</Text>
                            <Text style={[styles.cellTextSecondary, getColStyle(120, 1)]}>{item.date}</Text>

                            {showCompany && <Text style={[styles.cellTextSecondary, getColStyle(150, 1.2)]}>{item.company}</Text>}

                            <View style={[getColStyle(100, 1, 'center'), { alignItems: 'center' }]}>
                                <StatusPill status={item.status} />
                            </View>

                            <View style={[styles.actions, getColStyle(100, 0.8, 'center')]}>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <MaterialCommunityIcons name="eye-outline" size={18} color="#3b82f6" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748b" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 3,
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    link: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
    scrollContainer: {
        width: '100%',
    },
    table: {
        minWidth: 1000, // Ensure horizontal scroll on small screens
    },
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 12,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // Darker gray for visibility
        borderStyle: 'dashed',
    },
    headerCell: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cellTextBold: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    cellTextPrimary: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    cellTextSecondary: {
        fontSize: 13,
        color: '#64748b',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#0369a1',
        fontWeight: '700',
        fontSize: 12,
    },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'center',
    },
    pillText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
    }
});

export default RecentAssetsPanel;
