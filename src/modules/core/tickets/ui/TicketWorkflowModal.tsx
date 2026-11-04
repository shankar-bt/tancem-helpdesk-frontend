import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    step: 1,
    title: 'Raise Ticket',
    actor: 'User / Requester',
    actorRole: 'Standard User',
    actorColor: '#2563eb',
    actorBg: '#eff6ff',
    icon: <PersonOutlineIcon sx={{ fontSize: 28, color: '#2563eb' }} />,
    statusBadge: 'Open',
    statusColor: 'info' as const,
    description:
      'User identifies an issue, selects category, office, and priority, and describes the problem. SLA countdown begins immediately.',
    keyAction: 'Ticket logged in queue with initial SLA target',
  },
  {
    step: 2,
    title: 'Admin Assignment',
    actor: 'Administrator',
    actorRole: 'Super Admin',
    actorColor: '#dc2626',
    actorBg: '#fef2f2',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 28, color: '#dc2626' }} />,
    statusBadge: 'Assigned / In Progress',
    statusColor: 'warning' as const,
    description:
      'Only Administrators can assign tickets to Support Agents. Once assigned, the ticket automatically moves to "In Progress" and first response time is captured.',
    keyAction: 'Admin selects qualified Support Agent',
  },
  {
    step: 3,
    title: 'Support Agent Resolution',
    actor: 'Assigned Agent',
    actorRole: 'Support Agent',
    actorColor: '#7c3aed',
    actorBg: '#f5f3ff',
    icon: <SupportAgentIcon sx={{ fontSize: 28, color: '#7c3aed' }} />,
    statusBadge: 'Resolved',
    statusColor: 'success' as const,
    description:
      'The assigned Support Agent accesses the ticket, communicates with the requester in private discussion, troubleshoots the issue, and inputs resolution notes.',
    keyAction: 'Agent resolves issue & records resolution notes',
  },
  {
    step: 4,
    title: 'Verification & Closure',
    actor: 'User & Admin',
    actorRole: 'Requester / Admin',
    actorColor: '#059669',
    actorBg: '#ecfdf5',
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 28, color: '#059669' }} />,
    statusBadge: 'Closed',
    statusColor: 'default' as const,
    description:
      'Requester verifies that the issue has been completely fixed. Ticket is marked as closed and final SLA compliance is permanently recorded.',
    keyAction: 'Final closure & SLA performance archived',
  },
];

const ROLES_PERMISSIONS = [
  {
    action: 'Raise New Tickets',
    user: '✓',
    manager: '✓',
    agent: '✓',
    admin: '✓',
  },
  {
    action: 'View All Tickets Queue',
    user: 'Own Only',
    manager: 'Dept / Office Only',
    agent: 'Assigned & Own',
    admin: '✓ Full Access',
  },
  {
    action: 'Assign Support Agent',
    user: '✗',
    manager: '✗',
    agent: '✗',
    admin: '✓ Admin Only',
  },
  {
    action: 'Resolve & Update Status',
    user: '✗',
    manager: '✗',
    agent: '✓ If Assigned',
    admin: '✓ All Tickets',
  },
  {
    action: 'Private Discussion Access',
    user: '✓ If Raised',
    manager: '✗ (Private)',
    agent: '✓ If Solver',
    admin: '✓ All Tickets',
  },
];

