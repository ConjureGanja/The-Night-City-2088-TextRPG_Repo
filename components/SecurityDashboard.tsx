// Main dashboard component that orchestrates the three security panels

import React from 'react';
import { SecurityAttestationData, SecurityStatus } from '../types/SecurityAttestationTypes';
import RequiredSecurityPanel from './RequiredSecurityPanel';
import ExpectedSecurityPanel from './ExpectedSecurityPanel';
import InformationalSecurityPanel from './InformationalSecurityPanel';
import './SecurityDashboard.css';

interface SecurityDashboardProps {
  attestationData: SecurityAttestationData;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ attestationData }) => {
  // Calculate overall status based on all checks
  const calculateOverallStatus = (): SecurityStatus => {
    const requiredPassed = attestationData.Required.every(check => check.Value === check.DesiredValue);
    const expectedPassed = attestationData.Expected.every(check => check.Value === check.DesiredValue);
    
    if (!requiredPassed) return 'critical';
    if (!expectedPassed) return 'warning';
    return 'healthy';
  };

  const overallStatus = calculateOverallStatus();

  return (
    <div className="security-dashboard">
      {/* Header with overall system status */}
      <div className={`dashboard-header status-${overallStatus}`}>
        <h1>System Security Attestation</h1>
        <div className="overall-status">
          <span className="status-indicator"></span>
          <span>Status: {attestationData.HealthStatus}</span>
        </div>
      </div>

      {/* Three main security panels */}
      <div className="security-panels-container">
        {/* Panel 1: Critical/Required Security Checks */}
        <RequiredSecurityPanel 
          checks={attestationData.Required}
          title="Critical Security Requirements"
          description="These are mandatory security features that must be present and functioning"
        />

        {/* Panel 2: Expected Security Checks */}
        <ExpectedSecurityPanel 
          checks={attestationData.Expected}
          title="Expected Security Features" 
          description="Features that should normally be enabled for optimal security"
        />

        {/* Panel 3: Informational Security Status */}
        <InformationalSecurityPanel 
          checks={attestationData.Informational}
          title="Advanced Security Information"
          description="Additional security features and compliance status"
        />
      </div>
    </div>
  );
};

export default SecurityDashboard;
