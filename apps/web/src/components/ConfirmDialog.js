import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ConfirmDialog = ({ visible, onDismiss, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => {
    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={[styles.iconCircle, danger && styles.iconCircleDanger]}>
                        <MaterialCommunityIcons
                            name={danger ? "alert-outline" : "help-circle-outline"}
                            size={40}
                            color={danger ? "rgb(239, 149, 10)" : "#3b82f6"}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <Button
                            mode="outlined"
                            onPress={onDismiss}
                            style={styles.cancelButton}
                            labelStyle={styles.cancelButtonText}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                onConfirm();
                                onDismiss();
                            }}
                            style={[styles.confirmButton, danger && styles.confirmButtonDanger]}
                            labelStyle={styles.confirmButtonText}
                        >
                            {confirmText}
                        </Button>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        padding: 32,
        margin: 20,
        borderRadius: 16,
        alignSelf: 'center',
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircleDanger: {
        backgroundColor: 'rgb(255, 248, 225)', // Soft amber background
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        borderRadius: 8,
        borderColor: '#e2e8f0',
        borderWidth: 1,
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 15,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
    },
    confirmButtonDanger: {
        backgroundColor: 'rgb(239, 149, 10)',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ConfirmDialog;
