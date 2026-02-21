import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BaseModal = ({ visible, onClose, title, children, width, closeOnBackdrop = true }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <View style={[styles.modalContent, { width: width || 400, maxWidth: '95%' }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.body}>
                        {children}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 0, // Padding handled by internal container for better control
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
        zIndex: 1001,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeButton: {
        padding: 4,
    },
    body: {
        padding: 24,
    }
});

export default BaseModal;
