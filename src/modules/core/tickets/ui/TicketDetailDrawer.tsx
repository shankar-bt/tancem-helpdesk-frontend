import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SendIcon from '@mui/icons-material/Send';
import StarIcon from '@mui/icons-material/Star';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
// DialogActions replaced by Drawer footer
// DialogContent replaced by Drawer body
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import { useUsers } from '@/modules/core/user/hooks/useUser';
import { LoadingBlock } from '@/shared/design-system';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate, formatDateTime } from '@/shared/utils/format';
import {
  isUserAdmin,
  isUserAgent,
  isUserManager,
  getUserRoleSlug,
  getRoleLabel,
} from '@/shared/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  useAddComment,
  useAssignTicket,
  useRateTicket,
  useTicket,
  useTicketComments,
  useUpdateTicketStatus,
} from '../hooks/useTickets';
import { ticketApi } from '../api/ticketApi';
import SlaBadge, { SlaProgressBar } from './SlaBadge';
import TicketAttachmentPreview from './TicketAttachmentPreview';
import type { TicketAttachment, TicketComment, TicketStatus } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
  onUpdated?: () => void;
}

const statusColors: Record<TicketStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  pending_approval: 'secondary',
  resolved: 'success',
  closed: 'default',
  reopened: 'error',
};

const CANNED_RESPONSES = [
  {
    title: '👋 Investigation in Progress',
    text: 'Hello, thank you for reaching out. We have received your request and our support team has initiated an investigation. We will update you with our progress shortly.',
  },
  {
    title: '🔍 Request More Information',
    text: 'Could you please provide additional details or a screenshot showing the exact error message? This will assist us in diagnosing and resolving the issue rapidly.',
  },
  {
    title: '🛠️ On-Site IT Visit Scheduled',
    text: 'An on-site IT technician has been scheduled to inspect and resolve your workstation/network setup. Please ensure the machine is accessible.',
  },
  {
    title: '📁 Mailbox Quota Cleanup Steps',
    text: 'To resolve mailbox quota limits:\n1. Empty your "Deleted Items" folder.\n2. Review and clean up the "Junk/Spam" folder.\n3. Archive previous months\' emails to local storage.',
  },
  {
    title: '🔑 Password / Credential Reset',
    text: 'Your credentials have been securely reset. Please log in using the temporary credentials sent to your registered department head and update your password immediately upon first login.',
  },
  {
    title: '✅ Issue Resolved - Verification',
    text: 'We have applied the fix for the reported issue. Please test on your end and confirm if everything is functioning as expected.',
  },
];

