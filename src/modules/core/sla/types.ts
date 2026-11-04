import type { TicketPriority } from '../tickets/types';

export interface SlaPolicy {
  id: string;
  name: string;
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSlaPolicyPayload {
  name?: string;
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  isActive?: boolean;
}
