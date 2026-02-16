import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Area } from 'recharts';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const data = [
    { name: 'Mon', value: 4000, conversion: 2400 },
    { name: 'Tue', value: 3000, conversion: 1398 },
    { name: 'Wed', value: 2000, conversion: 9800 },
    { name: 'Thu', value: 2780, conversion: 3908 },
    { name: 'Fri', value: 1890, conversion: 4800 },
    { name: 'Sat', value: 2390, conversion: 3800 },
    { name: 'Sun', value: 3490, conversion: 4300 },
];

const AdvancedAnalyticsCard = () => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [period, setPeriod] = useState('7 Days');

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Data Statistic</Text>
                    <Text style={styles.subtitle}>Asset allocation and usage trends</Text>
                </View>
                <View style={styles.filterContainer}>
                    {['12 Months', '30 Days', '7 Days'].map((p) => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => setPeriod(p)}
                            style={[
                                styles.filterBadge,
                                period === p && styles.activeFilter
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                period === p && styles.activeFilterText
                            ]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Content Row */}
            <View style={[styles.contentRow, isMobile && { flexDirection: 'column' }]}>

                {/* Visual Sidebar (Left) */}
                <LinearGradient
                    colors={['#4f46e5', '#3730a3']}
                    style={[styles.sidebar, isMobile && { width: '100%', height: 100, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 0, paddingHorizontal: 20 }]}
                >
                    <View>
                        <Text style={styles.sidebarLabel}>Total Usage</Text>
                        <Text style={styles.sidebarValue}>2,923</Text>
                    </View>

                    {!isMobile && (
                        <View style={styles.sidebarSpacer} />
                    )}

                    <View style={styles.trendBadge}>
                        <MaterialCommunityIcons name="trending-up" size={16} color="#10b981" />
                        <Text style={styles.trendText}>+14%</Text>
                    </View>

                    {/* Decorative Circles */}
                    <View style={[styles.circle, { top: -20, right: -20, width: 80, height: 80 }]} />
                    <View style={[styles.circle, { bottom: -10, left: -10, width: 60, height: 60, opacity: 0.1 }]} />
                </LinearGradient>

                {/* Main Chart Area */}
                <View style={styles.chartArea}>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                                </linearGradient>
                                <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar
                                dataKey="value"
                                barSize={20}
                                fill="url(#barGradient)"
                                radius={[4, 4, 0, 0]}
                                name="Assets Active"
                            />
                            <Area
                                type="monotone"
                                dataKey="conversion"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="url(#lineColor)"
                                name="Requests"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    filterBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
    },
    activeFilter: {
        backgroundColor: '#eff6ff',
    },
    filterText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    activeFilterText: {
        color: '#3b82f6',
    },
    contentRow: {
        flexDirection: 'row',
        gap: 24,
    },
    sidebar: {
        width: 100,
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    sidebarLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    sidebarValue: {
        fontSize: 24,
        color: 'white',
        fontWeight: '800',
        textAlign: 'center',
    },
    sidebarSpacer: {
        flex: 1,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trendText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    chartArea: {
        flex: 1,
        minHeight: 300,
    },
});

export default AdvancedAnalyticsCard;
