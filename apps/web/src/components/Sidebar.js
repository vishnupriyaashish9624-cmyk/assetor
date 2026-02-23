import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';
import OfficeSelectorModal from './modals/OfficeSelectorModal';
import { useNavigationState } from '@react-navigation/native';

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
        ? ['dashboard', 'assets', 'premises', 'employees', 'maintenance', 'reports', 'premises_display', 'module', 'module_sections', 'sub_modules', 'vehicles']
        : (user?.enabled_modules && Array.isArray(user.enabled_modules))
            ? user.enabled_modules
            : ['dashboard', 'assets', 'employees', 'premises', 'maintenance', 'reports', 'vehicles'];

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
        const moduleMapping = {
            'Dashboard': 'dashboard',
            'AssetDisplay': 'premises_display',
            'VehicleDisplay': 'vehicles',
            'Employees': 'employees',
            'Maintenance': 'maintenance',
            'Reports': 'reports',
            'ModulesHome': 'module',
            'ModuleSections': 'module_sections',
            'SubModules': 'sub_modules',
        };
        const alwaysEnabled = ['Dashboard', 'Companies', 'Settings', 'SuperadminDashboard', 'Clients', 'Roles', 'SMTPSettings'];
        if (alwaysEnabled.includes(moduleKey)) return true;
        const moduleName = moduleMapping[moduleKey];
        return moduleName ? activeModules.includes(moduleName) : false;
    };

    const handleLogout = async () => {
        await logout();
    };

    const menuGroups = [
        {
            title: null,
            items: [
                { key: 'Dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE'] },
                { key: 'SuperadminDashboard', label: 'Control Center', icon: 'shield-crown-outline', roles: ['SUPER_ADMIN'] },
            ]
        },
        {
            title: 'Platform Management',
            key: 'platform',
            roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
            items: [
                { key: 'Companies', label: 'Companies', icon: 'domain', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
                { key: 'Clients', label: 'Clients', icon: 'account-tie-outline', roles: ['SUPER_ADMIN'] },
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

    return (
        <LinearGradient
            colors={['rgba(57, 22, 117, 0.9)', 'rgba(117, 70, 204, 1)']}
            style={styles.container}
        >
            <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                    <MaterialCommunityIcons name="office-building" size={36} color="white" />
                </View>
            </View>

            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                {menuGroups.map((group, groupIdx) => {
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
                                const isActive = item.key === activeRoute;
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.menuItem, isActive && styles.activeMenuItem]}
                                        onPress={() => handleMenuPress(item.key)}
                                    >
                                        <MaterialCommunityIcons
                                            name={item.icon}
                                            size={22}
                                            color={isActive ? '#401F7A' : 'white'}
                                            style={[styles.menuIcon, { opacity: isActive ? 1 : 0.7 }]}
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
                    <MaterialCommunityIcons name="power" size={24} color="white" style={{ marginRight: 15, opacity: 0.8 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <OfficeSelectorModal
                visible={officeSelectorVisible}
                onClose={() => setOfficeSelectorVisible(false)}
                onSelect={handleOfficeSelect}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 260,
        height: '100%',
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
        // Box shadow for the entire sidebar
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    logoContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(165, 200, 240, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(165, 200, 240, 0.3)',
        // Shadow for logo circle
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    menuContainer: {
        flex: 1,
        paddingLeft: 20,
    },
    groupContainer: {
        marginBottom: 25,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingRight: 15,
    },
    groupTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.35)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
        marginBottom: 5,
        borderTopLeftRadius: 30,
        borderBottomLeftRadius: 30,
    },
    activeMenuItem: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    menuIcon: {
        marginRight: 15,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    activeMenuLabel: {
        color: '#7a5bebff',
        fontWeight: '800',
    },
    footer: {
        paddingVertical: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(165, 200, 240, 0.15)',
        borderRadius: 12,
        marginHorizontal: 20,
        // Shadow for logout button
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
        opacity: 0.8,
    }
});

export default Sidebar;
