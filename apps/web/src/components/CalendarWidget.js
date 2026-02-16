import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface } from 'react-native-paper';

const CalendarWidget = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());

    // Helpers for Calendar Logic
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const changeMonth = (increment) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected = i === selectedDate && new Date().getMonth() === currentDate.getMonth(); // Simple selection logic
            const isToday = i === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

            days.push(
                <TouchableOpacity
                    key={`day-${i}`}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDayCell,
                        isToday && !isSelected && styles.todayCell
                    ]}
                    onPress={() => setSelectedDate(i)}
                >
                    <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayText
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            );
        }

        return days;
    };

    // Dummy Appointments Data
    const appointments = [
        { id: 1, name: 'Peter Dawson', role: 'Developer', time: '15:00hs', date: '6/01', initial: 'P', color: '#e0e7ff', textColor: '#4f46e5' },
        { id: 2, name: 'Gina Stewart', role: 'Designer', time: '15:00hs', date: '6/01', initial: 'G', color: '#fce7f3', textColor: '#db2777' },
        { id: 3, name: 'Janet Smith', role: 'Front end developer', time: '15:00hs', date: '6/01', initial: 'J', color: '#ede9fe', textColor: '#7c3aed' },
        { id: 4, name: 'Mia Wilde', role: 'Copywriter', time: '15:00hs', date: '7/01', initial: 'M', color: '#dbeafe', textColor: '#2563eb' },
    ];

    return (
        <Surface style={styles.container}>
            {/* Left Side: Upcoming Appointments */}
            <View style={styles.appointmentsSection}>
                <Text style={styles.headerTitle}>UPCOMING APPOINTMENTS</Text>
                <ScrollView contentContainerStyle={styles.appointmentsList} showsVerticalScrollIndicator={false}>
                    {appointments.map((appt) => (
                        <View key={appt.id} style={styles.appointmentItem}>
                            <View style={[styles.avatar, { backgroundColor: appt.color }]}>
                                <Text style={[styles.avatarText, { color: appt.textColor }]}>{appt.initial}</Text>
                            </View>
                            <View style={styles.apptDetails}>
                                <Text style={styles.apptName}>{appt.name}</Text>
                                <View style={styles.apptMeta}>
                                    <MaterialCommunityIcons name="calendar-blank" size={12} color="#94a3b8" />
                                    <Text style={styles.apptMetaText}>{appt.date}</Text>
                                    <MaterialCommunityIcons name="clock-outline" size={12} color="#94a3b8" style={{ marginLeft: 8 }} />
                                    <Text style={styles.apptMetaText}>{appt.time}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Right Side: Calendar */}
            <View style={styles.calendarSection}>
                <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() => changeMonth(-1)}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.monthText}>
                            {currentDate.toLocaleString('default', { month: 'long' }).toUpperCase()}
                        </Text>
                        <Text style={styles.yearText}>{currentDate.getFullYear()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => changeMonth(1)}>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Days Header */}
                <View style={styles.daysHeader}>
                    {daysOfWeek.map((day) => (
                        <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.daysGrid}>
                    {renderCalendarDays()}
                </View>
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    appointmentsSection: {
        flex: 1.2,
        padding: 20,
    },
    calendarSection: {
        flex: 1.5,
        padding: 20,
    },
    divider: {
        width: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 20,
    },
    headerTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    appointmentsList: {
        gap: 16,
    },
    appointmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
    },
    apptDetails: {
        flex: 1,
    },
    apptName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    apptMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    apptMetaText: {
        fontSize: 11,
        color: '#94a3b8',
        marginLeft: 4,
    },
    cancelBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelBtnText: {
        fontSize: 10,
        color: '#64748b',
    },
    // Calendar Styles
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    monthText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: 0.5,
    },
    yearText: {
        fontSize: 10,
        color: '#94a3b8',
    },
    daysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    dayOfWeekText: {
        width: 32,
        textAlign: 'center',
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    dayText: {
        fontSize: 12,
        color: '#475569',
    },
    selectedDayCell: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6366f1', // Indigo primary
        marginLeft: 'auto',
        marginRight: 'auto',
        // Start centering manually due to width change
    },
    selectedDayText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    todayCell: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#dcfce7',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    todayText: {
        color: '#16a34a',
        fontWeight: '700',
    }
});

export default CalendarWidget;
