import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';

/**
 * SequentialIDGenerator Component
 * Generates unique IDs in the format: YYY-YYYY-DD-MM-XXX
 * 
 * @param {Object} props
 * @param {string} props.prefix - 3-letter uppercase prefix (default: 'NUR')
 */
const SequentialIDGenerator = ({ prefix = 'NUR' }) => {
    const [sequence, setSequence] = useState(1);
    const [generatedID, setGeneratedID] = useState('');

    /**
     * Generates the ID based on current date and sequential counter
     */
    const handleGenerateID = () => {
        const now = new Date();

        // Format parts
        const year = now.getFullYear();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const xxx = String(sequence).padStart(3, '0');

        // Combine into final format: YYY-YYYY-DD-MM-XXX
        const newID = `${prefix.toUpperCase()}-${year}-${day}-${month}-${xxx}`;

        setGeneratedID(newID);
        setSequence((prev) => prev + 1);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Unique Transaction ID</Text>

            <TextInput
                style={styles.idDisplay}
                value={generatedID}
                editable={false} // Read-only requirement
                placeholder={`${prefix.toUpperCase()}-YYYY-DD-MM-001`}
                placeholderTextColor="#999"
            />

            <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateID}
                activeOpacity={0.7}
            >
                <Text style={styles.buttonText}>Generate ID</Text>
            </TouchableOpacity>

            {generatedID ? (
                <Text style={styles.helperText}>
                    Next sequence: {String(sequence).padStart(3, '0')}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        alignSelf: 'center',
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#E8ECF4',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E232C',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    idDisplay: {
        backgroundColor: '#F7F8F9',
        borderWidth: 1,
        borderColor: '#E8ECF4',
        borderRadius: 8,
        padding: 16,
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Monospaced for ID consistency
        color: '#007AFF', // Blue accent for generated IDs
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    generateButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    helperText: {
        marginTop: 12,
        fontSize: 12,
        color: '#6A707C',
        textAlign: 'center',
    },
});

export default SequentialIDGenerator;
