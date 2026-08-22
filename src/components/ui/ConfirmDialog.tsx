import { useState, type ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  commentLabel?: string;
  commentPlaceholder?: string;
  children?: ReactNode;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  commentLabel,
  commentPlaceholder,
  children,
}: ConfirmDialogProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(comment);
      setComment('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
      {children}
      {commentLabel && (
        <div className="mt-4">
          <Input
            label={commentLabel}
            placeholder={commentPlaceholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      )}
    </Modal>
  );
}
