import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  redirectTo?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  redirectTo
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  const handleClose = () => {
    setMode('login'); // Reset to login mode when closing
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {mode === 'login' ? (
          <LoginForm
            onSwitchToRegister={() => setMode('register')}
            onClose={handleClose}
            redirectTo={redirectTo}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setMode('login')}
            onClose={handleClose}
            redirectTo={redirectTo}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
