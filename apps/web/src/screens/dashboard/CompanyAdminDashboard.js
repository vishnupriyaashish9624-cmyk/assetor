import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import AppLayout from '../../components/AppLayout';
import KpiCard from '../../components/KpiCard';
import UsageTrendAreaChart from '../../components/UsageTrendAreaChart';
import CategoryBarChart from '../../components/CategoryBarChart';
import HealthDonutChart from '../../components/HealthDonutChart';
import RecentAssetsTable from '../../components/RecentAssetsTable';
import ProfileCard from '../../components/ProfileCard';
import CalendarCard from '../../components/CalendarCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5021/api';

const CompanyAdminDashboard = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1200;
    const isMobile = width < 768;
    const { user } = useAuthStore();
    const [stats, setStats] = React.useState({
        total: 0,
        assigned: 0,
        available: 0,
        clientCompanies: 0,
        clientEmployees: 0
    });

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/dashboard/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        }
    };

    return (
        <AppLayout navigation={navigation}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.gridContainer, isDesktop ? styles.gridDesktop : styles.gridMobile]}>

                    {/* LEFT MAIN COLUMN */}
                    <View style={styles.mainColumn}>

                        {/* 1. KPI Row (Stats) */}
                        <View style={[styles.kpiRow, !isDesktop && { justifyContent: 'space-between' }]}>
                            <KpiCard
                                title="Total Assets"
                                value={stats.total.toLocaleString()}
                                icon="cube-outline"
                                gradientColors={['#3b82f6', '#2563eb']}
                                iconBg="rgba(255,255,255,0.2)"
                                style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                            />
                            <KpiCard
                                title="Assigned Assets"
                                value={stats.assigned.toLocaleString()}
                                icon="account-check-outline"
                                gradientColors={['#6366f1', '#4f46e5']}
                                iconBg="rgba(255,255,255,0.2)"
                                style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                            />
                            <KpiCard
                                title="Available Assets"
                                value={stats.available.toLocaleString()}
                                icon="cube-send"
                                gradientColors={['#f59e0b', '#d97706']}
                                iconBg="rgba(255,255,255,0.2)"
                                style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                            />
                            {/* Client Level Stats */}
                            {stats.clientCompanies > 0 && (
                                <KpiCard
                                    title="Companies Owned"
                                    value={stats.clientCompanies}
                                    icon="domain"
                                    gradientColors={['#8b5cf6', '#7c3aed']}
                                    iconBg="rgba(255,255,255,0.2)"
                                    onPress={() => navigation.navigate('Companies')}
                                    style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                                />
                            )}
                            {stats.clientEmployees > 0 && (
                                <KpiCard
                                    title="Group Employees"
                                    value={stats.clientEmployees.toLocaleString()}
                                    icon="account-group"
                                    gradientColors={['#10b981', '#059669']}
                                    iconBg="rgba(255,255,255,0.2)"
                                    onPress={() => navigation.navigate('Employees')}
                                    style={{ minWidth: isMobile ? '45%' : 200, flex: 1 }}
                                />
                            )}
                        </View>

                        {/* 2. Usage Trend Chart (Area Chart) */}
                        <View style={styles.section}>
                            <UsageTrendAreaChart />
                        </View>

                        {/* 3. Bottom Row: Bar, Donut, Recent Table */}
                        <View style={[styles.bottomRow, !isDesktop && { flexDirection: 'column' }]}>
                            <View style={[styles.bottomCardWrapper, { flex: 1.2 }]}>
                                <CategoryBarChart />
                            </View>
                            <View style={[styles.bottomCardWrapper, { flex: 0.8 }]}>
                                <HealthDonutChart />
                            </View>
                            <View style={[styles.bottomCardWrapper, { flex: 2 }]}>
                                {/* Recent Assets without Company Column */}
                                <RecentAssetsTable />
                            </View>
                        </View>
                    </View>

                    {/* RIGHT SIDEBAR COLUMN */}
                    <View style={styles.rightColumn}>
                        {/* Profile Card */}
                        <View style={styles.rightCardWrapper}>
                            <ProfileCard />
                        </View>

                        {/* Maintenance Calendar */}
                        <View style={[styles.rightCardWrapper, { flex: 1 }]}>
                            <CalendarCard />
                        </View>
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
    gridContainer: {
        flex: 1,
        gap: 24,
    },
    gridDesktop: {
        flexDirection: 'row',
    },
    gridMobile: {
        flexDirection: 'column',
    },
    mainColumn: {
        flex: 3,
        flexDirection: 'column',
        gap: 24,
    },
    rightColumn: {
        flex: 1,
        minWidth: 300,
        flexDirection: 'column',
        gap: 24,
    },
    kpiRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    section: {
        width: '100%',
    },
    bottomRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    bottomCardWrapper: {
        minWidth: 250,
    },
    rightCardWrapper: {
        width: '100%',
    }
});

export default CompanyAdminDashboard;
