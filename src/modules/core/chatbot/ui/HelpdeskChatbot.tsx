import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketDetailModal from '@/modules/core/tickets/ui/TicketDetailModal';
import { useAuthStore } from '@/stores/authStore';
import { chatbotApi } from '../api/chatbotApi';
import type { ChatMessageItem, ChatQuickAction } from '../types/chatbot.types';

const statusColorMap: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: '#dbeafe', text: '#1e40af', label: 'Open' },
  in_progress: { bg: '#fef3c7', text: '#b45309', label: 'In Progress' },
  pending_approval: { bg: '#f3e8ff', text: '#6b21a8', label: 'Pending' },
  resolved: { bg: '#dcfce7', text: '#15803d', label: 'Resolved' },
  closed: { bg: '#f1f5f9', text: '#475569', label: 'Closed' },
  reopened: { bg: '#fee2e2', text: '#b91c1c', label: 'Reopened' },
};

export default function HelpdeskChatbot() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [quickActions, setQuickActions] = useState<ChatQuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Ticket detail modal state triggered from chat cards
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, isLoading]);

  // Initial welcome greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleInitialGreeting();
    }
  }, [isOpen]);

  const handleInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const res = await chatbotApi.sendMessage('hello');
      const botMsg: ChatMessageItem = {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: res.reply,
        timestamp: new Date(),
        quickActions: res.quickActions,
      };
      setMessages([botMsg]);
      setQuickActions(res.quickActions || []);
    } catch (e) {
      setMessages([
        {
          id: 'msg-' + Date.now(),
          sender: 'bot',
          text: 'Hello! I am your TANCEM Helpdesk Assistant. How can I assist you with your support requests today?',
          timestamp: new Date(),
          quickActions: [
            { label: 'Check My Tickets', query: 'my tickets' },
            { label: 'How to Raise Ticket', query: 'how to raise ticket' },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setHasInteracted(true);
    const userMsg: ChatMessageItem = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await chatbotApi.sendMessage(text);
      const botMsg: ChatMessageItem = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: res.reply,
        timestamp: new Date(),
        tickets: res.tickets,
        quickActions: res.quickActions,
      };
      setMessages((prev) => [...prev, botMsg]);
      if (res.quickActions && res.quickActions.length > 0) {
        setQuickActions(res.quickActions);
      }
    } catch (err: any) {
      const errMsg: ChatMessageItem = {
        id: 'err-' + Date.now(),
        sender: 'bot',
        text: 'Sorry, I encountered an issue retrieving ticket information. Please try again or check the Tickets table.',
        timestamp: new Date(),
        quickActions: [{ label: 'Go to Tickets Page', query: '', link: '/tickets' }],
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: ChatQuickAction) => {
    if (action.link) {
      navigate(action.link);
      setIsOpen(false);
    } else if (action.query) {
      handleSendMessage(action.query);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setQuickActions([]);
    handleInitialGreeting();
  };

  // Render text with markdown-like bolding and bullet points
  const formatBotText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold replacer: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} style={{ fontWeight: 700, color: '#0f172a' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <Box key={i} sx={{ display: 'flex', gap: 0.5, my: 0.2, pl: 0.5 }}>
            <Typography variant="body2" component="span" sx={{ color: '#334155', fontSize: '0.8125rem', lineHeight: 1.45 }}>
              {formattedLine}
            </Typography>
          </Box>
        );
      }

      return (
        <Typography
          key={i}
          variant="body2"
          sx={{
            my: line.trim() ? 0.2 : 0.4,
            fontSize: '0.8125rem',
            lineHeight: 1.45,
            color: '#334155',
          }}
        >
          {formattedLine}
        </Typography>
      );
    });
  };

  const userRole = currentUser?.role || 'user';
  const roleBadgeLabel =
    userRole === 'admin'
      ? 'Admin Command'
      : userRole === 'agent'
        ? 'Agent Copilot'
        : userRole === 'manager'
          ? 'Manager Portal'
          : 'Employee Portal';

  return (
    <>
      {/* 1. Floating Launcher Button (Elevated above table pagination & scrollbar) */}
      {!isOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 72, sm: 80 },
            right: { xs: 16, sm: 24 },
            zIndex: 1200,
          }}
        >
          <Tooltip title="Ennadaa neee summaaa?" placement="left">
            <Badge
              color="success"
              variant="dot"
              overlap="circular"
              invisible={hasInteracted}
              sx={{
                '& .MuiBadge-badge': {
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 8px #10b981',
                },
              }}
            >
              <Fab
                color="primary"
                onClick={() => setIsOpen(true)}
                sx={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)',
                  boxShadow: '0 8px 20px -3px rgba(37,99,235,0.45), inset 0 1px 1px rgba(255,255,255,0.4)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'scale(1.08) translateY(-2px)',
                    boxShadow: '0 12px 24px -4px rgba(37,99,235,0.55)',
                  },
                }}
              >
                <SmartToyOutlinedIcon sx={{ fontSize: 24, color: '#ffffff' }} />
              </Fab>
            </Badge>
          </Tooltip>
        </Box>
      )}

      {/* 2. Compact Sleek Floating Chat Window */}
      {isOpen && (
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            bottom: { xs: 10, sm: 18 },
            right: { xs: 10, sm: 18 },
            width: isExpanded
              ? { xs: 'calc(100vw - 20px)', sm: 460 }
              : { xs: 'calc(100vw - 20px)', sm: 330, md: 340 },
            height: isExpanded
              ? 'min(580px, calc(100vh - 36px))'
              : 'min(450px, calc(100vh - 36px))',
            zIndex: 1300,
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow:
              '0 16px 36px -10px rgba(15, 23, 42, 0.25), 0 6px 14px -3px rgba(15, 23, 42, 0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
            transition: 'width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.25s ease',
            animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '@keyframes slideUp': {
              '0%': { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
              '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
            },
          }}
        >
          {/* Header Bar */}
          <Box
            sx={{
              px: 1.5,
              py: 1,
              background: 'linear-gradient(135deg, #091e3a 0%, #1e3a8a 55%, #2563eb 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#22c55e',
                    color: '#22c55e',
                    boxShadow: '0 0 6px #22c55e',
                    width: 8,
                    height: 8,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <SmartToyOutlinedIcon sx={{ fontSize: 16, color: '#ffffff' }} />
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2, color: '#ffffff', fontSize: '0.8125rem' }}>
                  TANCEM Helpdesk Bot
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" mt={0.1}>
                  <Chip
                    label={roleBadgeLabel}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(59, 130, 246, 0.3)',
                      color: '#bfdbfe',
                      border: '1px solid rgba(191, 219, 254, 0.35)',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.64rem', fontWeight: 500 }}>
                    • Online
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.2} alignItems="center">
              <Tooltip title="Reset conversation">
                <IconButton
                  size="small"
                  onClick={handleResetChat}
                  sx={{
                    p: 0.4,
                    color: 'rgba(255,255,255,0.85)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' },
                  }}
                >
                  <RestartAltIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title={isExpanded ? 'Compact View' : 'Expand View'}>
                <IconButton
                  size="small"
                  onClick={() => setIsExpanded(!isExpanded)}
                  sx={{
                    p: 0.4,
                    color: 'rgba(255,255,255,0.85)',
                    display: { xs: 'none', sm: 'inline-flex' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' },
                  }}
                >
                  {isExpanded ? <CloseFullscreenIcon sx={{ fontSize: 15 }} /> : <OpenInFullIcon sx={{ fontSize: 15 }} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={() => setIsOpen(false)}
                  sx={{
                    p: 0.4,
                    color: 'rgba(255,255,255,0.85)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Messages Scroll Area */}
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              overflowY: 'auto',
              bgcolor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              '&::-webkit-scrollbar': { width: 5 },
              '&::-webkit-scrollbar-track': { background: '#f8fafc' },
              '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 4 },
              '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
            }}
          >
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                {/* Bot Icon Avatar */}
                {msg.sender === 'bot' && (
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      bgcolor: '#2563eb',
                      boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  >
                    <SmartToyOutlinedIcon sx={{ fontSize: 15, color: '#ffffff' }} />
                  </Avatar>
                )}

                {/* Message Bubble Container */}
                <Box
                  sx={{
                    maxWidth: { xs: '88%', sm: '85%' },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Bubble */}
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius:
                        msg.sender === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      background:
                        msg.sender === 'user'
                          ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                          : '#ffffff',
                      color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                      border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                      boxShadow:
                        msg.sender === 'user'
                          ? '0 4px 12px -2px rgba(37,99,235,0.3)'
                          : '0 3px 12px -2px rgba(15,23,42,0.05), 0 1px 4px -1px rgba(15,23,42,0.03)',
                    }}
                  >
                    {msg.sender === 'user' ? (
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', lineHeight: 1.45, color: '#ffffff', fontWeight: 500 }}>
                        {msg.text}
                      </Typography>
                    ) : (
                      formatBotText(msg.text)
                    )}

                    {/* Attached Ticket Cards */}
                    {msg.tickets && msg.tickets.length > 0 && (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: isExpanded
                            ? { xs: '1fr', sm: 'repeat(2, 1fr)' }
                            : '1fr',
                          gap: 1,
                          mt: 1.25,
                        }}
                      >
                        {msg.tickets.map((t) => {
                          const statusBadge = statusColorMap[t.status] || {
                            bg: '#f1f5f9',
                            text: '#475569',
                            label: t.status,
                          };

                          return (
                            <Paper
                              key={t.id}
                              variant="outlined"
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                bgcolor: '#ffffff',
                                borderColor: '#e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                '&:hover': {
                                  bgcolor: '#f8fafc',
                                  borderColor: '#38bdf8',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 6px 14px -3px rgba(14, 165, 233, 0.16)',
                                },
                              }}
                              onClick={() => setActiveTicketId(t.id)}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <ConfirmationNumberOutlinedIcon sx={{ fontSize: 14, color: '#2563eb' }} />
                                  <Typography variant="caption" fontWeight={700} color="#1e40af" sx={{ fontSize: '0.72rem' }}>
                                    #{t.ticketNumber}
                                  </Typography>
                                </Stack>
                                <Chip
                                  label={statusBadge.label}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    bgcolor: statusBadge.bg,
                                    color: statusBadge.text,
                                  }}
                                />
                              </Stack>

                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color="#0f172a"
                                noWrap
                                sx={{ fontSize: '0.78rem', mb: 0.5 }}
                              >
                                {t.title || 'Support Request'}
                              </Typography>

                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  {t.category || 'General Support'}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="text"
                                  endIcon={<OpenInNewIcon sx={{ fontSize: 11 }} />}
                                  sx={{
                                    p: 0,
                                    minWidth: 0,
                                    fontSize: '0.7rem',
                                    textTransform: 'none',
                                    color: '#2563eb',
                                    fontWeight: 700,
                                  }}
                                >
                                  View
                                </Button>
                              </Stack>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.64rem', mt: 0.25, px: 0.5, fontWeight: 500 }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 26, height: 26, bgcolor: '#2563eb' }}>
                  <SmartToyOutlinedIcon sx={{ fontSize: 15, color: '#ffffff' }} />
                </Avatar>
                <Paper
                  variant="outlined"
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderRadius: '4px 14px 14px 14px',
                    bgcolor: '#ffffff',
                    borderColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  <CircularProgress size={12} thickness={5} sx={{ color: '#2563eb' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.74rem' }}>
                    Fetching live data…
                  </Typography>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Quick Action Suggestion Chips Bar */}
          {quickActions.length > 0 && (
            <Box
              sx={{
                px: 1.25,
                py: 0.75,
                bgcolor: '#ffffff',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                '&::-webkit-scrollbar': { height: 3 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 2 },
              }}
            >
              <Box display="flex" alignItems="center" gap={0.4} sx={{ color: '#6366f1', flexShrink: 0 }}>
                <SparklesIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.68rem', color: '#4f46e5' }}>
                  Suggested:
                </Typography>
              </Box>

              {quickActions.map((action, idx) => (
                <Chip
                  key={idx}
                  label={action.label}
                  size="small"
                  onClick={() => handleActionClick(action)}
                  clickable
                  sx={{
                    bgcolor: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    border: '1px solid #bfdbfe',
                    height: 22,
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '&:hover': {
                      bgcolor: '#dbeafe',
                      borderColor: '#93c5fd',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 6px rgba(37,99,235,0.15)',
                    },
                  }}
                />
              ))}
            </Box>
          )}

          <Divider />

          {/* Input Bar */}
          <Box sx={{ p: 1, px: 1.25, bgcolor: '#ffffff' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask about tickets, SLA, or #ticket-no..."
              value={inputMessage}
              inputRef={inputRef}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={!inputMessage.trim() || isLoading}
                        onClick={() => handleSendMessage()}
                        sx={{
                          bgcolor: inputMessage.trim() ? '#2563eb' : 'transparent',
                          color: inputMessage.trim() ? '#ffffff' : 'text.disabled',
                          '&:hover': { bgcolor: '#1d4ed8' },
                          transition: 'all 0.2s ease',
                          width: 28,
                          height: 28,
                        }}
                      >
                        <SendRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  bgcolor: '#f8fafc',
                  fontSize: '0.8125rem',
                  py: 0.25,
                  pr: 0.5,
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563eb',
                    borderWidth: '1.5px',
                  },
                },
              }}
            />
          </Box>
        </Paper>
      )}

      {/* Ticket Detail Modal triggered from Chatbot */}
      {activeTicketId && (
        <TicketDetailModal
          open={Boolean(activeTicketId)}
          ticketId={activeTicketId}
          onClose={() => setActiveTicketId(null)}
        />
      )}
    </>
  );
}
