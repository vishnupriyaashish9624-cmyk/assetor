import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, useWindowDimensions, KeyboardAvoidingView, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';

const LoginScreen = () => {
    const { width } = useWindowDimensions();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const { login, loading, error } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) return;
        await login(email, password);
    };

    return (
        <View style={styles.container}>
            {/* Background Shape/Gradient - Simplified for Clean Look */}
            <View style={styles.bgHeader} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.centerContent}
            >
                <View style={styles.card}>
                    {/* Header Section */}
                    <View style={styles.cardHeader}>
                        <View style={styles.logoRow}>
                            <MaterialCommunityIcons name="cube-outline" size={32} color="white" />
                            <Text style={styles.logoText}>Trakio</Text>
                        </View>
                    </View>

                    {/* Body Section */}
                    <View style={styles.cardBody}>
                        <Text style={styles.title}>Welcome to Trakio</Text>

                        {/* Info Banner */}
                        <View style={styles.infoBanner}>
                            <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
                            <Text style={styles.infoText}>
                                Login password has been sent to your email
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="john.smith@email.com"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <MaterialCommunityIcons name="eye-off-outline" size={20} color="#9ca3af" />
                            </View>
                        </View>

                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.forgotButton}>
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>

                        {/* Footer Info Box */}
                        <View style={styles.footerInfoBox}>
                            <MaterialCommunityIcons name="information-outline" size={20} color="#6366f1" style={{ marginTop: 2 }} />
                            <Text style={styles.footerInfoText}>
                                Temporary password has been sent to your email. Log in with this temporary password and follow the instructions.
                            </Text>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6', // Light gray background
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: '#eff6ff', // Very light blue top half
    },
    centerContent: {
        width: '100%',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardHeader: {
        backgroundColor: '#3b82f6', // Brand Blue
        paddingVertical: 20,
        paddingHorizontal: 32,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 0.5,
    },
    cardBody: {
        padding: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937', // Gray 800
        textAlign: 'center',
        marginBottom: 24,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff', // Blue 50
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    infoText: {
        fontSize: 13,
        color: '#6b7280', // Gray 500
        flex: 1,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151', // Gray 700
        marginBottom: 8,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#d1d5db', // Gray 300
        borderRadius: 6,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#fff',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        marginRight: 8,
        height: '100%',
    },
    errorBox: {
        padding: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 6,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        textAlign: 'center',
    },
    button: {
        height: 48,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    forgotButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    forgotText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '500',
    },
    footerInfoBox: {
        marginTop: 32,
        backgroundColor: '#f8fafc', // Slate 50
        borderWidth: 1,
        borderColor: '#e2e8f0', // Slate 200
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        gap: 12,
    },
    footerInfoText: {
        fontSize: 13,
        color: '#64748b', // Slate 500
        lineHeight: 20,
        flex: 1,
    }
});

export default LoginScreen;
