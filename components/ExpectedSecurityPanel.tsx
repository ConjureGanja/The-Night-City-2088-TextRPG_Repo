// Panel for expected security checks - should normally pass but not critical

import React from 'react';
import { ExpectedSecurityCheck, SecurityStatus } from '../types/SecurityAttestationTypes';

interface ExpectedSecurityPanelProps {
  checks: ExpectedSecurityCheck[];
  title: string;
  description: string;
}

const ExpectedSecurityPanel: React.FC<ExpectedSecurityPanelProps> = ({ 
  checks, 
  title, 
  description 
}) => {
  const calculatePanelStatus = (): SecurityStatus => {
    const allPassed = checks.every(check => check.Value === check.DesiredValue);
    return allPassed ? 'healthy' : 'warning';
  };

  const panelStatus = calculatePanelStatus();

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      'PcrsMatchTcgLog': 'Boot Integrity Verification'
    };
    return fieldNames[field] || field;
  };

  return (
    <div className={`security-panel expected-panel status-${panelStatus}`}>
      <div className="panel-header">
        <h2>{title}</h2>
        <div className={`status-badge ${panelStatus}`}>
          {panelStatus === 'healthy' ? '✓ Verified' : '⚠ Attention Needed'}
        </div>
      </div>
      
      <p className="panel-description">{description}</p>
      
      <div className="checks-list">
        {checks.map((check, index) => (
          <div 
            key={index} 
            className={`check-item ${check.Value === check.DesiredValue ? 'passed' : 'warning'}`}
          >
            <div className="check-icon">
              {check.Value === check.DesiredValue ? '✓' : '⚠'}
            </div>
            <div className="check-details">
              <span className="check-name">{getFieldDisplayName(check.Field)}</span>
              <span className="check-status">
                {check.Value === check.DesiredValue ? 'VERIFIED' : 'CHECK NEEDED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpectedSecurityPanel;
