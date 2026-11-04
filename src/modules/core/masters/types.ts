export type MasterType =
  | 'support_category'
  | 'issue_category'
  | 'office_category'
  | 'mode_type'
  | 'issue_type';

export interface MasterTypeConfig {
  type: MasterType;
  label: string;
  description: string;
  parentType?: MasterType;
  parentLabel?: string;
}

export const MASTER_CONFIGS: MasterTypeConfig[] = [
  {
    type: 'support_category',
    label: 'Support Category',
    description: 'Categories for support departments & hardware/software domains',
  },
  {
    type: 'issue_category',
    label: 'Issue Category',
    description: 'Specific issue categories grouped under each Support Category',
    parentType: 'support_category',
    parentLabel: 'Support Category',
  },
  {
    type: 'issue_type',
    label: 'Issue Type',
    description: 'Granular issue types grouped under each Issue Category',
    parentType: 'issue_category',
    parentLabel: 'Issue Category',
  },
  {
    type: 'office_category',
    label: 'Office Category',
    description: 'Corporate offices, manufacturing plants, and regional locations',
  },
  {
    type: 'mode_type',
    label: 'Mode Type',
    description: 'Modes of communication (Portal, Telephone, Email, Walk-in)',
  },
];

export interface TicketMaster {
  id: string;
  type: MasterType;
  name: string;
  code?: string | null;
  description?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMasterPayload {
  type: MasterType;
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface UpdateMasterPayload {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
}
