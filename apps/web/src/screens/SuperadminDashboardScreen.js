import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, Image, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import ClientFormModal from '../components/modals/ClientFormModal';
import CompanyFormModal from '../components/modals/CompanyFormModal';
import EmployeeFormModal from '../components/modals/EmployeeFormModal';
import AlertDialog from '../components/AlertDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const SuperadminDashboardScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1200;
    const { token } = useAuthStore();

    // Data State
    const [clients, setClients] = useState([]);
    const [globalKpis, setGlobalKpis] = useState({
        totalClients: 0,
        totalCompanies: 0,
        totalEmployees: 0,
        totalAssets: 0
    });
    const [loading, setLoading] = useState(true);

    // Modal State
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [companyModalVisible, setCompanyModalVisible] = useState(false);
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [editingCompany, setEditingCompany] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Dialog States
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [clientsRes, kpisRes] = await Promise.all([
                axios.get(`${API_URL}/clients`, config),
                axios.get(`${API_URL}/clients/kpis`, config)
            ]);
            setClients(clientsRes.data?.data || []);
            setGlobalKpis(kpisRes.data?.data || { totalClients: 0, totalCompanies: 0, totalEmployees: 0, totalAssets: 0 });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    // Handlers (Simplified for Dashboard Quick Actions)
    const handleSaveClient = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_URL}/clients`, data, config);
            showAlert('Success', 'Client created successfully!', 'success');
            fetchData();
        } catch (error) {
            showAlert('Error', 'Failed to save client: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const handleSaveCompany = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_URL}/companies`, data, config);
            showAlert('Success', 'Company created successfully!', 'success');
            fetchData();
        } catch (error) {
            showAlert('Error', 'Failed to save company: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const handleSaveEmployee = async (data) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_URL}/employees`, data, config);
            showAlert('Success', 'Employee created successfully!', 'success');
            fetchData();
        } catch (error) {
            showAlert('Error', 'Failed to save employee: ' + (error.response?.data?.message || error.message), 'error');
        }
    };


    // --- Widgets ---

    const OverviewBarChart = () => {
        const data = [
            { name: 'Jan', value: 4000 }, { name: 'Feb', value: 3000 },
            { name: 'Mar', value: 2000 }, { name: 'Apr', value: 2780 },
            { name: 'May', value: 1890 }, { name: 'Jun', value: 2390 },
        ];
        return (
            <View style={styles.chartWidget}>
                <View style={styles.widgetHeader}>
                    <Text style={styles.widgetTitle}>Monthly Activity</Text>
                    <MaterialCommunityIcons name="dots-horizontal" size={20} color="#94a3b8" />
                </View>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ backgroundColor: 'white', borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </View>
        );
    };

    const CircularProgress = ({ title, percent, color }) => {
        const data = [
            { name: 'Completed', value: percent, color: color },
            { name: 'Remaining', value: 100 - percent, color: '#f1f5f9' },
        ];
        return (
            <View style={styles.circularWidget}>
                <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={45}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 16, fontWeight: 'bold', fill: '#1e293b' }}>
                            {percent}%
                        </text>
                    </PieChart>
                </ResponsiveContainer>
                <Text style={styles.circularLabel}>{title}</Text>
                <Text style={styles.circularSub}>Status</Text>
            </View>
        );
    };

    const StatsList = () => (
        <View style={styles.listWidget}>
            <Text style={styles.widgetTitle}>Recent Clients</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
                {clients.slice(0, 3).map((client, index) => (
                    <View key={client.id || index} style={styles.listItem}>
                        <View style={[styles.iconBox, { backgroundColor: index === 0 ? '#fee2e2' : index === 1 ? '#e0e7ff' : '#dcfce7' }]}>
                            <MaterialCommunityIcons name="domain" size={18} color={index === 0 ? '#ef4444' : index === 1 ? '#6366f1' : '#22c55e'} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.listItemTitle}>{client.name}</Text>
                            <Text style={styles.listItemSub}>{client.unique_id || 'ID-1234'}</Text>
                        </View>
                        <Text style={styles.listItemValue}>{client.companies_count} Co.</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const AreaGrowthChart = () => {
        const data = [
            { name: 'Mon', value: 400 },
            { name: 'Tue', value: 300 },
            { name: 'Wed', value: 550 },
            { name: 'Thu', value: 450 },
            { name: 'Fri', value: 650 },
            { name: 'Sat', value: 500 },
            { name: 'Sun', value: 700 },
        ];
        return (
            <View style={styles.chartWidget}>
                <View style={styles.widgetHeader}>
                    <Text style={styles.widgetTitle}>Growth Analysis</Text>
                </View>
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#facc15" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Area type="monotone" dataKey="value" stroke="#eab308" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </View>
        );
    };

    const VerticalStats = () => (
        <View style={styles.verticalStatsWidget}>
            <Text style={styles.widgetTitle}>System Status</Text>
            <View style={styles.statRow}>
                <View style={styles.statDotGreen} />
                <Text style={styles.statLabel}>Server Online</Text>
            </View>
            <View style={styles.statRow}>
                <View style={styles.statDotPurple} />
                <Text style={styles.statLabel}>DB Connected</Text>
            </View>
            <View style={styles.statRow}>
                <View style={styles.statDotYellow} />
                <Text style={styles.statLabel}>Sync Active</Text>
            </View>
        </View>
    );

    const QuickActionWidget = () => (
        <View style={styles.quickActionWidget}>
            <Text style={styles.whiteTitle}>Direct Actions</Text>
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setClientModalVisible(true)}>
                    <MaterialCommunityIcons name="plus" size={20} color="white" />
                    <Text style={styles.actionText}>Client</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setCompanyModalVisible(true)}>
                    <MaterialCommunityIcons name="plus" size={20} color="white" />
                    <Text style={styles.actionText}>Company</Text>
                </TouchableOpacity>
            </View>
        </View>
    );


    if (loading) {
        return (
            <AppLayout navigation={navigation} title="Dashboard">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            </AppLayout>
        );
    }

    return (
        <AppLayout navigation={navigation} title="Dashboard">
            <View style={styles.container}>
                {/* Search Header */}
                <View style={[styles.headerBar, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                    <View>
                        <Text style={styles.headerTitle}>Overview</Text>
                        <Text style={styles.headerSubtitle}>Welcome back, Super Admin</Text>
                    </View>
                    <View style={styles.headerControls}>
                        <View style={styles.searchContainer}>
                            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                            <TextInput placeholder="Search..." placeholderTextColor="#94a3b8" style={styles.headerInput} />
                        </View>
                        <TouchableOpacity style={styles.iconBtn}>
                            <MaterialCommunityIcons name="bell-outline" size={22} color="#64748b" />
                            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileBtn}>
                            <Image source={{ uri: 'https://ui-avatars.com/api/?name=Super+Admin&background=8b5cf6&color=fff' }} style={styles.avatar} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Top Stats Cards (New Design) */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                                <MaterialCommunityIcons name="domain" size={24} color="#3b82f6" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{globalKpis.totalClients}</Text>
                                <Text style={styles.statLabel}>Total Clients</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                                <MaterialCommunityIcons name="office-building" size={24} color="#10b981" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{globalKpis.totalCompanies}</Text>
                                <Text style={styles.statLabel}>Total Companies</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#f5f3ff' }]}>
                                <MaterialCommunityIcons name="account-group" size={24} color="#8b5cf6" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{globalKpis.totalEmployees}</Text>
                                <Text style={styles.statLabel}>Employees</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#fffbeb' }]}>
                                <MaterialCommunityIcons name="cube-outline" size={24} color="#f59e0b" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{globalKpis.totalAssets}</Text>
                                <Text style={styles.statLabel}>Total Assets</Text>
                            </View>
                        </View>
                    </View>


                    {/* Main Grid Widgets */}
                    <View style={[styles.mainGrid, isMobile && { flexDirection: 'column' }]}>

                        {/* Row 1 */}
                        <View style={[styles.gridColumn, { flex: 2, minWidth: 300 }]}>
                            <OverviewBarChart />
                        </View>

                        <View style={[styles.gridColumn, { flex: 1, minWidth: 200, flexDirection: 'row', gap: 16 }]}>
                            <CircularProgress title="Projects" percent={76} color="#facc15" />
                            <CircularProgress title="Tasks" percent={53} color="#f472b6" />
                        </View>

                        <View style={[styles.gridColumn, { flex: 1, minWidth: 250 }]}>
                            <StatsList />
                        </View>

                        {/* Row 2 */}
                        <View style={[styles.gridColumn, { flex: 2, minWidth: 300 }]}>
                            <AreaGrowthChart />
                        </View>

                        <View style={[styles.gridColumn, { flex: 1, minWidth: 200 }]}>
                            <VerticalStats />
                        </View>

                        <View style={[styles.gridColumn, { flex: 1, minWidth: 200 }]}>
                            <QuickActionWidget />
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Hidden Modals to preserve functionality */}
            <ClientFormModal
                visible={clientModalVisible}
                onClose={() => { setClientModalVisible(false); setEditingClient(null); }}
                onSave={handleSaveClient}
                client={editingClient}
            />
            <CompanyFormModal
                visible={companyModalVisible}
                onClose={() => { setCompanyModalVisible(false); setEditingCompany(null); }}
                onSave={handleSaveCompany}
                company={editingCompany}
            />
            <EmployeeFormModal
                visible={employeeModalVisible}
                onClose={() => { setEmployeeModalVisible(false); setEditingEmployee(null); }}
                onSave={handleSaveEmployee}
                employee={editingEmployee}
            />
            <AlertDialog
                visible={alertConfig.visible}
                onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

        </AppLayout>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f8fafc',
    },
    // Header
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    headerControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        width: 250,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    headerInput: { flex: 1, marginLeft: 8, fontSize: 14, outlineStyle: 'none' },
    iconBtn: { padding: 8, position: 'relative' },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#ef4444',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: { fontSize: 10, color: 'white', fontWeight: 'bold' },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'white' },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 32,
        flexWrap: 'wrap',
    },
    statCard: {
        flex: 1,
        minWidth: 200,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
    statLabel: { fontSize: 12, color: '#64748b' },

    // Main Grid
    mainGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    gridColumn: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        minHeight: 250,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },

    // Widgets
    widgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    widgetTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    tooltip: {
        backgroundColor: 'white',
        borderRadius: 8,
        border: 'none',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    },

    // Circular Widget
    circularWidget: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    circularLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginTop: 8 },
    circularSub: { fontSize: 12, color: '#94a3b8' },

    // List Widget
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    listItemTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
    listItemSub: { fontSize: 12, color: '#94a3b8' },
    listItemValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },

    // Vertical Stats
    verticalStatsWidget: { justifyContent: 'center' },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    statDotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
    statDotPurple: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8b5cf6' },
    statDotYellow: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#facc15' },

    // Quick Actions
    quickActionWidget: {
        backgroundColor: '#6366f1',
        borderRadius: 20,
        padding: 24,
        justifyContent: 'center',
        flex: 1
    },
    whiteTitle: { fontSize: 16, fontWeight: '700', color: 'white', marginBottom: 20 },
    actionRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    actionBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        flex: 1
    },
    actionText: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 4 },

    chartWidget: { flex: 1 },
    listWidget: { flex: 1 },
});

export default SuperadminDashboardScreen;
