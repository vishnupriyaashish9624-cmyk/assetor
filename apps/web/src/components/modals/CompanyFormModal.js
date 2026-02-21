import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseModal from './BaseModal';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5021/api';

const CompanyFormModal = ({ visible, onClose, onSave, clientId, clientName, company = null }) => {
    const fileInputRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [documents, setDocuments] = useState([]); // [{ name, content, file_type, context }]
    const [existingDocs, setExistingDocs] = useState([]);
    const [uploadContext, setUploadContext] = useState(null);
    const [propertyTypes, setPropertyTypes] = useState([]);

    const initialState = {
        // 1. Identity
        name: '',
        company_code: '',
        trade_license: '',
        tax_no: '',
        industry: '',
        logo: '',
        subdomain: '',
        // 2. Tenancy
        tenancy_type: 'LEASED',
        landlord_name: '',
        lease_start_date: '',
        lease_end_date: '',
        // 3. Location
        country: 'United Arab Emirates',
        city: 'Dubai',
        area: '',
        address: '',
        makani_no: '',
        // 4. Contact
        telephone: '',
        email: '',
        website: '',
        // 5. Limits
        max_employees: 10,
        max_assets: 20,
        can_add_employee: true,
        enabled_modules: ['dashboard', 'assets'],
        // 6. Admin
        admin_name: '',
        admin_email: '',
        admin_password: '',
        auto_generate_password: true,
        send_email: true,
        status: 'ACTIVE'
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        setLoading(false);
        setError(null);
        if (company) {
            setFormData({
                ...initialState,
                ...company,
                admin_name: company.linked_admin_name || company.admin_name || '',
                admin_email: company.linked_admin_email || company.admin_email || '',
                can_add_employee: company.can_add_employee !== undefined ? company.can_add_employee : true,
                max_employees: company.max_employees || 10,
                max_assets: company.max_assets || 20,
                enabled_modules: Array.isArray(company.enabled_modules) ? company.enabled_modules : JSON.parse(company.enabled_modules || '["dashboard", "assets"]'),
                status: company.status || 'ACTIVE'
            });
            fetchExistingDocs();
        } else {
            setFormData(initialState);
            setDocuments([]);
            setExistingDocs([]);
            setCurrentStep(1);
        }
        fetchPropertyTypes();
    }, [company, visible]);

    const fetchPropertyTypes = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/property-types`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setPropertyTypes(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching property types:', err);
        }
    };

    const fetchExistingDocs = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/companies/${company.id}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setExistingDocs(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching docs:', err);
        }
    };

    const steps = [
        { id: 1, title: 'Admin', icon: 'account-plus' },
        { id: 2, title: 'Identity', icon: 'domain' },
        { id: 3, title: 'Tenancy', icon: 'home-city' },
        { id: 4, title: 'Location', icon: 'map-marker' },
        { id: 5, title: 'Contact', icon: 'phone' },
        { id: 6, title: 'Documents', icon: 'file-document-outline' },
        { id: 7, title: 'Limits', icon: 'shield-check' },
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        console.log('[FilePicker] Selected file:', file ? file.name : 'none');
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('[FilePicker] Reader loaded content for:', file.name);
            const content = e.target.result;
            const newDoc = {
                name: uploadContext ? `${uploadContext}_${file.name}` : file.name,
                fileName: file.name,
                content: content,
                file_type: file.type,
                size: (file.size / 1024).toFixed(2) + ' KB',
                context: uploadContext
            };
            setDocuments(prev => [...prev, newDoc]);
            if (uploadContext) {
                setFormData(prev => ({ ...prev, [uploadContext]: file.fileName || file.name }));
            }
            setUploadContext(null);
            if (event.target) event.target.value = '';
        };
        reader.onerror = (err) => console.error('[FilePicker] Reader error:', err);
        reader.readAsDataURL(file);
    };

    const removeDocument = (index) => {
        setDocuments(documents.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!formData.name) {
            setError('Company name is required');
            setCurrentStep(1);
            return;
        }

        setError(null);
        setLoading(true);
        try {
            let finalData = { ...formData, client_id: clientId };

            // Generate password if auto-generate is on
            if (!company && formData.auto_generate_password && !formData.admin_password) {
                finalData.admin_password = 'Trakio' + Math.floor(1000 + Math.random() * 9000);
            }

            // Auto-generate subdomain if empty
            if (!company && !formData.subdomain) {
                finalData.subdomain = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString(36);
            }

            console.log('[handleSave] Calling onSave...');
            // Save Company first (get ID)
            const savedCompany = await onSave(finalData);
            console.log('[handleSave] onSave returned:', savedCompany);
            const targetId = company?.id || savedCompany?.id;

            // Upload Documents if any
            if (targetId && documents.length > 0) {
                const token = await AsyncStorage.getItem('token');
                console.log(`[Upload] Attempting to upload ${documents.length} files for company ${targetId}`);
                for (const doc of documents) {
                    try {
                        const res = await axios.post(`${API_URL}/companies/${targetId}/documents`, doc, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log(`[Upload] Success: ${doc.name} -> ${res.data.path}`);
                    } catch (uploadErr) {
                        console.error(`[Upload] Failed: ${doc.name}`, uploadErr.response?.data || uploadErr.message);
                    }
                }
            }

            console.log('[handleSave] Closing modal');
            onClose();
        } catch (err) {
            console.error('[handleSave] ERROR:', err);
            setError(err.response?.data?.detail || err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label, key, placeholder, keyboard = 'default', multiline = false, isPassword = false) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={formData[key]?.toString() || ''}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                placeholder={placeholder}
                keyboardType={keyboard}
                multiline={multiline}
                placeholderTextColor="#94a3b8"
                secureTextEntry={isPassword}
            />
        </View>
    );

    const renderInputWithFile = (label, key, placeholder) => {
        const attachedFile = documents.find(d => d.context === key);

        return (
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{label}</Text>
                <View style={[styles.unifiedInput, attachedFile && styles.unifiedInputSuccess]}>
                    <TextInput
                        style={styles.flexInput}
                        value={formData[key]?.toString() || ''}
                        onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                        placeholder={placeholder}
                        placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity
                        style={[styles.inputAction, attachedFile && styles.inputActionSuccess]}
                        onPress={() => {
                            console.log('[UI] Triggering upload for context:', key);
                            setUploadContext(key);
                            fileInputRef.current?.click();
                        }}
                    >
                        <MaterialCommunityIcons
                            name={attachedFile ? "check-decagram" : "file-upload-outline"}
                            size={22}
                            color={attachedFile ? "#10b981" : "#3b82f6"}
                        />
                    </TouchableOpacity>
                </View>
                {attachedFile && (
                    <View style={styles.premiumChip}>
                        <View style={styles.chipBody}>
                            <MaterialCommunityIcons name="file-check-outline" size={16} color="#059669" />
                            <Text style={styles.chipText} numberOfLines={1}>{attachedFile.fileName}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setDocuments(documents.filter(d => d.context !== key))}
                            style={styles.chipClose}
                        >
                            <MaterialCommunityIcons name="close" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Admin User
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.sectionTitle}>Administrator Account</Text>
                        <Text style={styles.infoBoxText}>Create the primary administrative user for this company. They will have full access to manage assets and employees.</Text>

                        {renderInput('Admin Name*', 'admin_name', 'e.g. John Smith')}
                        {renderInput('Admin Email*', 'admin_email', 'admin@' + (formData.name?.toLowerCase().replace(/\s+/g, '') || 'company') + '.com', 'email-address')}

                        {!company && (
                            <View style={styles.securitySection}>
                                <View style={styles.securityHeader}>
                                    <View style={styles.securityIconBadge}>
                                        <MaterialCommunityIcons name="shield-lock" size={18} color="#3b82f6" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.securityTitle}>Access Protection</Text>
                                        <Text style={styles.securitySubtitle}>Credential & notification settings</Text>
                                    </View>
                                </View>

                                {/* Auto Gen Toggle Row */}
                                <View style={styles.settingRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.settingLabel}>Auto-generate Password</Text>
                                        <Text style={styles.settingDesc}>System will create a secure temporary password</Text>
                                    </View>
                                    <Switch
                                        value={formData.auto_generate_password}
                                        onValueChange={(val) => setFormData({ ...formData, auto_generate_password: val })}
                                        trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                                        thumbColor={formData.auto_generate_password ? "#3b82f6" : "#f1f5f9"}
                                        style={Platform.OS === 'web' ? { width: 44, height: 24 } : {}}
                                    />
                                </View>

                                {formData.auto_generate_password ? (
                                    <View style={styles.bannerInfo}>
                                        <MaterialCommunityIcons name="information-outline" size={18} color="#0369a1" />
                                        <Text style={styles.bannerText}>For security, the user will be forced to change this password on first login.</Text>
                                    </View>
                                ) : (
                                    <View style={{ marginTop: 12 }}>
                                        {renderInput('Set Password*', 'admin_password', 'Min 8 characters', 'default', false, true)}
                                    </View>
                                )}

                                {/* Email Notify Row */}
                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setFormData({ ...formData, send_email: !formData.send_email })}
                                >
                                    <View style={[styles.checkbox, formData.send_email && styles.checkboxChecked]}>
                                        {formData.send_email && <MaterialCommunityIcons name="check" size={12} color="white" />}
                                    </View>
                                    <View>
                                        <Text style={styles.checkboxLabel}>Send welcome email with credentials</Text>
                                        <Text style={styles.checkboxSubLabel}>The user will receive their login details instantly.</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                );

            case 2: // Identity
                return (
                    <View style={styles.stepContent}>
                        {renderInput('Company Name*', 'name', 'e.g. Acme Services LLC')}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('Short Code', 'company_code', 'ACME')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('Industry', 'industry', 'Technology')}</View>
                        </View>
                        {renderInputWithFile('Trade License', 'trade_license', 'TL-12345')}
                        {renderInput('Tax / VAT No.', 'tax_no', 'VAT-98765')}
                        {renderInput('Subdomain', 'subdomain', 'e.g. acme-services (optional)')}
                    </View>
                );

            case 3: // Tenancy
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>Tenancy Type</Text>
                        <View style={styles.typeSelector}>
                            {['LEASED', 'OWNED'].map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeButton, formData.tenancy_type === t && styles.typeButtonActive]}
                                    onPress={() => setFormData({ ...formData, tenancy_type: t })}
                                >
                                    <Text style={[styles.typeButtonText, formData.tenancy_type === t && styles.typeButtonTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {renderInput('Landlord Name', 'landlord_name', 'e.g. Dubai Properties')}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('Lease Start', 'lease_start_date', 'YYYY-MM-DD')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('Lease End', 'lease_end_date', 'YYYY-MM-DD')}</View>
                        </View>
                    </View>
                );

            case 4: // Location
                return (
                    <View style={styles.stepContent}>
                        {renderInput('Country', 'country', 'e.g. United Arab Emirates')}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('City', 'city', 'Dubai')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('Area', 'area', 'e.g. Business Bay')}</View>
                        </View>
                        {renderInput('Address', 'address', 'e.g. 123 Sky Tower', true)}
                        {renderInput('Makani Number', 'makani_no', '12345 67890')}
                    </View>
                );

            case 5: // Contact
                return (
                    <View style={styles.stepContent}>
                        {renderInput('Telephone', 'telephone', '+971 4 123 4567', 'phone-pad')}
                        {renderInput('Company Email', 'email', 'info@acme.com', 'email-address')}
                        {renderInput('Website', 'website', 'https://acme.com', 'url')}
                    </View>
                );

            case 6: // Documents
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.sectionTitle}>Company Documents</Text>
                        <Text style={styles.infoBoxText}>Upload Trade License, Title Deeds, or Tenancy Contracts.</Text>

                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={() => {
                                setUploadContext(null);
                                fileInputRef.current?.click();
                            }}
                        >
                            <MaterialCommunityIcons name="cloud-upload" size={24} color="#3b82f6" />
                            <Text style={styles.uploadButtonText}>Select Document</Text>
                        </TouchableOpacity>

                        <View style={styles.docList}>
                            {existingDocs.map((doc, idx) => (
                                <View key={`existing-${idx}`} style={styles.docItem}>
                                    <MaterialCommunityIcons name="file-check" size={20} color="#10b981" />
                                    <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                                    <Text style={styles.existingTag}>Saved</Text>
                                </View>
                            ))}
                            {documents.map((doc, idx) => (
                                <View key={`new-${idx}`} style={styles.docItem}>
                                    <MaterialCommunityIcons name="file-plus" size={20} color="#3b82f6" />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                                        <Text style={styles.docSize}>{doc.size}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeDocument(idx)}>
                                        <MaterialCommunityIcons name="close-circle" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            case 7: // Limits & Privileges
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderInput('Max Employees*', 'max_employees', '10', 'numeric')}</View>
                            <View style={{ flex: 1, marginLeft: 12 }}>{renderInput('Max Assets*', 'max_assets', '20', 'numeric')}</View>
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Privileges</Text>
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setFormData({ ...formData, can_add_employee: !formData.can_add_employee })}
                        >
                            <MaterialCommunityIcons
                                name={formData.can_add_employee ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                size={22}
                                color={formData.can_add_employee ? '#3b82f6' : '#cbd5e1'}
                            />
                            <Text style={styles.checkboxLabel}>Can Add Employees</Text>
                        </TouchableOpacity>

                        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Enabled Modules*</Text>
                        <View style={styles.moduleGrid}>
                            {[
                                { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
                                { key: 'assets', label: 'Assets', icon: 'cube' },
                                { key: 'vehicles', label: 'Vehicles', icon: 'car' },
                                { key: 'premises', label: 'Premises', icon: 'office-building' },
                                { key: 'premises_display', label: 'Premises Display', icon: 'monitor-dashboard' },
                                { key: 'employees', label: 'Staff Members', icon: 'account-group' },
                                { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
                                { key: 'reports', label: 'Reports', icon: 'file-chart' },
                            ].map(mod => (
                                <TouchableOpacity
                                    key={mod.key}
                                    style={[styles.moduleChip, formData.enabled_modules.includes(mod.key) && styles.moduleChipActive]}
                                    onPress={() => {
                                        const current = [...formData.enabled_modules];
                                        const idx = current.indexOf(mod.key);
                                        if (idx > -1) current.splice(idx, 1);
                                        else current.push(mod.key);
                                        setFormData({ ...formData, enabled_modules: current });
                                    }}
                                >
                                    <MaterialCommunityIcons name={mod.icon} size={16} color={formData.enabled_modules.includes(mod.key) ? 'white' : '#64748b'} />
                                    <Text style={[styles.moduleChipText, formData.enabled_modules.includes(mod.key) && styles.moduleChipTextActive]}>{mod.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {company && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.inputLabel}>Account Status</Text>
                                <View style={styles.typeSelector}>
                                    {['ACTIVE', 'INACTIVE'].map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[styles.typeButton, formData.status === s && (s === 'ACTIVE' ? styles.statusActive : styles.statusInactive)]}
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
            title={company ? `Edit ${company.name}` : `Add Company to ${clientName}`}
            width={650}
        >
            <View style={styles.mainContainer}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    {steps.map((step, idx) => (
                        <React.Fragment key={`step-${step.id}`}>
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

                {error && (
                    <View style={styles.errorBox}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#dc2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Content */}
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {renderStepContent()}
                </ScrollView>

                {Platform.OS === 'web' && (
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                )}

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
                            <Text style={styles.nextButtonText}>Next</Text>
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
                                    <Text style={styles.saveButtonText}>{company ? 'Update Company' : 'Finish & Create'}</Text>
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
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingVertical: 15,
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
    statusActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
    statusInactive: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    statusButtonTextActive: { color: '#1e293b' },
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
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
    checkboxLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        marginHorizontal: 24,
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
        gap: 8
    },
    errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600', flex: 1 },
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
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#cbd5e1',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        gap: 12,
        marginBottom: 20,
    },
    uploadButtonText: { fontSize: 15, color: '#3b82f6', fontWeight: '700' },
    docList: { gap: 10 },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
    },
    docName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1e293b' },
    docSize: { fontSize: 11, color: '#94a3b8' },
    existingTag: { fontSize: 10, fontWeight: '700', color: '#10b981', backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, textTransform: 'uppercase' },
    inlineUploadButton: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 10,
        padding: 10,
        marginLeft: 8,
        height: 48,
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unifiedInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingLeft: 4,
        overflow: 'hidden',
    },
    unifiedInputSuccess: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    flexInput: {
        flex: 1,
        height: 48,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#1e293b',
    },
    inputAction: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#white',
        borderLeftWidth: 1,
        borderLeftColor: '#e2e8f0',
    },
    inputActionSuccess: {
        backgroundColor: '#f0fdf4',
        borderLeftColor: '#dcfce7',
    },
    premiumChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        borderRadius: 20,
        paddingLeft: 10,
        paddingRight: 4,
        paddingVertical: 4,
        marginTop: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#10b981',
    },
    chipBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 8,
    },
    chipText: {
        fontSize: 12,
        color: '#065f46',
        fontWeight: '700',
        maxWidth: 200,
    },
    chipClose: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Security Section Styles
    securitySection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    securityIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    securityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    securitySubtitle: {
        fontSize: 11,
        color: '#64748b',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 12,
    },
    settingLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    settingDesc: {
        fontSize: 11,
        color: '#94a3b8',
    },
    bannerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#bae6fd',
        marginBottom: 16,
        gap: 10,
    },
    bannerText: {
        flex: 1,
        fontSize: 12,
        color: '#0369a1',
        fontWeight: '500',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    checkboxSubLabel: {
        fontSize: 11,
        color: '#94a3b8',
    },
});

export default CompanyFormModal;
