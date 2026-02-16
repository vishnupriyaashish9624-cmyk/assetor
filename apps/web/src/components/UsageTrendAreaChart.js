import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
// Recharts only works on Web. For React Native Native we'd need react-native-chart-kit.
// Since target is Expo Web, we can use standard React logic conditionally or just use it if we are sure it's web.
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', assigned: 40, available: 20 },
    { name: 'Tue', assigned: 30, available: 25 },
    { name: 'Wed', assigned: 50, available: 15 },
    { name: 'Thu', assigned: 45, available: 30 },
    { name: 'Fri', assigned: 60, available: 20 },
    { name: 'Sat', assigned: 55, available: 25 },
    { name: 'Sun', assigned: 70, available: 10 },
];

const UsageTrendAreaChart = () => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Asset Usage Trend</Text>
                <View style={styles.legend}>
                    <View style={styles.dotGreen} /><Text style={styles.legendText}>Assigned</Text>
                    <View style={styles.dotPurple} /><Text style={styles.legendText}>Available</Text>
                </View>
            </View>
            <View style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="assigned"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorAssigned)"
                        />
                        <Area
                            type="monotone"
                            dataKey="available"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorAvailable)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 18,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    chartContainer: {
        width: '100%',
        minHeight: 250,
        // On web charts often need block display
        ...(Platform.OS === 'web' ? { display: 'block' } : {}),
    },
    legend: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 4 },
    dotPurple: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8b5cf6', marginRight: 4 },
    legendText: { fontSize: 12, color: '#64748b' },
});

export default UsageTrendAreaChart;
