import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import AppLayout from '../../components/AppLayout';
import KpiCard from '../../components/KpiCard';
import AssetStatusOverviewChart from '../../components/AssetStatusOverviewChart';
import RecentAssetsPanel from '../../components/RecentAssetsPanel';
import CalendarWidget from '../../components/CalendarWidget';
import AdvancedAnalyticsCard from '../../components/AdvancedAnalyticsCard';

const SuperAdminDashboard = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const isMobile = width < 768;

    return (
        <AppLayout navigation={navigation}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>

                    {/* 1. KPI Row (4 Cards) */}
                    <View style={[styles.kpiRow, isMobile && { justifyContent: 'space-between' }]}>
                        <KpiCard
                            title="Total Assets"
                            value="4,250"
                            icon="package-variant"
                            gradientColors={['#3b82f6', '#2563eb']}
                            style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                        />
                        <KpiCard
                            title="Assigned"
                            value="3,100"
                            icon="account-check"
                            gradientColors={['#10b981', '#059669']} // Green
                            style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                        />
                        <KpiCard
                            title="Available"
                            value="850"
                            icon="cube-outline"
                            gradientColors={['#8b5cf6', '#7c3aed']} // Purple
                            style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                        />
                        <KpiCard
                            title="Maintenance"
                            value="300"
                            icon="wrench-clock"
                            gradientColors={['#f59e0b', '#d97706']} // Amber
                            style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                        />
                    </View>




                    {/* 1.5. Advanced Analytics (Main Chart) */}




                    {/* 3. Charts & Calendar Row (50/50) */}
                    {/* 2. Charts Row (60% / 40%) */}
                    <View style={[styles.grid, !isDesktop && styles.gridStack]}>
                        <View style={[styles.gridItem, { flex: 1.5, minWidth: isMobile ? '100%' : 400 }]}>
                            <AdvancedAnalyticsCard />
                        </View>
                        <View style={[styles.gridItem, { flex: 1 }]}>
                            <AssetStatusOverviewChart />
                        </View>
                    </View>

                    {/* 3. Calendar Row */}
                    <View style={styles.fullWidthSection}>
                        <CalendarWidget />
                    </View>

                    {/* 3. Recent Assets (Full Width) */}
                    <View style={styles.fullWidthSection}>
                        <RecentAssetsPanel showCompany={true} />
                    </View>
                </View>
            </ScrollView>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 40,
    },
    container: {
        flex: 1,
        gap: 32,
    },
    kpiRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    grid: {
        flexDirection: 'row',
        gap: 24,
    },
    gridStack: {
        flexDirection: 'column',
    },
    gridItem: {
        flexDirection: 'row',
        minWidth: 300,
    },
    calendarSection: {
        width: '100%',
    },
    fullWidthSection: {
        width: '100%',
    }
});

export default SuperAdminDashboard;
