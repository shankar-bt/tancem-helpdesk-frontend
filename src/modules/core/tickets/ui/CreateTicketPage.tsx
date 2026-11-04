import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/paths';
import { useMasters } from '@/modules/core/masters/hooks/useMasters';
import { getErrorMessage } from '@/shared/utils/errors';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ticketApi } from '../api/ticketApi';
import { useCreateTicket } from '../hooks/useTickets';
import type { TicketAttachment, TicketPriority } from '../types';
import TicketAttachmentPreview from './TicketAttachmentPreview';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.notify);

  // Load master categories
  const { data: supportCategories = [] } = useMasters('support_category');
  const { data: allIssueCategories = [] } = useMasters('issue_category');
  const { data: allIssueTypes = [] } = useMasters('issue_type');
  const { data: officeCategories = [] } = useMasters('office_category');
  const { data: modeTypes = [] } = useMasters('mode_type');

  // Form states
  const [supportCategory, setSupportCategory] = useState('');
  const [issueCategory, setIssueCategory] = useState('');
  const [officeCategory, setOfficeCategory] = useState(currentUser?.officeCategory || '');
  const [modeType, setModeType] = useState('');
  const [issueType, setIssueType] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (attachments.length + files.length > 5) {
      notify('You can upload a maximum of 5 files per ticket', 'error');
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await ticketApi.uploadAttachments(files);
      setAttachments((prev) => [...prev, ...uploaded]);
      notify(`${uploaded.length} file(s) attached successfully`, 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Selected parent objects to determine cascading filters
  const selectedSupportObj = useMemo(
    () => supportCategories.find((s) => s.name === supportCategory),
    [supportCategories, supportCategory],
  );

  // Filter issue categories based on selected support category strictly
  const availableIssueCategories = useMemo(() => {
    if (!supportCategory || !selectedSupportObj) return [];
    return allIssueCategories.filter(
      (cat) => cat.parentId === selectedSupportObj.id,
    );
  }, [supportCategory, selectedSupportObj, allIssueCategories]);

  // Selected issue category object
  const selectedIssueCatObj = useMemo(
    () => availableIssueCategories.find((ic) => ic.name === issueCategory),
    [availableIssueCategories, issueCategory],
  );

  // Filter issue types based on selected issue category strictly
  const availableIssueTypes = useMemo(() => {
    if (!issueCategory || !selectedIssueCatObj) return [];
    return allIssueTypes.filter(
      (it) => it.parentId === selectedIssueCatObj.id,
    );
  }, [issueCategory, selectedIssueCatObj, allIssueTypes]);

  // Handle upstream cascading changes
  const handleSupportCategoryChange = (val: string) => {
    setSupportCategory(val);
    setIssueCategory('');
    setIssueType('');
  };

  const handleIssueCategoryChange = (val: string) => {
    setIssueCategory(val);
    setIssueType('');
  };

  const createTicket = useCreateTicket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      notify('Please enter a detailed description', 'error');
      return;
    }

    const title =
      [supportCategory, issueCategory, issueType].filter(Boolean).join(' - ') ||
      description.trim().slice(0, 50);

    createTicket.mutate(
      {
        title,
        description: description.trim(),
        category: supportCategory || 'General',
        supportCategory: supportCategory || undefined,
        issueCategory: issueCategory || undefined,
        officeCategory: officeCategory || currentUser?.officeCategory || undefined,
        departmentId: currentUser?.departmentId || undefined,
        modeType: modeType || undefined,
        issueType: issueType || undefined,
        ticketRaisedBy: currentUser?.name || currentUser?.email || 'Employee',
        priority,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      {
        onSuccess: (ticket) => {
          notify(`Ticket #${ticket.ticketNumber || ticket.id} created successfully!`, 'success');
          navigate(paths.tickets);
        },
      },
    );
  };

  const handleCancel = () => {
    setSupportCategory('');
    setIssueCategory('');
    setOfficeCategory('');
    setModeType('');
    setIssueType('');
    setPriority('medium');
    setDescription('');
    setAttachments([]);
    navigate(paths.tickets);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box mb={3}>
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{ color: '#1976d2', mb: 0.5 }}
        >
          Raise a Ticket
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select support category to load related issue categories, and select issue category to choose the specific issue type.
        </Typography>
      </Box>

      {createTicket.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {getErrorMessage(createTicket.error)}
        </Alert>
      )}

      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          bgcolor: '#fff',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* 3-Column Layout Matching Image 1 */}
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                sm: '1fr',
                md: 'repeat(3, 1fr)',
              }}
              gap={3}
            >
              {/* 1. Support Category */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                  Support Category
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="medium"
                  value={supportCategory}
                  onChange={(e) => handleSupportCategoryChange(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <span style={{ color: '#94a3b8' }}>Select Support Category</span>
                  </MenuItem>
                  {supportCategories.map((item) => (
                    <MenuItem key={item.id} value={item.name}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* 2. Issue Category (Only shown when Support Category is selected) */}
              {Boolean(supportCategory) && (
                <Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                    Issue Category
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="medium"
                    value={issueCategory}
                    onChange={(e) => handleIssueCategoryChange(e.target.value)}
                    SelectProps={{ displayEmpty: true }}
                    helperText={
                      availableIssueCategories.length === 0
                        ? 'No issue categories configured under this Support Category'
                        : undefined
                    }
                  >
                    <MenuItem value="">
                      <span style={{ color: '#94a3b8' }}>Select Issue Category</span>
                    </MenuItem>
                    {availableIssueCategories.map((item) => (
                      <MenuItem key={item.id} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}

              {/* 3. Issue Type (Only shown when Issue Category is selected) */}
              {Boolean(supportCategory && issueCategory) && (
                <Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                    Issue Type
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="medium"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    SelectProps={{ displayEmpty: true }}
                    helperText={
                      availableIssueTypes.length === 0
                        ? 'No specific issue types under this category'
                        : undefined
                    }
                  >
                    <MenuItem value="">
                      <span style={{ color: '#94a3b8' }}>Select Issue Type</span>
                    </MenuItem>
                    {availableIssueTypes.map((item) => (
                      <MenuItem key={item.id} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}

              {/* 4. Office Category */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                  Office Category
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="medium"
                  value={officeCategory}
                  onChange={(e) => setOfficeCategory(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <span style={{ color: '#94a3b8' }}>Select Category</span>
                  </MenuItem>
                  {officeCategories.map((item) => (
                    <MenuItem key={item.id} value={item.name}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* 5. Mode Type */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                  Mode Type
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="medium"
                  value={modeType}
                  onChange={(e) => setModeType(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <span style={{ color: '#94a3b8' }}>Select Mode Type</span>
                  </MenuItem>
                  {modeTypes.map((item) => (
                    <MenuItem key={item.id} value={item.name}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* 6. Ticket Raised By */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                  Ticket Raised By
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  value={currentUser?.name ? `${currentUser.name} (${currentUser.email})` : currentUser?.email || ''}
                  disabled
                  sx={{ bgcolor: '#f8fafc' }}
                />
              </Box>

              {/* 10. Priority */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                  Priority
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="medium"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </TextField>
              </Box>

              {/* Row 5 - Spans all 3 columns */}
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Typography variant="caption" fontWeight={600} color="error" display="block" mb={0.75}>
                  * Detailed Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Please enter a detailed description of the issue or requirement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Box>

              {/* Attachments / Screenshots - Spans all 3 columns */}
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                  Attachments & Screenshots (Optional)
                </Typography>
                <Box
                  component="label"
                  sx={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 2,
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f8fafc',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#1976d2',
                      bgcolor: '#f0f7ff',
                    },
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                    disabled={isUploading}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {isUploading ? (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CircularProgress size={22} sx={{ color: '#1976d2' }} />
                      <Typography variant="body2" color="text.secondary">
                        Uploading attachments…
                      </Typography>
                    </Stack>
                  ) : (
                    <>
                      <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: '#1976d2', mb: 0.75 }} />
                      <Typography variant="body2" fontWeight={600} color="#0f172a">
                        Click to upload screenshots or files
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Supports PNG, JPG, PDF, Word, Excel documents (Max 5 files, up to 15MB each)
                      </Typography>
                    </>
                  )}
                </Box>

                <TicketAttachmentPreview
                  attachments={attachments}
                  onRemove={handleRemoveAttachment}
                />
              </Box>

              {/* Actions - Spans all 3 columns */}
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Stack direction="row" spacing={2} justifyContent="flex-start" mt={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={createTicket.isPending}
                    sx={{
                      bgcolor: '#1976d2',
                      px: 4,
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    {createTicket.isPending ? <CircularProgress size={24} color="inherit" /> : 'Submit Ticket'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    size="large"
                    onClick={handleCancel}
                    disabled={createTicket.isPending}
                    sx={{ px: 3, textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
