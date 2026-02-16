import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const KpiCard = ({ title, value, icon, gradientColors, iconBg, style }) => {
    // Derive shadow color from the first gradient color, or default to blue
    const shadowColor = gradientColors ? gradientColors[0] : '#3b82f6';

    return (
        <View style={[styles.cardContainer, style, { shadowColor: shadowColor }]}>
            <LinearGradient
                colors={gradientColors || ['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Wave Overlay */}
                <View style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}>
                    <Svg height="100%" width="100%" viewBox="0 0 1440 320" style={{ position: 'absolute', bottom: 0 }}>
                        <Path
                            fill="#ffffff"
                            fillOpacity="0.2"
                            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                        <Path
                            fill="#ffffff"
                            fillOpacity="0.1"
                            d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                    </Svg>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.textSection}>
                        <Text style={styles.cardTitle}>{title}</Text>
                        <Text style={styles.cardValue}>{value}</Text>
                    </View>
                    <View style={[styles.iconCircle, { backgroundColor: iconBg || 'rgba(255,255,255,0.2)' }]}>
                        <MaterialCommunityIcons name={icon} size={22} color="white" />
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flex: 1,
        height: 140, // Fixed height as requested
        borderRadius: 18,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
        margin: 8, // Grid gap simulation
    },
    gradient: {
        flex: 1,
        borderRadius: 18,
        padding: 16,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1,
        width: '100%', // Ensure full width
    },
    textSection: {
        justifyContent: 'center',
        flex: 1, // Allow text section to take available space
        marginRight: 8, // Add spacing between text and icon
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12, // Squircle
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)', // Glassy icon bg on web
    },
});

export default KpiCard;
