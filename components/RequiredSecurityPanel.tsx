// Panel for critical/required security checks - these must all pass

import React from 'react';
import { RequiredSecurityCheck, SecurityStatus } from '../types/SecurityAttestationTypes';

interface RequiredSecurityPanelProps {
  checks: RequiredSecurityCheck[];
  title: string;
  description: string;
}

const RequiredSecurityPanel: React.FC<RequiredSecurityPanelProps> = ({ 
  checks, 
  title, 
  description 
}) => {
  // Calculate panel status - if ANY required check fails, status is critical
  const calculatePanelStatus = (): SecurityStatus => {
    const allPassed = checks.every(check => check.Value === check.DesiredValue);
    return allPassed ? 'healthy' : 'critical';
  };

  const panelStatus = calculatePanelStatus();

  // Human-readable field names
  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      'TpmPresent': 'TPM Hardware Present',
      'TpmMeetsMinimumVersion': 'TPM Version Compatible',
      'TpmIsResponsive': 'TPM Communication Active',
      'EkCertIsAvailable': 'Security Certificates Available',
      'TcgLogFound': 'Security Log Accessible'
    };
    return fieldNames[field] || field;
  };

  return (
    <div className={`security-panel required-panel status-${panelStatus}`}>
      <div className="panel-header">
        <h2>{title}</h2>
        <div className={`status-badge ${panelStatus}`}>
          {panelStatus === 'healthy' ? '✓ All Systems Go' : '⚠ Critical Issue'}
        </div>
      </div>
      
      <p className="panel-description">{description}</p>
      
      <div className="checks-list">
        {checks.map((check, index) => (
          <div 
            key={index} 
            className={`check-item ${check.Value === check.DesiredValue ? 'passed' : 'failed'}`}
          >
            <div className="check-icon">
              {check.Value === check.DesiredValue ? '✓' : '✗'}
            </div>
            <div className="check-details">
              <span className="check-name">{getFieldDisplayName(check.Field)}</span>
              <span className="check-status">
                {check.Value === check.DesiredValue ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequiredSecurityPanel;
