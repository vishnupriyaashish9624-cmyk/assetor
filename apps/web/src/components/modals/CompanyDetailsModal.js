import React from 'react';
import BaseModal from './BaseModal';
import CompanyInfoView from '../CompanyInfoView';

const CompanyDetailsModal = ({ visible, onClose, company }) => {
    if (!company) return null;

    return (
        <BaseModal visible={visible} onClose={onClose} title="Company Details" width={650}>
            <CompanyInfoView company={company} />
        </BaseModal>
    );
};

export default CompanyDetailsModal;
