import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Portal, Modal, IconButton, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ImagePreviewModal = ({ visible, imageUrl, onDismiss, title }) => {
    const theme = useTheme();

    if (!imageUrl) return null;

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.container}
            >
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleWrapper}>
                            <MaterialCommunityIcons name="image-outline" size={24} color="#f59e0b" style={{ marginRight: 10 }} />
                            <Text style={styles.title} numberOfLines={1}>{title || 'Image Preview'}</Text>
                        </View>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={onDismiss}
                            style={styles.closeButton}
                            iconColor="#64748b"
                        />
                    </View>

                    {/* Image Area */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Footer / Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={() => {
                                // In a real app, this would trigger a download
                                // For web, we can open in new tab
                                if (window && window.open) {
                                    window.open(imageUrl, '_blank');
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="open-in-new" size={20} color="white" />
                            <Text style={styles.buttonText}>Open Original</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: width * 0.9,
        maxWidth: 1000,
        maxHeight: height * 0.9,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    closeButton: {
        margin: 0,
    },
    imageContainer: {
        width: '100%',
        backgroundColor: '#f8fafc',
        height: height * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#673ab7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ImagePreviewModal;
