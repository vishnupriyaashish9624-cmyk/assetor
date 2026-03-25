import React, { useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DateField = ({ label, value, onChange, placeholder = "DD/MM/YYYY", required, readOnly = false }) => {

    // For Web: Use input type="date" but hide native indicator and use custom icon
    // This allows native picker to work while keeping custom consistent UI
    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                {label && <Text style={styles.label}>{label} {required && '*'}</Text>}
                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => !readOnly && onChange(e.target.value)}
                        placeholder="YYYY-MM-DD" // Native date inputs use ISO mostly
                        style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '12px',
                            paddingRight: '40px', // Space for icon
                            fontSize: '14px',
                            color: '#334155',
                            width: '100%',
                            outline: 'none',
                            fontFamily: 'inherit',
                            backgroundColor: readOnly ? '#F8FAFC' : 'white',
                            cursor: readOnly ? 'default' : 'pointer',
                            pointerEvents: readOnly ? 'none' : 'auto',
                            opacity: readOnly ? 0.8 : 1,
                        }}
                        onClick={(e) => !readOnly && e.target.showPicker && e.target.showPicker()}
                    />
                    {/* The CSS override for the indicator is best done via class or style injection if possible. 
                        Since we can't easily inject global CSS, we rely on the custom icon overlaying or 
                        the native indicator being positioned such that we can hide it.
                        Actually, inline style `::-webkit-` doesn't work in React style prop.
                        We will rely on the requirement: "Prevent native calendar icon...". 
                        We can add a <style> tag.
                     */}
                    <style>
                        {`
                            input[type="date"]::-webkit-calendar-picker-indicator {
                                background: transparent;
                                bottom: 0;
                                color: transparent;
                                cursor: pointer;
                                height: auto;
                                left: 0;
                                position: absolute;
                                right: 0;
                                top: 0;
                                width: auto;
                            }
                         `}
                    </style>

                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <MaterialCommunityIcons name="calendar" size={20} color="#94a3b8" />
                    </div>
                </div>
            </View>
        );
    }

    // Native (Mobile): Use simple text input for now or Expo DateTimePicker
    // For MVP consistency with current codebase which likely lacks full native implementation:
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label} {required && '*'}</Text>}
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, readOnly && { backgroundColor: '#F8FAFC' }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="YYYY-MM-DD"
                    editable={!readOnly}
                />
                <MaterialCommunityIcons name="calendar" size={20} color="#94a3b8" style={styles.icon} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 0
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
        marginBottom: 8
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: 'white',
        paddingHorizontal: 12
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#334155',
        outlineStyle: 'none'
    },
    icon: {
        marginLeft: 8
    }
});

export default DateField;