export default function TicketWorkflowModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AccountTreeOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Helpdesk Ticket Workflow Guide
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Step-by-step lifecycle from ticket creation to admin assignment, agent resolution, and closure.
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={4}>
          {/* Section 1: Visual 4-Step Lifecycle Flow */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={2} display="flex" alignItems="center" gap={1}>
              <AltRouteIconPlaceholder /> 1. End-to-End Resolution Lifecycle
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                gap: 2,
                position: 'relative',
              }}
            >
              {STEPS.map((step, idx) => (
                <Paper
                  key={step.step}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: '#ffffff',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: step.actorColor,
                      boxShadow: `0 4px 12px ${step.actorColor}15`,
                    },
                  }}
                >
                  {/* Step Number & Connector */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: step.actorBg,
                        color: step.actorColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {step.step}
                    </Box>
                    <Chip
                      label={step.statusBadge}
                      size="small"
                      color={step.statusColor}
                      sx={{ fontWeight: 600, fontSize: '0.68rem', height: 20 }}
                    />
                  </Box>

                  {/* Step Title & Icon */}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {step.icon}
                    <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                      {step.title}
                    </Typography>
                  </Box>

                  {/* Actor Pill */}
                  <Box mb={1.5}>
                    <Chip
                      label={step.actorRole}
                      size="small"
                      sx={{
                        bgcolor: step.actorBg,
                        color: step.actorColor,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        height: 22,
                        border: `1px solid ${step.actorColor}30`,
                      }}
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="#475569" sx={{ fontSize: '0.8125rem', lineHeight: 1.5, flex: 1, mb: 1.5 }}>
                    {step.description}
                  </Typography>

                  {/* Key Action footer */}
                  <Box
                    sx={{
                      p: 1.25,
                      bgcolor: '#f8fafc',
                      borderRadius: 1.5,
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} color="#334155" display="block">
                      ★ {step.keyAction}
                    </Typography>
                  </Box>

                  {/* Arrow for desktop */}
                  {idx < 3 && (
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'flex' },
                        position: 'absolute',
                        right: -13,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        bgcolor: '#ffffff',
                        borderRadius: '50%',
                        border: '1px solid #cbd5e1',
                        p: 0.25,
                        color: '#64748b',
                      }}
                    >
                      <ArrowForwardIcon sx={{ fontSize: 14 }} />
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Section 2: Discussion Privacy Architecture */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={1} display="flex" alignItems="center" gap={1}>
              <ForumOutlinedIcon sx={{ fontSize: 20, color: '#2563eb' }} /> 2. Discussion & Activity Privacy Architecture
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              To protect internal communications and sensitive details, the ticket discussion timeline is strictly private between three authorized parties:
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
              }}
            >
              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
                gap={2}
                mb={2}
              >
                <Box
                  p={2}
                  sx={{ bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #bbf7d0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <PersonOutlineIcon color="primary" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Ticket Requester
                    </Typography>
                  </Stack>
                  <Chip label="Can View & Reply" size="small" color="primary" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    The user who raised the ticket communicates directly with the assigned solver.
                  </Typography>
                </Box>

                <Box
                  p={2}
                  sx={{ bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #ddd6fe', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <SupportAgentIcon sx={{ color: '#7c3aed' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Assigned Support Agent
                    </Typography>
                  </Stack>
                  <Chip label="Assigned Solver" size="small" sx={{ bgcolor: '#ede9fe', color: '#5b21b6', height: 20, fontSize: '0.68rem', fontWeight: 600, mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Only the specific Support Agent assigned by Admin has access to troubleshoot and reply.
                  </Typography>
                </Box>

                <Box
                  p={2}
                  sx={{ bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #fecaca', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <AdminPanelSettingsIcon color="error" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Administrator
                    </Typography>
                  </Stack>
                  <Chip label="Full Oversight" size="small" color="error" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Super Admin monitors quality, reassigns if required, and participates when necessary.
                  </Typography>
                </Box>
              </Box>

              <Box
                p={1.5}
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: 1.5,
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <LockOutlinedIcon sx={{ color: '#64748b', fontSize: 22 }} />
                <Typography variant="caption" color="#475569">
                  <strong>Privacy Rule Enforced:</strong> Users from the same office, department managers, and unassigned support agents cannot view or post comments to this private discussion thread.
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Divider />

          {/* Section 3: Role Responsibility Matrix */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={1.5} display="flex" alignItems="center" gap={1}>
              <SecurityOutlinedIcon sx={{ fontSize: 20, color: '#2563eb' }} /> 3. Role Responsibilities & Permission Matrix
            </Typography>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: '#e2e8f0' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.8125rem',
                    '& th': { bgcolor: '#f8fafc', p: 1.5, fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0' },
                    '& td': { p: 1.5, borderBottom: '1px solid #f1f5f9', color: '#0f172a' },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Action / Capability</th>
                      <th style={{ textAlign: 'center' }}>Standard User</th>
                      <th style={{ textAlign: 'center' }}>Dept Manager</th>
                      <th style={{ textAlign: 'center' }}>Support Agent</th>
                      <th style={{ textAlign: 'center' }}>Administrator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROLES_PERMISSIONS.map((row) => (
                      <tr key={row.action}>
                        <td style={{ fontWeight: 600 }}>{row.action}</td>
                        <td style={{ textAlign: 'center' }}>
                          <PillBadge text={row.user} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <PillBadge text={row.manager} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <PillBadge text={row.agent} highlight />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <PillBadge text={row.admin} admin />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Got It, Close Guide
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AltRouteIconPlaceholder() {
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: 1,
        bgcolor: '#eff6ff',
        color: '#2563eb',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: 700,
      }}
    >
      ➔
    </Box>
  );
}

function PillBadge({ text, highlight, admin }: { text: string; highlight?: boolean; admin?: boolean }) {
  if (text.startsWith('✓')) {
    return (
      <Chip
        label={text}
        size="small"
        sx={{
          bgcolor: admin ? '#fee2e2' : highlight ? '#ede9fe' : '#dcfce7',
          color: admin ? '#991b1b' : highlight ? '#5b21b6' : '#166534',
          fontWeight: 700,
          fontSize: '0.72rem',
          height: 22,
        }}
      />
    );
  }
  if (text === '✗' || text.includes('✗')) {
    return (
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {text}
      </Typography>
    );
  }
  return (
    <Chip
      label={text}
      size="small"
      variant="outlined"
      sx={{
        borderColor: '#cbd5e1',
        color: '#475569',
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  );
}
