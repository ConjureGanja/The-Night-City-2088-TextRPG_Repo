// Example usage of the SecurityDashboard component with sample data

import React from 'react';
import SecurityDashboard from './SecurityDashboard';
import { SecurityAttestationData } from '../types/SecurityAttestationTypes';

// Sample data based on your Windows Measured Boot log
const sampleAttestationData: SecurityAttestationData = {
  "Version": 1,
  "HealthStatus": "Attestable",
  "Required": [
    {
      "Field": "TpmPresent",
      "Value": true,
      "DesiredValue": true
    },
    {
      "Field": "TpmMeetsMinimumVersion",
      "Value": true,
      "DesiredValue": true
    },
    {
      "Field": "TpmIsResponsive",
      "Value": true,
      "DesiredValue": true
    },
    {
      "Field": "EkCertIsAvailable",
      "Value": true,
      "DesiredValue": true
    },
    {
      "Field": "TcgLogFound",
      "Value": true,
      "DesiredValue": true
    }
  ],
  "Expected": [
    {
      "Field": "PcrsMatchTcgLog",
      "Value": true,
      "DesiredValue": true
    }
  ],
  "Informational": [
    {
      "Field": "SecureBootEnabled",
      "ValueFromComputer": false,
      "ValueFromTcgLog": false,
      "DesiredValue": true,
      "TcgValueIsVerifiable": true
    },
    {
      "Field": "VirtualSecureMemory",
      "ValueFromComputer": false,
      "ValueFromTcgLog": false,
      "DesiredValue": true,
      "TcgValueIsVerifiable": true
    },
    {
      "Field": "SecureCorePCCompliant",
      "ValueFromComputer": false,
      "ValueFromTcgLog": false,
      "DesiredValue": true,
      "TcgValueIsVerifiable": true
    }
  ]
};

const SecurityDashboardExample: React.FC = () => {
  return (
    <div>
      <SecurityDashboard attestationData={sampleAttestationData} />
    </div>
  );
};

export default SecurityDashboardExample;
