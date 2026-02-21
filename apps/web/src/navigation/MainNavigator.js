import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Sidebar from '../components/Sidebar';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import AssetsScreen from '../screens/AssetsScreen';
import AssetDisplayScreen from '../screens/AssetDisplayScreen';
import VehicleDisplayScreen from '../screens/VehicleDisplayScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import SuperadminDashboardScreen from '../screens/SuperadminDashboardScreen';

import OwnedPremisesScreen from '../screens/office/OwnedPremisesScreen';
import RentalPremisesScreen from '../screens/office/RentalPremisesScreen';
import GroupManagementScreen from '../screens/GroupManagementScreen';

import JobWizardScreen from '../screens/wizard/JobWizardScreen';
import ModulesHomeScreen from '../screens/modules/ModulesHomeScreen';
import ModuleDetailsScreen from '../screens/modules/ModuleDetailsScreen';
import ModuleTemplatesScreen from '../screens/modules/ModuleTemplatesScreen';
import ModuleSectionsScreen from '../screens/modules/ModuleSectionsScreen';
import SubModulesScreen from '../screens/modules/SubModulesScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import RolesScreen from '../screens/RolesScreen';
import SMTPSettingsScreen from '../screens/SMTPSettingsScreen';


// Screen Wrappers
const CompaniesScreen = GroupManagementScreen;
const SettingsScreen = (props) => <PlaceholderScreen {...props} title="Settings" icon="cog-outline" />;
const OfficeOwnedScreen = OwnedPremisesScreen;
const OfficeRentalScreen = RentalPremisesScreen;
const CategoriesScreen = (props) => <PlaceholderScreen {...props} title="Asset Categories" icon="shape-outline" actionLabel="New Category" />;
const DepartmentsScreen = (props) => <PlaceholderScreen {...props} title="Departments" icon="office-building-outline" actionLabel="New Department" />;
const TrackingScreen = (props) => <PlaceholderScreen {...props} title="Asset Tracking" icon="map-marker-path" />;
const MaintenanceScreen = (props) => <PlaceholderScreen {...props} title="Maintenance" icon="wrench-outline" actionLabel="New Request" />;
const RequestsScreen = JobWizardScreen; // Wired to Job Wizard Demo for User Review
const ReportsScreen = (props) => <PlaceholderScreen {...props} title="Reports" icon="file-chart-outline" actionLabel="Export Report" />;
// AssetDisplayScreen replaced by import

const Drawer = createDrawerNavigator();

const MainNavigator = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <Sidebar {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'front', // We handle the sidebar manually in AppLayout for Desktop
                drawerStyle: {
                    width: 280,
                    borderRightWidth: 1,
                    borderRightColor: '#f0f0f0',
                },
            }}
        >
            <Drawer.Screen name="Dashboard" component={DashboardScreen} />
            <Drawer.Screen name="SuperadminDashboard" component={SuperadminDashboardScreen} />
            <Drawer.Screen name="Companies" component={CompaniesScreen} />
            <Drawer.Screen name="Settings" component={SettingsScreen} />
            <Drawer.Screen name="SMTPSettings" component={SMTPSettingsScreen} />

            <Drawer.Screen name="OfficeOwned" component={OfficeOwnedScreen} />
            <Drawer.Screen name="OfficeRental" component={OfficeRentalScreen} />
            <Drawer.Screen name="Premises" component={OfficeOwnedScreen} />

            <Drawer.Screen name="Assets" component={AssetsScreen} />
            <Drawer.Screen name="AssetCategories" component={CategoriesScreen} />
            <Drawer.Screen name="Departments" component={DepartmentsScreen} />
            <Drawer.Screen name="Employees" component={EmployeesScreen} />
            <Drawer.Screen name="AssetTracking" component={TrackingScreen} />
            <Drawer.Screen name="Maintenance" component={MaintenanceScreen} />
            <Drawer.Screen name="Requests" component={RequestsScreen} />
            <Drawer.Screen name="Reports" component={ReportsScreen} />
            <Drawer.Screen name="ModulesHome" component={ModulesHomeScreen} />
            <Drawer.Screen name="AssetDisplay" component={AssetDisplayScreen} />
            <Drawer.Screen name="VehicleDisplay" component={VehicleDisplayScreen} />
            <Drawer.Screen name="ModuleDetails" component={ModuleDetailsScreen} />
            <Drawer.Screen name="ModuleTemplates" component={ModuleTemplatesScreen} />
            <Drawer.Screen name="ModuleSections" component={ModuleSectionsScreen} />
            <Drawer.Screen name="SubModules" component={SubModulesScreen} />
            <Drawer.Screen name="Roles" component={RolesScreen} />

        </Drawer.Navigator>
    );
};

export default MainNavigator;