export default function TicketDetailDrawer({ open, onClose, ticketId, onUpdated }: Props) {
  const notify = useNotificationStore((s) => s.notify);
  const currentUser = useAuthStore((s) => s.user);

  const { data: ticket, isLoading, error } = useTicket(ticketId ?? undefined);
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(ticketId ?? undefined);
  const { data: roles = [] } = useRoles();
  const { data: usersData } = useUsers({ page: 1, limit: 100 });
  const allUsers = usersData?.items ?? [];

  const updateStatus = useUpdateTicketStatus(ticketId ?? '');
  const assignTicket = useAssignTicket(ticketId ?? '');
  const addComment = useAddComment(ticketId ?? '');
  const rateTicket = useRateTicket();

  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // CSAT Rating State
  const [csatScore, setCsatScore] = useState<number | null>(5);
  const [csatFeedback, setCsatFeedback] = useState('');

  // Canned reply menu state
  const [cannedMenuAnchor, setCannedMenuAnchor] = useState<null | HTMLElement>(null);

  // Dynamic role determination
  const isAdmin = isUserAdmin(currentUser, roles);
  const isAgent = currentUser?.role === 'agent' || isUserAgent(currentUser, roles);
  const supportAgents = allUsers.filter((u) => isUserAgent(u, roles));
  const isCurrentlyAssignedToMe = Boolean(ticket?.assignedToId && currentUser?.id === ticket.assignedToId);

  // Comment attachments state
  const [commentAttachments, setCommentAttachments] = useState<TicketAttachment[]>([]);
  const [isUploadingCommentFile, setIsUploadingCommentFile] = useState(false);

  // Sync assigned agent when ticket loads
  useEffect(() => {
    if (ticket) {
      setSelectedAgentId(ticket.assignedToId || '');
      setNewStatus(ticket.status);
      setResolutionNotes(ticket.resolutionNotes || '');
    }
  }, [ticket]);

  // Participation checks
  const isSolver = Boolean(ticket?.assignedToId && currentUser?.id === ticket.assignedToId);
  const isRequester = Boolean(
    ticket && (currentUser?.id === ticket.requesterId || currentUser?.id === ticket.createdById)
  );

  // Authorization checks
  const canAssign = isAdmin;
  const canUpdateStatus = isAdmin || isSolver;
  const canAccessDiscussion = isAdmin || isSolver || isRequester || (isAgent && !ticket?.assignedToId);

  const handleStatusChange = () => {
    if (!newStatus || !ticketId) return;
    updateStatus.mutate(
      { status: newStatus as TicketStatus, resolutionNotes: resolutionNotes || undefined },
      {
        onSuccess: () => {
          notify(`Status updated to ${newStatus.replace('_', ' ')}`);
          onUpdated?.();
        },
        onError: (err) => {
          notify(getErrorMessage(err), 'error');
        },
      },
    );
  };

  const handleAssignAgent = () => {
    if (!ticketId) return;
    assignTicket.mutate(
      { assignedToId: selectedAgentId ? selectedAgentId : null },
      {
        onSuccess: () => {
          notify(selectedAgentId ? 'Ticket assigned to Support Agent' : 'Ticket assignment removed');
          onUpdated?.();
        },
        onError: (err) => {
          notify(getErrorMessage(err), 'error');
        },
      },
    );
  };

  const handleClaimTicket = (claim: boolean) => {
    if (!ticketId || !currentUser) return;
    const targetAgentId = claim ? currentUser.id : null;
    assignTicket.mutate(
      { assignedToId: targetAgentId },
      {
        onSuccess: () => {
          notify(claim ? 'You have claimed this ticket! You are now the assigned solver.' : 'Ticket assignment removed');
          onUpdated?.();
        },
        onError: (err) => {
          notify(getErrorMessage(err), 'error');
        },
      },
    );
  };

  const handleCommentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (commentAttachments.length + files.length > 5) {
      notify('Max 5 attachments allowed per comment', 'error');
      return;
    }
    setIsUploadingCommentFile(true);
    try {
      const uploaded = await ticketApi.uploadAttachments(files);
      setCommentAttachments((prev) => [...prev, ...uploaded]);
      notify(`${uploaded.length} file(s) attached to comment`, 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setIsUploadingCommentFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveCommentAttachment = (idx: number) => {
    setCommentAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddComment = () => {
    if ((!commentText.trim() && commentAttachments.length === 0) || !ticketId) return;
    addComment.mutate(
      {
        comment: commentText.trim() || 'Attached files',
        attachments: commentAttachments.length > 0 ? commentAttachments : undefined,
      },
      {
        onSuccess: () => {
          notify('Comment added to discussion');
          setCommentText('');
          setCommentAttachments([]);
        },
        onError: (err) => {
          notify(getErrorMessage(err), 'error');
        },
      },
    );
  };

  const handleCsatSubmit = () => {
    if (!ticketId || !csatScore) return;
    rateTicket.mutate(
      { id: ticketId, rating: csatScore, feedback: csatFeedback.trim() || undefined },
      {
        onSuccess: () => {
          notify('Thank you for rating our support! Feedback saved.', 'success');
          onUpdated?.();
        },
        onError: (err) => {
          notify(getErrorMessage(err), 'error');
        },
      },
    );
  };

  const handleSelectCanned = (text: string) => {
    setCommentText((prev) => (prev ? `${prev}\n\n${text}` : text));
    setCannedMenuAnchor(null);
  };

  // Helper to resolve comment author details
  const getCommentAuthorInfo = (c: TicketComment) => {
    const author = c.author || c.user;
    const authorName =
      author?.name ||
      (c.userId === currentUser?.id ? currentUser?.name : undefined) ||
      (c.authorId === currentUser?.id ? currentUser?.name : undefined) ||
      'User';

    const roleSlug = getUserRoleSlug(author, roles);
    const roleName =
      author?.roleName ||
      roles.find((r) => r.id === author?.roleId)?.name ||
      getRoleLabel(author, roles);

    const commentUserId = c.userId || c.authorId || author?.id;
    const isCommentSolver = Boolean(ticket?.assignedToId && commentUserId === ticket.assignedToId);
    const isCommentRequester = Boolean(
      ticket && (commentUserId === ticket.requesterId || commentUserId === ticket.createdById)
    );
    const isCommentAdmin = isUserAdmin(author, roles);
    const isCommentAgent = isUserAgent(author, roles);
    const isCommentManager = isUserManager(author, roles);

    return {
      authorName,
      roleName,
      roleSlug,
      isCommentSolver,
      isCommentRequester,
      isCommentAdmin,
      isCommentAgent,
      isCommentManager,
    };
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      elevation={16}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 640, md: 740, lg: 820 },
          maxWidth: '100vw',
          bgcolor: '#ffffff',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      <Box
        sx={{
          py: 2,
          px: { xs: 2, sm: 3 },
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em' }}>
            TICKET DRAWER PREVIEW
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: '#64748b',
              bgcolor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 1.5,
              p: 0.5,
              '&:hover': { bgcolor: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        {ticket ? (
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box>
              {ticket.ticketNumber && (
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block' }}>
                  {ticket.ticketNumber}
                </Typography>
              )}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ticket.title}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={ticket.priority.toUpperCase()}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  borderColor:
                    ticket.priority === 'urgent'
                      ? 'error.main'
                      : ticket.priority === 'high'
                      ? 'warning.main'
                      : 'divider',
                  color:
                    ticket.priority === 'urgent'
                      ? 'error.main'
                      : ticket.priority === 'high'
                      ? 'warning.main'
                      : 'text.secondary',
                }}
              />
              <Chip
                label={ticket.status.replace('_', ' ').toUpperCase()}
                color={statusColors[ticket.status] || 'default'}
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.72rem' }}
              />
            </Stack>
          </Box>
        ) : (
          'Ticket Details'
        )}
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        {isLoading && <LoadingBlock />}
        {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}

        {ticket && (
          <Stack gap={3}>
            {/* Metadata Grid */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }}
              gap={2}
              p={2}
              sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#0f172a">
                  {ticket.category || 'General'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Office / Dept
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#0f172a">
                  {ticket.officeCategory || '—'} {ticket.department?.name ? `• ${ticket.department.name}` : ''}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Raised By
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#0f172a">
                  {ticket.requester?.name || ticket.ticketRaisedBy || 'Requester'}
                </Typography>
                {ticket.requester?.email && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {ticket.requester.email}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created Date
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#0f172a">
                  {formatDate(ticket.createdAt)}
                </Typography>
              </Box>
            </Box>

            {/* SLA Performance Card */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor:
                  ticket.slaBreached || ticket.slaStatus === 'breached'
                    ? 'rgba(239, 68, 68, 0.04)'
                    : ticket.slaStatus === 'at_risk'
                    ? 'rgba(245, 158, 11, 0.04)'
                    : 'rgba(16, 185, 129, 0.04)',
                borderColor:
                  ticket.slaBreached || ticket.slaStatus === 'breached'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : ticket.slaStatus === 'at_risk'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                gap={1.5}
                mb={1.5}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Service Level Agreement (SLA)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Target response & resolution times for priority: {ticket.priority}
                  </Typography>
                </Box>
                <SlaBadge ticket={ticket} size="medium" />
              </Stack>

              <SlaProgressBar ticket={ticket} />

              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
                gap={2}
                pt={1.5}
                mt={1.5}
                sx={{ borderTop: '1px dashed rgba(0,0,0,0.1)' }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Resolution Target Deadline
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {ticket.resolutionDueAt ? formatDateTime(ticket.resolutionDueAt) : 'Not assigned'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    First Response Target
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {ticket.firstResponseDueAt ? formatDateTime(ticket.firstResponseDueAt) : 'Not assigned'}
                  </Typography>
                  {ticket.firstRespondedAt && (
                    <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.25 }}>
                      ✓ Responded: {formatDateTime(ticket.firstRespondedAt)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Description */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5} color="text.secondary">
                Ticket Description
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#ffffff',
                  borderRadius: 1.5,
                  whiteSpace: 'pre-wrap',
                  borderColor: '#e2e8f0',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                }}
              >
                {ticket.description}
              </Paper>
            </Box>

            {/* Ticket Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={0.75} color="text.secondary" display="flex" alignItems="center" gap={0.75}>
                  <AttachFileIcon sx={{ fontSize: 18 }} />
                  Ticket Attachments ({ticket.attachments.length})
                </Typography>
                <TicketAttachmentPreview attachments={ticket.attachments} readOnly />
              </Box>
            )}

            {/* Resolution Notes display if already resolved */}
            {ticket.resolutionNotes && (
              <Alert
                icon={<CheckCircleOutlineIcon />}
                severity="success"
                sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Resolution Summary:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {ticket.resolutionNotes}
                </Typography>
                {ticket.resolvedAt && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                    Resolved at: {formatDate(ticket.resolvedAt)}
                  </Typography>
                )}
              </Alert>
            )}

            <Divider />

            {/* 1. Support Agent Assignment (ADMIN ONLY) */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Support Agent Assignment
                </Typography>
                {isAdmin ? (
                  <Chip label="Admin Control" size="small" color="primary" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                ) : (
                  <Chip label="Managed by Admin" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
                )}
              </Box>

              {canAssign ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    Only Administrators can assign tickets to Support Agents. The assigned agent will access and resolve the ticket.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                    <TextField
                      select
                      size="small"
                      label="Assign Support Agent"
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      sx={{ minWidth: 260, flex: 1, bgcolor: '#ffffff' }}
                    >
                      <MenuItem value="">
                        <em>— Unassigned —</em>
                      </MenuItem>
                      {supportAgents.map((agent) => (
                        <MenuItem key={agent.id} value={agent.id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <SupportAgentIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                            <span>{agent.name}</span>
                            <Typography variant="caption" color="text.secondary">
                              ({agent.email})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>

                    <Button
                      variant="contained"
                      onClick={handleAssignAgent}
                      disabled={assignTicket.isPending || selectedAgentId === (ticket.assignedToId || '')}
                      startIcon={<SupportAgentIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600, minWidth: 150 }}
                    >
                      {assignTicket.isPending ? 'Assigning…' : 'Save Assignment'}
                    </Button>

                    {!ticket.assignedToId && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleClaimTicket(true)}
                        disabled={assignTicket.isPending}
                        startIcon={<AssignmentIndIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        Claim for Myself
                      </Button>
                    )}
                  </Stack>

                  {ticket.assignedTo && (
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mt={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" color="text.secondary">
                          Currently Assigned To:
                        </Typography>
                        <Chip
                          icon={<SupportAgentIcon />}
                          label={ticket.assignedToId === currentUser?.id ? `${ticket.assignedTo.name} (You)` : `${ticket.assignedTo.name} (Support Agent)`}
                          size="small"
                          color="secondary"
                          sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem' }}
                        />
                      </Box>
                      {ticket.assignedToId === currentUser?.id && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={() => handleClaimTicket(false)}
                          disabled={assignTicket.isPending}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Release Assignment
                        </Button>
                      )}
                    </Box>
                  )}
                </Paper>
              ) : (
                <Box p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                    Assigned Support Agent:
                  </Typography>
                  {ticket.assignedTo ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          icon={<SupportAgentIcon />}
                          label={isCurrentlyAssignedToMe ? 'Assigned to You' : `${ticket.assignedTo.name} (Support Agent)`}
                          size="small"
                          color="secondary"
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          ({ticket.assignedTo.email})
                        </Typography>
                      </Stack>
                      {isCurrentlyAssignedToMe && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleClaimTicket(false)}
                          disabled={assignTicket.isPending}
                          sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                        >
                          {assignTicket.isPending ? 'Releasing…' : 'Release Ticket (Unassign)'}
                        </Button>
                      )}
                    </Stack>
                  ) : (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Not yet assigned to a Support Agent.
                      </Typography>
                      {(isAgent || isAdmin) && (
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          startIcon={<AssignmentIndIcon />}
                          onClick={() => handleClaimTicket(true)}
                          disabled={assignTicket.isPending}
                          sx={{ textTransform: 'none', fontWeight: 600, py: 0.75, px: 2 }}
                        >
                          {assignTicket.isPending ? 'Claiming…' : 'Claim Ticket (Assign to Me)'}
                        </Button>
                      )}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>

            <Divider />

            {/* 2. Ticket Status & Resolution (ASSIGNED SUPPORT AGENT OR ADMIN ONLY) */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Ticket Status & Resolution
                </Typography>
                {canUpdateStatus ? (
                  <Chip
                    label={isAdmin ? 'Admin / Solver' : 'Assigned Support Agent'}
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                  />
                ) : (
                  <Chip
                    label="Restricted"
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.68rem' }}
                  />
                )}
              </Box>

              {canUpdateStatus ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    As the assigned Support Agent or Administrator, update progress and record resolution notes when resolved.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems="flex-start">
                    <TextField
                      select
                      size="small"
                      label="Ticket Status"
                      value={newStatus || ticket.status}
                      onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                      sx={{ minWidth: 180, bgcolor: '#ffffff' }}
                    >
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="pending_approval">Pending Approval</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                      <MenuItem value="reopened">Reopened</MenuItem>
                    </TextField>

                    <TextField
                      size="small"
                      label="Resolution note"
                      placeholder="Add resolution explanation or progress notes…"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      fullWidth
                      sx={{ bgcolor: '#ffffff' }}
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleStatusChange}
                      disabled={
                        (!newStatus || (newStatus === ticket.status && resolutionNotes === (ticket.resolutionNotes || ''))) ||
                        updateStatus.isPending
                      }
                      sx={{ textTransform: 'none', fontWeight: 600, minWidth: 140, whiteSpace: 'nowrap' }}
                    >
                      {updateStatus.isPending ? 'Saving…' : 'Update Status'}
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Box p={1.5} sx={{ bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="body2" color="text.secondary">
                    Ticket status updates and resolution are managed by the assigned Support Agent (
                    {ticket.assignedTo ? ticket.assignedTo.name : 'Pending assignment'}
                    ) or Administrators.
                  </Typography>
                </Box>
              )}
            </Box>

            {/* CSAT Rating Section (Shown when ticket is resolved or closed) */}
            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <StarIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Customer Satisfaction (CSAT) Rating
                  </Typography>
                  {ticket.rating ? (
                    <Chip
                      label={`Rated ${ticket.rating} / 5`}
                      size="small"
                      sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, height: 20, fontSize: '0.68rem' }}
                    />
                  ) : (
                    <Chip
                      label="Pending Feedback"
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.68rem' }}
                    />
                  )}
                </Box>

                {ticket.rating ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#fffbeb',
                      borderColor: '#fde68a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                      <Rating value={ticket.rating} readOnly precision={0.5} sx={{ color: '#f59e0b' }} />
                      <Typography variant="body2" fontWeight={700} color="#92400e">
                        {ticket.rating} / 5 Stars
                      </Typography>
                      {ticket.ratedAt && (
                        <Typography variant="caption" color="text.secondary">
                          • Rated on {formatDate(ticket.ratedAt)}
                        </Typography>
                      )}
                    </Stack>
                    {ticket.ratingFeedback ? (
                      <Typography variant="body2" color="#78350f" sx={{ fontStyle: 'italic', pl: 0.5 }}>
                        "{ticket.ratingFeedback}"
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                        No written feedback provided.
                      </Typography>
                    )}
                  </Paper>
                ) : isRequester ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      borderLeft: '4px solid #f59e0b',
                    }}
                  >
                    <Typography variant="body2" fontWeight={700} color="#0f172a" mb={0.5}>
                      How satisfied are you with the resolution of this ticket?
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                      Your rating directly helps us measure service quality and improve support performance.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} mb={1.5}>
                      <Rating
                        value={csatScore}
                        onChange={(_e, val) => setCsatScore(val)}
                        size="large"
                        sx={{ color: '#f59e0b' }}
                      />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {csatScore === 5
                          ? '🌟 Excellent'
                          : csatScore === 4
                          ? '👍 Good'
                          : csatScore === 3
                          ? '👌 Average'
                          : csatScore === 2
                          ? '👎 Poor'
                          : '⚠️ Terrible'}
                      </Typography>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Optional feedback: Was your issue resolved quickly and satisfactorily?"
                        value={csatFeedback}
                        onChange={(e) => setCsatFeedback(e.target.value)}
                        sx={{ bgcolor: '#ffffff' }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleCsatSubmit}
                        disabled={rateTicket.isPending || !csatScore}
                        sx={{
                          bgcolor: '#f59e0b',
                          '&:hover': { bgcolor: '#d97706' },
                          textTransform: 'none',
                          fontWeight: 700,
                          minWidth: 140,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rateTicket.isPending ? 'Submitting…' : 'Submit Rating'}
                      </Button>
                    </Stack>
                  </Paper>
                ) : (
                  <Box p={1.5} sx={{ bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Ticket is resolved/closed. Awaiting customer satisfaction rating from requester ({ticket.requester?.name || 'Requester'}).
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Divider />

            {/* 3. Discussion & Activity (ONLY REQUESTER, ASSIGNED SOLVER, AND ADMIN) */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Discussion & Activity
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Communication between who raised the ticket, who solved the ticket, and the admin.
                  </Typography>
                </Box>
              </Box>

              {/* Discussion Participants Bar */}
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 2,
                  borderRadius: 1.5,
                  bgcolor: '#f1f5f9',
                  borderColor: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Typography variant="caption" fontWeight={700} color="#475569">
                  Participants:
                </Typography>
                <Chip
                  icon={<PersonOutlineIcon />}
                  label={`Raised by: ${ticket.requester?.name || ticket.ticketRaisedBy || 'Requester'}`}
                  size="small"
                  sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600, fontSize: '0.72rem' }}
                />
                <Chip
                  icon={<SupportAgentIcon />}
                  label={`Solver: ${ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned Agent'}`}
                  size="small"
                  sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 600, fontSize: '0.72rem' }}
                />
                <Chip
                  icon={<AdminPanelSettingsIcon />}
                  label="Administrator"
                  size="small"
                  sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.72rem' }}
                />
              </Paper>

              {!canAccessDiscussion ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    textAlign: 'center',
                  }}
                >
                  <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                    Discussion is Private
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, maxWidth: 500, mx: 'auto' }}>
                    This discussion is strictly restricted to the user who raised the ticket, the assigned support agent resolving it, and administrators.
                  </Typography>
                </Paper>
              ) : (
                <>
                  {commentsLoading ? (
                    <LoadingBlock />
                  ) : comments.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{ p: 2.5, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No discussion messages yet. Start a conversation below.
                      </Typography>
                    </Paper>
                  ) : (
                    <Stack gap={1.5} mb={2}>
                      {comments.map((c) => {
                        const {
                          authorName,
                          roleName,
                          isCommentSolver,
                          isCommentRequester,
                          isCommentAdmin,
                          isCommentAgent,
                          isCommentManager,
                        } = getCommentAuthorInfo(c);

                        const isSelf =
                          (c.userId && c.userId === currentUser?.id) ||
                          (c.authorId && c.authorId === currentUser?.id);

                        return (
                          <Paper
                            key={c.id}
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: isSelf ? '#f0fdf4' : '#ffffff',
                              borderColor: isSelf ? '#bbf7d0' : '#e2e8f0',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    bgcolor: isCommentAdmin
                                      ? '#dc2626'
                                      : isCommentSolver
                                      ? '#7c3aed'
                                      : '#2563eb',
                                  }}
                                >
                                  {authorName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                                  {authorName}
                                </Typography>

                                {/* User Type / Role Badge */}
                                <Chip
                                  label={roleName}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    bgcolor:
                                      isCommentAdmin
                                        ? '#fee2e2'
                                        : isCommentAgent
                                        ? '#ede9fe'
                                        : isCommentManager
                                        ? '#fef3c7'
                                        : '#f1f5f9',
                                    color:
                                      isCommentAdmin
                                        ? '#991b1b'
                                        : isCommentAgent
                                        ? '#5b21b6'
                                        : isCommentManager
                                        ? '#92400e'
                                        : '#475569',
                                  }}
                                />

                                {/* Involvement Badge */}
                                {isCommentSolver && (
                                  <Chip
                                    label="Assigned Solver"
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                                  />
                                )}
                                {isCommentRequester && (
                                  <Chip
                                    label="Raised Ticket"
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                                  />
                                )}
                              </Stack>

                              <Typography variant="caption" color="text.secondary">
                                {formatDate(c.createdAt)}
                              </Typography>
                            </Box>

                            <Typography
                              variant="body2"
                              sx={{
                                color: '#334155',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.55,
                                pl: 4.5,
                              }}
                            >
                              {c.comment}
                            </Typography>
                            {c.attachments && c.attachments.length > 0 && (
                              <Box sx={{ pl: 4.5, mt: 1 }}>
                                <TicketAttachmentPreview attachments={c.attachments} readOnly />
                              </Box>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}

                  {/* Quick Reply Templates (Support Agent & Admin) */}
                  {(isAgent || isAdmin) && (
                    <Box mb={1} display="flex" justifyContent="flex-start">
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<BoltIcon sx={{ color: '#4f46e5' }} />}
                        onClick={(e) => setCannedMenuAnchor(e.currentTarget)}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#4338ca',
                          bgcolor: '#eef2ff',
                          py: 0.5,
                          px: 1.5,
                          borderRadius: 1.5,
                          border: '1px solid #c7d2fe',
                          '&:hover': { bgcolor: '#e0e7ff', borderColor: '#a5b4fc' },
                        }}
                      >
                        Quick Reply Templates
                      </Button>
                      <Menu
                        anchorEl={cannedMenuAnchor}
                        open={Boolean(cannedMenuAnchor)}
                        onClose={() => setCannedMenuAnchor(null)}
                        slotProps={{
                          paper: {
                            sx: {
                              width: 340,
                              maxHeight: 360,
                              borderRadius: 2,
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                            },
                          },
                        }}
                      >
                        <Box sx={{ px: 2, py: 1 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">
                            INSERT QUICK REPLY TEMPLATE
                          </Typography>
                        </Box>
                        <Divider />
                        {CANNED_RESPONSES.map((cr, idx) => (
                          <MenuItem
                            key={idx}
                            onClick={() => handleSelectCanned(cr.text)}
                            sx={{ py: 1, px: 2, whiteSpace: 'normal', alignItems: 'flex-start' }}
                          >
                            <ListItemText
                              primary={cr.title}
                              secondary={cr.text.slice(0, 80) + '…'}
                              primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}
                              secondaryTypographyProps={{ fontSize: '0.74rem', color: '#64748b', mt: 0.25 }}
                            />
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>
                  )}

                  {/* Pending comment attachments preview */}
                  {commentAttachments.length > 0 && (
                    <Box mb={1}>
                      <TicketAttachmentPreview
                        attachments={commentAttachments}
                        onRemove={handleRemoveCommentAttachment}
                      />
                    </Box>
                  )}

                  <Stack direction="row" gap={1} alignItems="center">
                    <input
                      type="file"
                      id="comment-attachment-input"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      disabled={isUploadingCommentFile}
                      onChange={handleCommentFileSelect}
                      style={{ display: 'none' }}
                    />
                    <IconButton
                      component="label"
                      htmlFor="comment-attachment-input"
                      disabled={isUploadingCommentFile}
                      title="Attach file or screenshot"
                      sx={{
                        color: '#64748b',
                        bgcolor: '#f1f5f9',
                        p: 1,
                        '&:hover': { bgcolor: '#e2e8f0', color: '#1976d2' },
                      }}
                    >
                      {isUploadingCommentFile ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AttachFileIcon fontSize="small" />
                      )}
                    </IconButton>

                    <TextField
                      placeholder="Type a message or note for the discussion…"
                      size="small"
                      fullWidth
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      sx={{ bgcolor: '#ffffff' }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddComment}
                      disabled={(!commentText.trim() && commentAttachments.length === 0) || addComment.isPending || isUploadingCommentFile}
                      endIcon={<SendIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600, minWidth: 105, height: 40 }}
                    >
                      {addComment.isPending ? 'Sending…' : 'Send'}
                    </Button>
                  </Stack>
                </>
              )}
            </Box>
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          py: 1.75,
          px: { xs: 2, sm: 3 },
          bgcolor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {ticket?.ticketNumber ? `Viewing ${ticket.ticketNumber}` : 'Ticket Quick View'}
        </Typography>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#cbd5e1',
            color: '#334155',
            '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
          }}
        >
          Close Drawer
        </Button>
      </Box>
    </Drawer>
  );
}
