import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
    { name: 'Assigned', value: 3100, color: '#10b981' },
    { name: 'Available', value: 850, color: '#8b5cf6' },
    { name: 'Maintenance', value: 300, color: '#f59e0b' },
];

const AssetStatusOverviewChart = () => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Asset Status Overview</Text>
            </View>

            <View style={styles.content}>
                {/* Donut Chart */}
                <View style={styles.chartContainer}>
                    <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'white', borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total */}
                    <View style={styles.centerText}>
                        <Text style={styles.totalValue}>4,250</Text>
                        <Text style={styles.totalLabel}>Total Assets</Text>
                    </View>
                </View>

                {/* Custom Legend */}
                <View style={styles.legendContainer}>
                    {data.map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: item.color }]} />
                            <View>
                                <Text style={styles.legendValue}>{item.value}</Text>
                                <Text style={styles.legendLabel}>{item.name}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
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
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
        minHeight: 300,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
    },
    chartContainer: {
        width: 200,
        height: 200,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerText: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    totalLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    legendContainer: {
        flexDirection: 'column',
        gap: 20,
        marginLeft: 20,
        justifyContent: 'center',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    legendLabel: {
        fontSize: 13,
        color: '#64748b',
    },
});

export default AssetStatusOverviewChart;
