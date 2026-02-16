import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, useWindowDimensions, KeyboardAvoidingView, ActivityIndicator, Image } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
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
            {/* Background Gradient */}
            <LinearGradient
                colors={['#7E30E1', '#49108B']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Background Patterns (Waves & Dots) */}
            <View style={StyleSheet.absoluteFill}>
                <Svg
                    height="100%"
                    width="100%"
                    style={StyleSheet.absoluteFill}
                    viewBox="0 0 1600 900"
                    preserveAspectRatio="none"
                >
                    {/* Large Smooth Wave Bottom Right - Scaled to Fill */}
                    <Path
                        d="M0,400 Q400,600 800,400 T1600,500 V1200 H0 Z"
                        fill="#5D15A8"
                        fillOpacity="0.5"
                    />

                    {/* Dots Pattern Top Right */}
                    <Circle cx={width - 40} cy="40" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 60} cy="40" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 80} cy="40" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 100} cy="40" r="2" fill="white" opacity="0.3" />

                    <Circle cx={width - 40} cy="60" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 60} cy="60" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 80} cy="60" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 100} cy="60" r="2" fill="white" opacity="0.3" />

                    <Circle cx={width - 40} cy="80" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 60} cy="80" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 80} cy="80" r="2" fill="white" opacity="0.3" />
                    <Circle cx={width - 100} cy="80" r="2" fill="white" opacity="0.3" />

                    {/* Geometric Shapes */}
                    {/* Cross */}
                    <Rect x="100" y="150" width="10" height="2" fill="white" opacity="0.2" />
                    <Rect x="104" y="146" width="2" height="10" fill="white" opacity="0.2" />

                    {/* Circle Outline */}
                    <Circle cx="200" cy="500" r="5" stroke="white" strokeWidth="1" fill="none" opacity="0.2" />
                </Svg>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.centerContent}
            >
                <View style={[styles.contentWrapper, width > 900 && styles.contentWrapperDesktop]}>
                    {/* Left Side Illustration */}
                    {width > 900 && (
                        <View style={styles.illustrationContainer}>
                            <Image
                                source={{ uri: 'https://cdni.iconscout.com/illustration/premium/thumb/login-3305943-2757111.png' }}
                                style={styles.illustration}
                                resizeMode="contain"
                            />
                        </View>
                    )}

                    {/* Main Card */}
                    <View style={styles.card}>

                        {/* Top Half: Purple Brand/Welcome Section */}
                        <View style={styles.cardTop}>


                            {/* Welcome Text */}
                            <View style={styles.welcomeContainer}>
                                <Text style={styles.loremText}>
                                    Manage your assets with TRakio.{"\n"}Secure, fast, and reliable.
                                </Text>
                            </View>
                        </View>

                        {/* Bottom Half: White Form Section */}
                        <View style={styles.cardBottom}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#9E9E9E"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#9E9E9E"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {/* Sign In Button */}
                            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.buttonWrapper}>
                                <LinearGradient
                                    colors={['#9D4EDD', '#7B2CBF']}
                                    style={styles.signInButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.signInButtonText}>SIGN IN</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Footer Options */}
                            <View style={styles.footerRow}>
                                <TouchableOpacity
                                    style={styles.rememberMe}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                        {rememberMe && <MaterialCommunityIcons name="check" size={10} color="white" />}
                                    </View>
                                    <Text style={styles.footerText}>Remember me</Text>
                                </TouchableOpacity>

                                <TouchableOpacity>
                                    <Text style={[styles.footerText, styles.forgotText]}>Forgot password?</Text>
                                </TouchableOpacity>
                            </View>

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
        backgroundColor: '#49108B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentWrapperDesktop: {
        flexDirection: 'row',
        gap: 60,
        maxWidth: 1200,
    },
    illustrationContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
        maxWidth: 500,
    },
    illustration: {
        width: 400,
        height: 400,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 20,
        overflow: 'hidden',
        // Glassmorphism
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            }
        })
    },
    cardTop: {
        backgroundColor: 'rgba(126, 48, 225, 0.6)', // Semi-transparent purple
        paddingBottom: 40,
        paddingTop: 40, // Added padding since tabs are gone
        alignItems: 'center',
    },
    welcomeContainer: {
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    loremText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500',
    },
    cardBottom: {
        backgroundColor: 'white',
        paddingVertical: 40,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 44,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#FAFAFA',
        ...Platform.select({
            web: { outlineStyle: 'none' }
        })
    },
    buttonWrapper: {
        width: '100%',
        marginTop: 10,
        marginBottom: 25,
        borderRadius: 22,
        shadowColor: '#9D4EDD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    signInButton: {
        width: '100%',
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    errorText: {
        color: '#E91E63',
        fontSize: 12,
        marginBottom: 10,
    },
    footerRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 14,
        height: 14,
        borderWidth: 1,
        borderColor: '#9D4EDD',
        borderRadius: 2,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#9D4EDD',
    },
    footerText: {
        fontSize: 12,
        color: '#757575',
    },
    forgotText: {
        color: '#7E30E1',
        fontWeight: 'bold',
    },
});

export default LoginScreen;
