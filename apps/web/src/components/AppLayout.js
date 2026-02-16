import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions, Pressable } from 'react-native';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = ({ children, navigation }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    return (
        <View style={styles.container}>
            {/* Fixed Sidebar for Desktop */}
            {!isMobile && (
                <View style={styles.sidebarWrapper}>
                    <Sidebar navigation={navigation} />
                </View>
            )}

            {/* Mobile Sidebar Drawer */}
            {isMobile && mobileMenuOpen && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 1000, flexDirection: 'row' }]}>
                    {/* Overlay */}
                    <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setMobileMenuOpen(false)} />

                    {/* Drawer Content */}
                    <View style={{ width: 280, backgroundColor: 'white', height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 }}>
                        <Sidebar navigation={navigation} onClose={() => setMobileMenuOpen(false)} />
                    </View>
                </View>
            )}

            {/* Main Content */}
            <View style={styles.mainWrapper}>
                <Topbar onMenuPress={() => setMobileMenuOpen(true)} isMobile={isMobile} />
                <View style={styles.contentArea}>
                    {children}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F5F8FF', // Light blue background
        height: '100%',
        overflow: 'hidden', // Prevent body scroll if using internal scroll
    },
    sidebarWrapper: {
        width: 260,
        height: '100%',
        zIndex: 20,
    },
    mainWrapper: {
        flex: 1,
        height: '100%',
        flexDirection: 'column',
    },
    contentArea: {
        flex: 1,
        padding: 32, // Dashboard padding
        overflow: 'hidden', // Let the DashBoardScreen handle scrolling
    },
});

export default AppLayout;
