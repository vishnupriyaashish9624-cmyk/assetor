import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';
import OfficeSelectorModal from './modals/OfficeSelectorModal';
import { useNavigationState } from '@react-navigation/native';

export const MODULE_MAPPING = {
    'Dashboard': 'dashboard',
    'AssetDisplay': 'premises_display',
    'VehicleDisplay': 'vehicles',
    'Employees': 'employees',
    'Maintenance': 'maintenance',
    'Reports': 'reports',
    'ModulesHome': 'module',
    'ModuleSections': 'module_sections',
    'SubModules': 'sub_modules',
    'Assets': 'assets',
    'PremisesMaster': 'premises',
    'Clients': 'clients',
    'Companies': 'companies',
};

export const MENU_GROUPS = [
    {
        title: null,
        items: [
            { key: 'Dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE'] },
            { key: 'SuperadminDashboard', label: 'Control Center', icon: 'shield-crown-outline', roles: ['SUPER_ADMIN'] },
        ]
    },
    {
        title: 'Group Management',
        key: 'platform',
        roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
        items: [
            { key: 'Companies', label: 'Companies', icon: 'domain', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
            { key: 'Clients', label: 'Clients', icon: 'account-tie-outline', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
        ]
    },
    {
        title: 'Custom Modules',
        key: 'module_builder',
        roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'],
        items: [
            { key: 'ModulesHome', label: 'Module', icon: 'layers-outline', roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
            { key: 'ModuleSections', label: 'Module sections', icon: 'view-grid-plus-outline', roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
            { key: 'SubModules', label: 'Sub-modules', icon: 'file-tree-outline', roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
        ]
    },
    {
        title: 'Operations',
        key: 'operations',
        roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE'],
        items: [
            { key: 'AssetDisplay', label: 'Premises display', icon: 'monitor-dashboard', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
            { key: 'PremisesMaster', label: 'Premises Master', icon: 'office-building', roles: ['COMPANY_ADMIN'] },
            { key: 'VehicleDisplay', label: 'Vehicle', icon: 'car-side', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
            { key: 'Employees', label: 'Staff members', icon: 'account-group-outline', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
        ]
    },
    {
        title: 'Settings',
        key: 'settings',
        roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
        items: [
            { key: 'Settings', label: 'Platform Settings', icon: 'cog-outline', roles: ['SUPER_ADMIN'] },
            { key: 'SMTPSettings', label: 'SMTP Settings', icon: 'email-cog-outline', roles: ['SUPER_ADMIN'] },
            { key: 'Roles', label: 'Roles', icon: 'shield-account-outline', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
        ]
    },
];

const Sidebar = (props) => {
    const { navigation, onClose, state } = props;
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const userRole = user?.role || 'EMPLOYEE';

    // Get current route name dynamically
    const currentRoute = useNavigationState(navState => {
        if (!navState) return null;
        const route = navState.routes[navState.index];
        return route.name;
    });

    const activeRoute = state ? state.routes[state.index].name : (props.activeRoute || currentRoute || 'Dashboard');

    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [officeSelectorVisible, setOfficeSelectorVisible] = useState(false);

    const activeModules = (userRole === 'SUPER_ADMIN')
        ? ['dashboard', 'assets', 'premises', 'employees', 'maintenance', 'reports', 'premises_display', 'module', 'module_sections', 'sub_modules', 'vehicles', 'clients']
        : (user?.enabled_modules && Array.isArray(user.enabled_modules))
            ? user.enabled_modules
            : ['dashboard', 'assets', 'employees', 'premises', 'maintenance', 'reports', 'vehicles', 'clients'];

    const toggleGroup = (groupName) => {
        setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const handleOfficeSelect = (route) => {
        setOfficeSelectorVisible(false);
        if (onClose) onClose();
        navigation.navigate(route);
    };

    const handleMenuPress = (key) => {
        if (onClose) onClose();
        if (key === 'OfficeSelector') {
            setOfficeSelectorVisible(true);
        } else {
            navigation && navigation.navigate(key);
        }
    };

    const isModuleEnabled = (moduleKey) => {
        if (userRole === 'SUPER_ADMIN') return true;
        const alwaysEnabled = ['Dashboard', 'Companies', 'Settings', 'SuperadminDashboard', 'Roles', 'SMTPSettings'];
        if (alwaysEnabled.includes(moduleKey)) return true;

        const moduleName = MODULE_MAPPING[moduleKey] || moduleKey.toLowerCase();
        return moduleName ? activeModules.includes(moduleName) : false;
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoRow}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoInitial}>{(user?.client_name || user?.name || 'L')[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.logoText}>{user?.client_name || 'TRakio'}</Text>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.profileImagePlaceholder}>
                    <MaterialCommunityIcons name="account" size={30} color="gray" style={{ marginTop: 5 }} />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.name || user?.first_name || 'TRakio Admin'}</Text>
                    <Text style={styles.profileRole}>{userRole.replace('_', ' ')}</Text>
                </View>
            </View>

            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                {MENU_GROUPS.map((group, groupIdx) => {
                    if (group.roles && !group.roles.includes(userRole) && userRole !== 'SUPER_ADMIN') return null;

                    const visibleItems = group.items.filter(item =>
                        (item.roles.includes(userRole) || userRole === 'SUPER_ADMIN') &&
                        isModuleEnabled(item.key)
                    );

                    if (visibleItems.length === 0) return null;

                    const isCollapsed = collapsedGroups[group.key];

                    return (
                        <View key={groupIdx} style={styles.groupContainer}>
                            {group.title && (
                                <TouchableOpacity
                                    style={styles.groupHeader}
                                    onPress={() => group.key && toggleGroup(group.key)}
                                    activeOpacity={0.7}
                                    disabled={!group.key}
                                >
                                    <Text style={styles.groupTitle}>{group.title}</Text>
                                    {group.key && (
                                        <MaterialCommunityIcons
                                            name={isCollapsed ? "chevron-right" : "chevron-down"}
                                            size={16}
                                            color="rgba(255,255,255,0.4)"
                                        />
                                    )}
                                </TouchableOpacity>
                            )}

                            {!isCollapsed && visibleItems.map((item) => {
                                const isActive = item.key === activeRoute || (item.key === 'Dashboard' && activeRoute === 'Home');
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.menuItem, isActive && styles.activeMenuItem]}
                                        onPress={() => handleMenuPress(item.key)}
                                    >
                                        <MaterialCommunityIcons
                                            name={item.icon}
                                            size={20}
                                            color={isActive ? 'white' : 'rgba(255, 255, 255, 0.8)'}
                                            style={styles.menuIcon}
                                        />
                                        <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout-variant" size={20} color="white" style={{ marginRight: 15 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <OfficeSelectorModal
                visible={officeSelectorVisible}
                onClose={() => setOfficeSelectorVisible(false)}
                onSelect={handleOfficeSelect}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 260,
        height: '100%',
        backgroundColor: '#5231A8',
        elevation: 10,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
    },
    logoCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFD1D1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoInitial: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 18,
    },
    logoText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    profileImagePlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ccc',
        marginRight: 10,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
        marginBottom: 2,
    },
    profileRole: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 9,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 0,
    },
    groupContainer: {
        marginBottom: 8,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 4,
    },
    groupTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 6,
        borderRadius: 10,
    },
    activeMenuItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    menuIcon: {
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    activeMenuLabel: {
        color: 'white',
        fontWeight: '700',
    },
    footer: {
        padding: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    }
});

export default Sidebar;
