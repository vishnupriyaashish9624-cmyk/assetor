
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, useWindowDimensions, KeyboardAvoidingView, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import api from '../api/client';

const ForceResetPasswordScreen = () => {
    const { width } = useWindowDimensions();
    // Fields matching the mock: 'Current Password' (symbolic) and 'New Password'
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Validation States
    const [validLength, setValidLength] = useState(false);
    const [validUpper, setValidUpper] = useState(false);
    const [validNumber, setValidNumber] = useState(false);
    const [validSpecial, setValidSpecial] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false); // For the green success box

    const { user, completeForceReset, logout } = useAuthStore();

    useEffect(() => {
        // Validate Password Rules
        setValidLength(newPassword.length >= 8);
        setValidUpper(/[A-Z]/.test(newPassword));
        setValidNumber(/[0-9]/.test(newPassword));
        setValidSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(newPassword));
    }, [newPassword]);

    const isFormValid = validLength && validUpper && validNumber && validSpecial && currentPassword.length > 0;

    const handleReset = async () => {
        if (!isFormValid) return;

        setLoading(true);
        setError(null);

        try {
            // Call backend to update password
            // Note: Backend currently only expects { password: newPassword } and uses the token for ID
            await api.post('/auth/update-password', { password: newPassword });

            setSuccess(true);

            // Short delay to show success state before redirecting
            setTimeout(() => {
                completeForceReset();
            }, 1000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const RenderCheckItem = ({ label, isValid }) => (
        <View style={styles.checkItem}>
            <MaterialCommunityIcons
                name={isValid ? "check-circle" : "check"}
                size={16}
                color={isValid ? "#10b981" : "#9ca3af"}
            />
            <Text style={[styles.checkText, isValid && styles.checkTextValid]}>{label}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.bgHeader} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centerContent}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        {/* Header Section */}
                        <View style={styles.cardHeader}>
                            <View style={styles.logoRow}>
                                <MaterialCommunityIcons name="cube-outline" size={28} color="white" />
                                <Text style={styles.logoText}>Trakio</Text>
                            </View>
                        </View>

                        {/* Body Section */}
                        <View style={styles.cardBody}>
                            <Text style={styles.title}>Secure Your Account</Text>
                            <Text style={styles.subtitle}>
                                To maintain the highest security standards, please set a new personal password to replace your temporary one.
                            </Text>

                            {/* Info Banner */}
                            <View style={styles.infoBanner}>
                                <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#0369a1" />
                                <Text style={styles.infoBannerText}>
                                    Your temporary password will expire once you set a new one.
                                </Text>
                            </View>

                            {/* Inputs */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Temporary / Current Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter temporary password"
                                        placeholderTextColor="#9ca3af"
                                        secureTextEntry
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                    />
                                    <MaterialCommunityIcons name="lock-clock" size={18} color="#9ca3af" />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>New Secure Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#9ca3af"
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                    <MaterialCommunityIcons name="shield-key-outline" size={18} color="#9ca3af" />
                                </View>
                            </View>

                            {/* Password Requirements */}
                            <View style={styles.requirementsBox}>
                                <View style={styles.reqHeaderRow}>
                                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={16} color="#3b82f6" />
                                    <Text style={styles.reqTitle}>Compliance Requirements:</Text>
                                </View>

                                <RenderCheckItem label="Minimum 8 characters" isValid={validLength} />
                                <RenderCheckItem label="Upper & lowercase letters" isValid={validUpper} />
                                <RenderCheckItem label="Numeric digits (0-9)" isValid={validNumber} />
                                <RenderCheckItem label="Special characters (@, #, $...)" isValid={validSpecial} />
                            </View>

                            {/* Success / Error Messages */}
                            {error && (
                                <View style={styles.errorBox}>
                                    <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {success && (
                                <View style={styles.successBox}>
                                    <View style={styles.successPulse}>
                                        <MaterialCommunityIcons name="check-decagram" size={22} color="#10b981" />
                                    </View>
                                    <Text style={styles.successText}>Security Credentials Updated Successfully!</Text>
                                </View>
                            )}

                            {/* Actions */}
                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.outlineButton} onPress={handleLogout}>
                                    <Text style={styles.outlineButtonText}>Cancel & Logout</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.primaryButton, (!isFormValid || loading || success) && styles.buttonDisabled]}
                                    onPress={handleReset}
                                    disabled={!isFormValid || loading || success}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text style={styles.primaryButtonText}>Update & Sign In</Text>
                                            <MaterialCommunityIcons name="chevron-right" size={18} color="white" style={{ marginLeft: 4 }} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Footer Note */}
                            <View style={styles.footerNote}>
                                <MaterialCommunityIcons name="information" size={16} color="#0369a1" />
                                <Text style={styles.footerNoteText}>
                                    Need help? Contact your administrator for credential support.
                                </Text>
                            </View>

                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: '#eff6ff',
    },
    centerContent: {
        width: '100%',
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardHeader: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    cardBody: {
        padding: 32,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        height: 42,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        color: '#111827',
    },
    requirementsBox: {
        marginTop: 8,
        marginBottom: 24,
    },
    reqHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    reqTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
        marginLeft: 4,
    },
    checkText: {
        fontSize: 13,
        color: '#6b7280',
    },
    checkTextValid: {
        color: '#10b981', // Green
        fontWeight: '500',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    outlineButton: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    outlineButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14,
    },
    primaryButton: {
        flex: 2,
        height: 44,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
    successBox: {
        backgroundColor: '#ecfdf5',
        padding: 12,
        borderRadius: 6,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    successText: {
        color: '#047857',
        fontSize: 14,
        fontWeight: '500',
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 6,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
    },
    footerNote: {
        marginTop: 24,
        padding: 12,
        backgroundColor: '#f0fdf4', // Green 50
        borderRadius: 6,
        flexDirection: 'row',
        gap: 8,
    },
    footerNoteText: {
        flex: 1,
        fontSize: 12,
        color: '#0369a1',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bae6fd',
        marginBottom: 24,
        gap: 10,
    },
    infoBannerText: {
        fontSize: 13,
        color: '#0369a1',
        flex: 1,
    },
    successPulse: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default ForceResetPasswordScreen;
