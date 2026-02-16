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

    const renderInput = (label, key, placeholder, helperText = null, keyboard = 'default', multiline = false, isPassword = false, autoComplete = 'off') => (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={formData[key]?.toString()}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                keyboardType={keyboard}
                multiline={multiline}
                secureTextEntry={isPassword}
                autoComplete={autoComplete}
            />
            {helperText && <Text style={styles.helperText}>{helperText}</Text>}
        </View>
    );

    const renderSectionHeader = (title, subtitle) => (
        <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderTitle}>{title}</Text>
            {subtitle && <Text style={styles.sectionHeaderSubtitle}>{subtitle}</Text>}
        </View>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Identity
                return (

                    <View style={styles.stepContent}>
                        {renderSectionHeader('Company Identity', 'Legal and business identification details')}
                        {renderInput('COMPANY NAME*', 'name', 'e.g. Acme Corp Global')}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('SHORT NAME', 'company_code', 'ACME', 'As per trade license')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('INDUSTRY', 'industry', 'Technology')}</View>
                        </View>
                        {renderInput('TRADE LICENSE / REG NO.', 'trade_license', 'TL-12345', 'Used for invoicing & compliance')}
                        {renderInput('TAX / VAT NO.', 'tax_no', 'VAT-98765')}
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
                                        color={formData.tenancy_type === type ? '#6c7ae0' : '#64748b'}
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
                    { key: 'vehicles', label: 'Vehicles', icon: 'car' },
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
                        {renderInput('Admin Email*', 'admin_email', 'admin@client.com', null, 'email-address', false, false, 'off')}

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
                                                color={formData.auto_generate_password ? '#6c7ae0' : '#94a3b8'}
                                            />
                                            <Text style={[styles.autoGenText, formData.auto_generate_password && { color: '#6c7ae0' }]}>Auto-generate</Text>
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
            title={client ? 'Edit Client' : 'Add New Client'}
            width={700}
        >
            <View style={styles.mainContainer}>
                <Text style={styles.modalSubtitle}>Tenant / Company onboarding</Text>

                {/* Modern Pill Stepper */}
                <View style={styles.progressContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepperScroll}>
                        {steps.map((step, idx) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            return (
                                <React.Fragment key={step.id}>
                                    <TouchableOpacity
                                        style={[styles.pillStep, isActive && styles.pillStepActive]}
                                        onPress={() => setCurrentStep(step.id)}
                                    >
                                        <MaterialCommunityIcons
                                            name={step.icon}
                                            size={16}
                                            color={isActive ? 'white' : '#64748b'}
                                            style={{ marginRight: isActive ? 6 : 0 }}
                                        />
                                        {isActive && <Text style={styles.pillStepText}>{step.title}</Text>}
                                        {!isActive && <Text style={styles.pillStepTextInactive}>{step.title}</Text>}
                                    </TouchableOpacity>
                                    {idx < steps.length - 1 && <View style={styles.stepperLine} />}
                                </React.Fragment>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Content */}
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {renderStepContent()}
                </ScrollView>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    {/* Left: Step Indicator */}
                    <Text style={styles.stepIndicatorText}>
                        Step {currentStep} of {steps.length} • <Text style={{ fontWeight: 'bold' }}>{steps[currentStep - 1].title}</Text>
                    </Text>

                    {/* Right: Buttons */}
                    <View style={styles.footerButtonRow}>
                        <TouchableOpacity
                            style={[styles.footerButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        {currentStep < steps.length ? (
                            <TouchableOpacity style={[styles.footerButton, styles.nextButton]} onPress={nextStep}>
                                <Text style={styles.nextButtonText}>Next</Text>
                                <MaterialCommunityIcons name="arrow-right" size={16} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.footerButton, styles.saveButton]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="white" /> : (
                                    <>
                                        <Text style={styles.saveButtonText}>{client ? 'Update' : 'Finish'}</Text>
                                        <MaterialCommunityIcons name="check" size={16} color="white" style={{ marginLeft: 6 }} />
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    mainContainer: { height: 600 },
    progressContainer: {
        paddingVertical: 12,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    stepperScroll: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    pillStep: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    pillStepActive: {
        backgroundColor: '#6c7ae0',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    pillStepText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'white',
    },
    pillStepTextInactive: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 6,
    },
    stepperLine: {
        width: 15,
        height: 1,
        backgroundColor: '#cbd5e1',
        marginHorizontal: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 24,
        marginTop: -15, // Pull up closer to title
        marginBottom: 15,
    },
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
    typeButtonActive: { borderColor: '#6c7ae0', backgroundColor: '#eff6ff' },
    typeButtonText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    typeButtonTextActive: { color: '#6c7ae0' },
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
    moduleChipActive: { backgroundColor: '#6c7ae0', borderColor: '#6c7ae0' },
    moduleChipText: { fontSize: 12, color: '#64748b' },
    moduleChipTextActive: { color: 'white', fontWeight: '600' },
    infoBoxText: { fontSize: 13, color: '#64748b', backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#bae6fd' },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    checkboxLabel: { fontSize: 14, color: '#475569' },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: 'white',
    },
    stepIndicatorText: {
        fontSize: 13,
        color: '#64748b',
    },
    footerButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#6c7ae0',
    },
    saveButton: {
        backgroundColor: '#22c55e',
    },
    nextButtonText: {
        color: 'white',
        fontWeight: '600',
        marginRight: 8,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
        marginRight: 6,
    },
    helperText: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },
    sectionHeaderContainer: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 12,
    },
    sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    sectionHeaderSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
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
