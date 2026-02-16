import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';

const Topbar = ({ onMenuPress, isMobile }) => {
    const user = useAuthStore((state) => state.user);

    return (
        <LinearGradient
            colors={['#f1f1f1ff', 'rgb(219, 219, 219)']}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.container}
        >
            {isMobile && (
                <TouchableOpacity onPress={onMenuPress} style={{ marginRight: 16 }}>
                    <MaterialCommunityIcons name="menu" size={28} color="#64748b" />
                </TouchableOpacity>
            )}

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search assets, employees..."
                    placeholderTextColor="#94a3b8"
                />
            </View>

            {/* Right Actions */}
            <View style={styles.rightSection}>



                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="notifications-outline" size={20} color="#64748b" />
                    <View style={styles.badge} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="settings-outline" size={20} color="#64748b" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.profileSection}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.profileName}>{user?.name || 'TRakio Admin'}</Text>
                        <Text style={styles.profileRole}>
                            {user?.role === 'SUPER_ADMIN' ? 'Superadmin' : (user?.role?.replace('_', ' ') || 'COMPANY ADMIN')}
                        </Text>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 70,
        // backgroundColor: 'rgba(255,255,255,0.9)', // Replaced by LinearGradient
        // borderBottomWidth: 1,
        // borderBottomColor: 'rgba(0,0,0,0.06)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
        zIndex: 100, // Higher z-index for dropdown
    },
    searchContainer: {
        width: 300,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        color: '#334155',
        outlineStyle: 'none',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    companySelector: {
        position: 'relative',
        zIndex: 20,
    },
    companyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 180,
    },
    companyButtonText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
        flex: 1,
    },
    dropdown: {
        position: 'absolute',
        top: 45,
        right: 0,
        width: '100%',
        minWidth: 180,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    activeDropdownItem: {
        backgroundColor: '#eff6ff',
    },
    dropdownText: {
        fontSize: 14,
        color: '#64748b',
    },
    activeDropdownText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    iconButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1,
        borderColor: 'white',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 4,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    profileName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    profileRole: {
        fontSize: 10,
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
});

export default Topbar;
