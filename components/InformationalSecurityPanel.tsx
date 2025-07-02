// Panel for informational security status - additional features and compliance

import React from 'react';
import { InformationalSecurityCheck } from '../types/SecurityAttestationTypes';

interface InformationalSecurityPanelProps {
  checks: InformationalSecurityCheck[];
  title: string;
  description: string;
}

const InformationalSecurityPanel: React.FC<InformationalSecurityPanelProps> = ({ 
  checks, 
  title, 
  description 
}) => {
  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      'SecureBootEnabled': 'Secure Boot Protection',
      'VirtualSecureMemory': 'Memory Protection (VSM)',
      'SecureCorePCCompliant': 'Secure Core PC Compliance'
    };
    return fieldNames[field] || field;
  };

  const getFeatureStatus = (check: InformationalSecurityCheck): string => {
    const computerEnabled = check.ValueFromComputer;
    const tcgEnabled = check.ValueFromTcgLog;
    const verifiable = check.TcgValueIsVerifiable;
    
    if (computerEnabled && tcgEnabled) return 'ENABLED';
    if (!computerEnabled && !tcgEnabled && verifiable) return 'DISABLED (Verified)';
    if (!verifiable) return 'UNKNOWN';
    return 'MIXED STATUS';
  };

  const getStatusClass = (check: InformationalSecurityCheck): string => {
    const status = getFeatureStatus(check);
    if (status === 'ENABLED') return 'enabled';
    if (status === 'DISABLED (Verified)') return 'disabled-verified';
    return 'unknown';
  };

  return (
    <div className="security-panel informational-panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <div className="status-badge informational">
          ℹ Information Only
        </div>
      </div>
      
      <p className="panel-description">{description}</p>
      
      <div className="checks-list">
        {checks.map((check, index) => (
          <div key={index} className={`check-item ${getStatusClass(check)}`}>
            <div className="check-icon">
              {getFeatureStatus(check) === 'ENABLED' ? '✓' : 
               getFeatureStatus(check) === 'DISABLED (Verified)' ? 'ℹ' : '?'}
            </div>
            <div className="check-details">
              <span className="check-name">{getFieldDisplayName(check.Field)}</span>
              <span className="check-status">{getFeatureStatus(check)}</span>
              <div className="check-sources">
                <small>
                  Computer: {check.ValueFromComputer ? 'ON' : 'OFF'} | 
                  TCG Log: {check.ValueFromTcgLog ? 'ON' : 'OFF'} | 
                  Verifiable: {check.TcgValueIsVerifiable ? 'YES' : 'NO'}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InformationalSecurityPanel;
