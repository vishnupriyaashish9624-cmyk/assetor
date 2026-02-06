import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseModal from './BaseModal';

const ClientFormModal = ({ visible, onClose, onSave, client = null }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const initialState = {
        // 1. Identity
        name: '',
        company_code: '',
        trade_license: '',
        tax_no: '',
        industry: '',
        logo: '',
        // 2. Tenancy
        tenancy_type: 'OWNED', // OWNED | RENTED
        landlord_name: '',
        contract_start_date: '',
        contract_end_date: '',
        registration_no: '',
        ownership_doc_ref: '',
        // 3. Location
        country: '',
        state: '',
        city: '',
        area: '',
        address: '',
        po_box: '',
        makani_number: '',
        // 4. Contact
        telephone: '',
        email: '',
        website: '',
        support_email: '',
        // 5. Limits
        max_companies: 5,
        max_employees: 100,
        max_assets: 500,
        enabled_modules: ['dashboard', 'assets'],
        // 6. Admin
        admin_name: '',
        admin_email: '',
        admin_password: '',
        auto_generate_password: true,
        status: 'ACTIVE'
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (client) {
            // Fix: Merge with initialState, NOT current formData, to clear previous client data
            setFormData({
                ...initialState,
                ...client,
                enabled_modules: Array.isArray(client.enabled_modules) ? client.enabled_modules : JSON.parse(client.enabled_modules || '[]'),
                auto_generate_password: false,
                admin_password: ''
            });
        } else {
            // Reset for new client
            setCurrentStep(1);
            setFormData(initialState);
        }
    }, [client, visible]);

    const steps = [
        { id: 1, title: 'Identity', icon: 'domain' },
        { id: 2, title: 'Tenancy', icon: 'home-city' },
        { id: 3, title: 'Location', icon: 'map-marker' },
        { id: 4, title: 'Contact', icon: 'phone' },
        { id: 5, title: 'Limits', icon: 'shield-check' },
        { id: 6, title: 'Admin', icon: 'account-plus' },
    ];

    const handleSave = async () => {
        setLoading(true);
        try {
            // Generate password if auto-generate is on
            let finalData = { ...formData };
            if (formData.auto_generate_password && !formData.admin_password) {
                finalData.admin_password = 'Trakio' + Math.floor(1000 + Math.random() * 9000);
                if (client) {
                    // If editing, alert/log the new password since it won't be emailed (demo mode)
                    alert(`New Password Generated: ${finalData.admin_password}`);
                }
            }
            await onSave(finalData);
            onClose();
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const renderInput = (label, key, placeholder, keyboard = 'default', multiline = false, isPassword = false, autoComplete = 'off') => (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={formData[key]?.toString()}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                placeholder={placeholder}
                keyboardType={keyboard}
                multiline={multiline}
                placeholderTextColor="#94a3b8"
                secureTextEntry={isPassword}
                autoComplete={autoComplete}
            />
        </View>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Identity
                return (
                    <View style={styles.stepContent}>
                        {renderInput('Company Name*', 'name', 'e.g. Acme Corp Global')}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('Short Name', 'company_code', 'ACME')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('Industry', 'industry', 'Technology')}</View>
                        </View>
                        {renderInput('Trade License / Reg No.', 'trade_license', 'TL-12345')}
                        {renderInput('Tax / VAT No.', 'tax_no', 'VAT-98765')}
                    </View>
                );
            case 2: // Tenancy
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.sectionTitle}>Main Premises Tenancy</Text>
                        <View style={styles.typeSelector}>
                            {['OWNED', 'RENTED'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeButton, formData.tenancy_type === type && styles.typeButtonActive]}
                                    onPress={() => setFormData({ ...formData, tenancy_type: type })}
                                >
                                    <MaterialCommunityIcons
                                        name={type === 'OWNED' ? 'home' : 'office-building'}
                                        size={20}
                                        color={formData.tenancy_type === type ? '#3b82f6' : '#64748b'}
                                    />
                                    <Text style={[styles.typeButtonText, formData.tenancy_type === type && styles.typeButtonTextActive]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {formData.tenancy_type === 'RENTED' ? (
                            <>
                                {renderInput('Landlord Name', 'landlord_name', 'Landlord Co.')}
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>{renderInput('Start Date', 'contract_start_date', 'YYYY-MM-DD')}</View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('End Date', 'contract_end_date', 'YYYY-MM-DD')}</View>
                                </View>
                                {renderInput('Ejari / Tawtheeq No.', 'registration_no', 'REG-123-456')}
                            </>
                        ) : (
                            renderInput('Ownership Doc Ref', 'ownership_doc_ref', 'DEED-789-012')
                        )}
                    </View>
                );
            case 3: // Location
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('Country*', 'country', 'United Arab Emirates')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('State/Emirate*', 'state', 'Dubai')}</View>
                        </View>
                        {renderInput('City*', 'city', 'Dubai')}
                        {renderInput('Area / District', 'area', 'Downtown Dubai')}
                        {renderInput('Full Address*', 'address', 'Bldg 123, Office 456...', 'default', true)}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('Makani / Plus Code', 'makani_number', '12345 67890')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('PO Box', 'po_box', '12345')}</View>
                        </View>
                    </View>
                );
            case 4: // Contact
                return (
                    <View style={styles.stepContent}>
                        {renderInput('Telephone', 'telephone', '+971 4 123 4567', 'phone-pad')}
                        {renderInput('Company Email', 'email', 'info@acme.com', 'email-address')}
                        {renderInput('Website', 'website', 'https://acme.com', 'url')}
                        {renderInput('Support Email', 'support_email', 'support@acme.com', 'email-address')}
                    </View>
                );
            case 5: // Limits & Modules
                const modules = [
                    { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
                    { key: 'companies', label: 'Company', icon: 'domain' },
                    { key: 'assets', label: 'Assets', icon: 'cube' },
                    { key: 'premises', label: 'Premises', icon: 'office-building' },
                    { key: 'premises_display', label: 'Premises Display', icon: 'monitor-dashboard' },
                    { key: 'employees', label: 'Staff Members', icon: 'account-group' },
                    { key: 'module', label: 'Module', icon: 'view-grid-plus' },
                    { key: 'module_sections', label: 'Module Sections', icon: 'view-agenda' },
                    { key: 'sub_modules', label: 'Sub-modules', icon: 'view-list' },
                    { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
                    { key: 'reports', label: 'Reports', icon: 'file-chart' },
                ];
                const toggleModule = (key) => {
                    const current = [...formData.enabled_modules];
                    const idx = current.indexOf(key);
                    if (idx > -1) current.splice(idx, 1);
                    else current.push(key);
                    setFormData({ ...formData, enabled_modules: current });
                };
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('Max Companies', 'max_companies', '5', 'numeric')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('Max Employees*', 'max_employees', '100', 'numeric')}</View>
                        </View>
                        {renderInput('Max Assets*', 'max_assets', '500', 'numeric')}
                        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Enabled Modules*</Text>
                        <View style={styles.moduleGrid}>
                            {modules.map(mod => (
                                <TouchableOpacity
                                    key={mod.key}
                                    style={[styles.moduleChip, formData.enabled_modules.includes(mod.key) && styles.moduleChipActive]}
                                    onPress={() => toggleModule(mod.key)}
                                >
                                    <MaterialCommunityIcons name={mod.icon} size={16} color={formData.enabled_modules.includes(mod.key) ? 'white' : '#64748b'} />
                                    <Text style={[styles.moduleChipText, formData.enabled_modules.includes(mod.key) && styles.moduleChipTextActive]}>{mod.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 6: // Admin User
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.infoBoxText}>This user will be the primary administrator for this client.</Text>
                        {renderInput('Admin Name*', 'admin_name', 'Full Name')}
                        {renderInput('Admin Email*', 'admin_email', 'admin@client.com', 'email-address', false, false, 'off')}

                        {/* Password Section */}
                        <View style={{ marginTop: 8 }}>
                            {!client ? (
                                // NEW CLIENT: Option to Auto-generate
                                <>
                                    <View style={styles.passwordHeader}>
                                        <Text style={styles.inputLabel}>Admin Authentication</Text>
                                        <TouchableOpacity
                                            style={styles.autoGenToggle}
                                            onPress={() => setFormData({ ...formData, auto_generate_password: !formData.auto_generate_password })}
                                        >
                                            <MaterialCommunityIcons
                                                name={formData.auto_generate_password ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                size={20}
                                                color={formData.auto_generate_password ? '#3b82f6' : '#94a3b8'}
                                            />
                                            <Text style={[styles.autoGenText, formData.auto_generate_password && { color: '#3b82f6' }]}>Auto-generate</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {formData.auto_generate_password ? (
                                        <View style={styles.autoGenBanner}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#0369a1" />
                                            <Text style={styles.autoGenBannerText}>A temporary password will be created automatically.</Text>
                                        </View>
                                    ) : (
                                        renderInput('Set Admin Password*', 'admin_password', 'Enter at least 8 characters', 'default', false, true, 'new-password')
                                    )}
                                </>
                            ) : (
                                // EXISTING CLIENT: Always show reset field
                                <>
                                    <Text style={styles.inputLabel}>Reset Admin Password</Text>
                                    {renderInput(null, 'admin_password', 'Enter new password to reset', 'default', false, true, 'new-password')}
                                </>
                            )}

                        </View>
                        {client && (
                            <View style={styles.section}>
                                <Text style={styles.inputLabel}>Account Status</Text>
                                <View style={styles.typeSelector}>
                                    {['ACTIVE', 'SUSPENDED'].map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[styles.typeButton, formData.status === s && (s === 'ACTIVE' ? styles.statusActive : styles.statusSuspended)]}
                                            onPress={() => setFormData({ ...formData, status: s })}
                                        >
                                            <Text style={[styles.typeButtonText, formData.status === s && styles.statusButtonTextActive]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <BaseModal
            visible={visible}
            onClose={onClose}
            title={client ? 'Edit Client' : 'Add New Client (Tenant/Company)'}
            width={650}
        >
            <View style={styles.mainContainer}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <TouchableOpacity
                                style={[styles.progressStep, currentStep >= step.id && styles.progressStepActive]}
                                onPress={() => setCurrentStep(step.id)}
                            >
                                <View style={[styles.stepIcon, currentStep === step.id && styles.stepIconCurrent]}>
                                    <MaterialCommunityIcons name={step.icon} size={18} color={currentStep >= step.id ? '#3b82f6' : '#94a3b8'} />
                                </View>
                                <Text style={[styles.stepTitle, currentStep >= step.id && styles.stepTitleActive]}>{step.title}</Text>
                            </TouchableOpacity>
                            {idx < steps.length - 1 && <View style={[styles.progressLine, currentStep > step.id && styles.progressLineActive]} />}
                        </React.Fragment>
                    ))}
                </View>

                {/* Content */}
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {renderStepContent()}
                </ScrollView>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.footerButton, styles.backButton, currentStep === 1 && { opacity: 0 }]}
                        onPress={prevStep}
                        disabled={currentStep === 1}
                    >
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    {currentStep < steps.length ? (
                        <TouchableOpacity style={[styles.footerButton, styles.nextButton]} onPress={nextStep}>
                            <Text style={styles.nextButtonText}>Next Section</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.footerButton, styles.saveButton]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <>
                                    <Text style={styles.saveButtonText}>{client ? 'Update Client' : 'Finish & Create'}</Text>
                                    <MaterialCommunityIcons name="check-all" size={20} color="white" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    mainContainer: { height: 600 },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    progressStep: { alignItems: 'center', zIndex: 2 },
    stepIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepIconCurrent: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
    stepTitle: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
    stepTitleActive: { color: '#3b82f6' },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: -10,
        marginTop: -16,
    },
    progressLineActive: { backgroundColor: '#3b82f6' },
    scrollContent: { flex: 1, padding: 24 },
    stepContent: { animationDuration: '0.3s' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: 'white',
        gap: 8,
    },
    typeButtonActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
    typeButtonText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    typeButtonTextActive: { color: '#3b82f6' },
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    moduleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: 'white',
        gap: 6,
    },
    moduleChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    moduleChipText: { fontSize: 12, color: '#64748b' },
    moduleChipTextActive: { color: 'white', fontWeight: '600' },
    infoBoxText: { fontSize: 13, color: '#64748b', backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#bae6fd' },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    checkboxLabel: { fontSize: 14, color: '#475569' },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#f8fafc',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    backButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' },
    backButtonText: { color: '#64748b', fontWeight: '600' },
    nextButton: { backgroundColor: '#3b82f6' },
    nextButtonText: { color: 'white', fontWeight: '700', marginRight: 4 },
    saveButton: { backgroundColor: '#10b981' },
    saveButtonText: { color: 'white', fontWeight: '700' },
    statusActive: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
    statusSuspended: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    autoGenToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    autoGenText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
    },
    autoGenBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f0f9ff',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#bae6fd',
        marginBottom: 16,
    },
    autoGenBannerText: {
        fontSize: 13,
        color: '#0369a1',
        fontWeight: '500',
    },
});

export default ClientFormModal;
