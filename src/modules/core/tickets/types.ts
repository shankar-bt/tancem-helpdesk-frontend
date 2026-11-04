import { z } from 'zod';
import type { Department } from '../departments/types';
import type { User } from '../user/types';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending_approval'
  | 'resolved'
  | 'closed'
  | 'reopened';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SlaStatus = 'within_sla' | 'at_risk' | 'breached' | 'met';

export interface TicketAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface TicketCommentAuthor extends User {
  roleName?: string | null;
  roleSlug?: string | null;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId?: string;
  authorId?: string;
  user?: TicketCommentAuthor | null;
  author?: TicketCommentAuthor | null;
  comment: string;
  isInternal: boolean;
  attachments?: TicketAttachment[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  supportCategory?: string | null;
  issueCategory?: string | null;
  officeCategory?: string | null;
  modeType?: string | null;
  issueType?: string | null;
  ticketRaisedBy?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  departmentId?: string | null;
  department?: Department | null;
  requesterId?: string;
  createdById?: string;
  requester?: User | null;
  createdBy?: User | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  resolutionNotes?: string | null;
  attachments?: TicketAttachment[];
  resolvedAt?: string | null;
  closedAt?: string | null;
  rating?: number | null;
  ratingFeedback?: string | null;
  ratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  firstResponseDueAt?: string | null;
  firstRespondedAt?: string | null;
  resolutionDueAt?: string | null;
  slaBreached?: boolean;
  slaBreachedAt?: string | null;
  slaStatus?: SlaStatus;
  slaRemainingMinutes?: number | null;
}

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  departmentId?: string;
  officeCategory?: string;
  search?: string;
  slaStatus?: 'all' | 'within_sla' | 'at_risk' | 'breached';
  assignedToId?: string;
  unassigned?: boolean | string;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

export interface CreateTicketPayload {
  title?: string;
  description: string;
  category?: string;
  supportCategory?: string;
  issueCategory?: string;
  officeCategory?: string;
  modeType?: string;
  issueType?: string;
  ticketRaisedBy?: string;
  priority: TicketPriority;
  departmentId?: string | null;
  attachments?: TicketAttachment[];
}

export interface UpdateTicketStatusPayload {
  status: TicketStatus;
  resolutionNotes?: string;
}

export interface AssignTicketPayload {
  assignedToId: string | null;
}

export interface AddCommentPayload {
  comment: string;
  isInternal?: boolean;
  attachments?: TicketAttachment[];
}

export const createTicketSchema = z.object({
  title: z.string().trim().max(255).optional(),
  description: z.string().trim().min(3, 'Detailed description is required'),
  category: z.string().trim().max(80).optional(),
  supportCategory: z.string().trim().optional(),
  issueCategory: z.string().trim().optional(),
  officeCategory: z.string().trim().optional(),
  modeType: z.string().trim().optional(),
  issueType: z.string().trim().optional(),
  ticketRaisedBy: z.string().trim().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  departmentId: z.string().optional().nullable(),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export interface TicketHistoryEvent {
  id: string;
  type: 'created' | 'assigned' | 'in_progress' | 'comment' | 'sla_breached' | 'resolved' | 'closed' | 'reopened';
  title: string;
  description: string;
  timestamp: string;
  status?: TicketStatus | null;
  actorName?: string | null;
  actorRole?: string | null;
  actorRoleSlug?: string | null;
  details?: Record<string, any>;
}
