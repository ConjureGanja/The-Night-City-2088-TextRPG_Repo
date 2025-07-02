// Type definitions for the security attestation data structure

export interface RequiredSecurityCheck {
  Field: string;
  Value: boolean;
  DesiredValue: boolean;
}

export interface ExpectedSecurityCheck {
  Field: string;
  Value: boolean;
  DesiredValue: boolean;
}

export interface InformationalSecurityCheck {
  Field: string;
  ValueFromComputer: boolean;
  ValueFromTcgLog: boolean;
  DesiredValue: boolean;
  TcgValueIsVerifiable: boolean;
}

export interface SecurityAttestationData {
  Version: number;
  HealthStatus: string;
  Required: RequiredSecurityCheck[];
  Expected: ExpectedSecurityCheck[];
  Informational: InformationalSecurityCheck[];
}

// Status types for UI components
export type SecurityStatus = 'healthy' | 'warning' | 'critical' | 'informational';

export interface SecurityPanelProps {
  title: string;
  status: SecurityStatus;
  checks: (RequiredSecurityCheck | ExpectedSecurityCheck | InformationalSecurityCheck)[];
  description: string;
}
