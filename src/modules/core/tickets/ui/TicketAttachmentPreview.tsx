import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { TicketAttachment } from '../types';

interface TicketAttachmentPreviewProps {
  attachments: TicketAttachment[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isImageFile(att: TicketAttachment): boolean {
  if (att.type?.startsWith('image/')) return true;
  const ext = att.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '');
}

export function isPdfFile(att: TicketAttachment): boolean {
  if (att.type === 'application/pdf') return true;
  return att.name.toLowerCase().endsWith('.pdf');
}

export default function TicketAttachmentPreview({
  attachments,
  onRemove,
  readOnly = false,
}: TicketAttachmentPreviewProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const getAttachmentUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    if (accessToken && !rawUrl.includes('token=')) {
      return `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}token=${accessToken}`;
    }
    return rawUrl;
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <>
      <Box display="flex" flexWrap="wrap" gap={1.5} sx={{ mt: 1 }}>
        {attachments.map((att, idx) => {
          const isImg = isImageFile(att);
          const isPdf = isPdfFile(att);
          const fileUrl = getAttachmentUrl(att.url);

          return (
            <Paper
              key={att.url || idx}
              variant="outlined"
              sx={{
                p: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                bgcolor: '#ffffff',
                borderColor: '#e2e8f0',
                transition: 'all 0.2s ease',
                maxWidth: 280,
                minWidth: 180,
                '&:hover': {
                  borderColor: '#94a3b8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                },
              }}
            >
              {/* Thumbnail / Icon */}
              {isImg ? (
                <Box
                  component="img"
                  src={fileUrl}
                  alt={att.name}
                  onClick={() => setPreviewImage(fileUrl)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    bgcolor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0,
                    transition: 'transform 0.15s ease',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: isPdf ? '#fef2f2' : '#f8fafc',
                    color: isPdf ? '#dc2626' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: isPdf ? '#fecaca' : '#e2e8f0',
                    flexShrink: 0,
                  }}
                >
                  {isPdf ? (
                    <PictureAsPdfOutlinedIcon fontSize="medium" />
                  ) : (
                    <InsertDriveFileOutlinedIcon fontSize="medium" />
                  )}
                </Box>
              )}

              {/* Info & Actions */}
              <Box minWidth={0} flex={1}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  fontSize="0.8rem"
                  noWrap
                  title={att.name}
                  sx={{ color: '#0f172a' }}
                >
                  {att.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatFileSize(att.size)}
                </Typography>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={0.25} alignItems="center">
                {isImg && (
                  <IconButton
                    size="small"
                    onClick={() => setPreviewImage(fileUrl)}
                    title="View Image"
                    sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#0284c7' } }}
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  component="a"
                  href={fileUrl}
                  target="_blank"
                  download={att.name}
                  title="Open / Download"
                  sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#0284c7' } }}
                >
                  <OpenInNewOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                {!readOnly && onRemove && (
                  <IconButton
                    size="small"
                    onClick={() => onRemove(idx)}
                    title="Remove File"
                    sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#ef4444' } }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      {/* Image Preview Modal */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: '#0f172a',
          },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, bgcolor: 'rgba(0,0,0,0.5)', color: '#ffffff' }}
        >
          <Typography variant="subtitle2" fontWeight={600} color="#ffffff">
            Attachment Preview
          </Typography>
          <IconButton
            size="small"
            onClick={() => setPreviewImage(null)}
            sx={{ color: '#ffffff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', bgcolor: '#0f172a' }}>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
