import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal, Portal, Text, Button, Checkbox, Divider, IconButton } from 'react-native-paper';

const FileConfigDialog = ({ visible, onDismiss, onSave, initialConfig }) => {
    const [hasExpiry, setHasExpiry] = useState(false);
    const [hasStartDate, setHasStartDate] = useState(false);
    const [hasEndDate, setHasEndDate] = useState(false);

    // New Fields
    const [hasPolicyNo, setHasPolicyNo] = useState(false);
    const [hasIssueDate, setHasIssueDate] = useState(false);
    const [hasReminder, setHasReminder] = useState(false);
    const [hasCoverageType, setHasCoverageType] = useState(false);

    useEffect(() => {
        if (visible) {
            setHasExpiry(initialConfig?.expiry || false);
            setHasStartDate(initialConfig?.startDate || false);
            setHasEndDate(initialConfig?.endDate || false);
            setHasPolicyNo(initialConfig?.policyNo || false);
            setHasIssueDate(initialConfig?.issueDate || false);
            setHasReminder(initialConfig?.reminder || false);
            setHasCoverageType(initialConfig?.coverageType || false);
        }
    }, [visible, initialConfig]);

    const handleSave = () => {
        onSave({
            expiry: hasExpiry,
            startDate: hasStartDate,
            endDate: hasEndDate,
            policyNo: hasPolicyNo,
            issueDate: hasIssueDate,
            reminder: hasReminder,
            coverageType: hasCoverageType
        });
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
                <View style={[styles.header, { justifyContent: 'flex-end', borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <IconButton icon="close" size={20} onPress={onDismiss} />
                </View>

                <View style={styles.content}>

                    <TouchableOpacity style={styles.row} onPress={() => setHasPolicyNo(!hasPolicyNo)}>
                        <Checkbox.Android status={hasPolicyNo ? 'checked' : 'unchecked'} color="#3b82f6" />
                        <Text style={styles.label}>Property Insurance Policy No.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} onPress={() => setHasIssueDate(!hasIssueDate)}>
                        <Checkbox.Android status={hasIssueDate ? 'checked' : 'unchecked'} color="#3b82f6" />
                        <Text style={styles.label}>Issue Date</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} onPress={() => setHasStartDate(!hasStartDate)}>
                        <Checkbox.Android status={hasStartDate ? 'checked' : 'unchecked'} color="#3b82f6" />
                        <Text style={styles.label}>Start Date</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} onPress={() => setHasEndDate(!hasEndDate)}>
                        <Checkbox.Android status={hasEndDate ? 'checked' : 'unchecked'} color="#3b82f6" />
                        <Text style={styles.label}>End Date</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} onPress={() => setHasExpiry(!hasExpiry)}>
                        <Checkbox.Android status={hasExpiry ? 'checked' : 'unchecked'} color="#3b82f6" />
                        <Text style={styles.label}>Expiry Date</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} onPress={() => setHasReminder(!hasReminder)}>
                        <Checkbox.Android status={hasReminder ? 'checked' : 'unchecked'} color="#3b82f6" />
                        <Text style={styles.label}>Reminder (30/60/90 days before)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} onPress={() => setHasCoverageType(!hasCoverageType)}>
                        <Checkbox.Android status={hasCoverageType ? 'checked' : 'unchecked'} color="#3b82f6" />
                        <Text style={styles.label}>Coverage Type</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                    <Button onPress={onDismiss} textColor="#64748b">Cancel</Button>
                    <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>Save Configuration</Button>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 8,
        maxWidth: 400,
        alignSelf: 'center',
        width: '90%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    content: {
        padding: 20
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    label: {
        fontSize: 14,
        color: '#334155',
        marginLeft: 8
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    saveBtn: {
        backgroundColor: '#3b82f6'
    }
});

export default FileConfigDialog;
