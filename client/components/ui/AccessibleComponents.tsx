'use client';

import { forwardRef, useId, useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// Composant Input accessible
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, description, error, required, className, ...props }, ref) => {
    const id = useId();
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-900"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="requis">
              *
            </span>
          )}
        </label>

        {description && (
          <p id={descriptionId} className="text-sm text-slate-600">
            {description}
          </p>
        )}

        <input
          ref={ref}
          id={id}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          className={cn(
            'w-full px-3 py-2 border rounded-lg transition-colors',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none',
            'min-h-[44px]', // Touch target minimum
            error
              ? 'border-red-500 bg-red-50'
              : 'border-slate-300 hover:border-slate-400',
            className
          )}
          {...props}
        />

        {error && (
          <div
            id={errorId}
            role="alert"
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Composant Alert accessible
const alertVariants = cva(
  'flex items-start gap-3 p-4 rounded-lg border',
  {
    variants: {
      variant: {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  variant,
  title,
  children,
  dismissible,
  onDismiss,
  className,
  ...props
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);

  const icons = {
    info: <Info className="w-5 h-5 flex-shrink-0" />,
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icons[variant || 'info']}
      <div className="flex-1">
        {title && (
          <h4 className="font-medium mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded hover:bg-black/5 focus:ring-2 focus:ring-current focus:outline-none"
          aria-label="Fermer l'alerte"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Composant Modal accessible avec focus trap
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AccessibleModal({ isOpen, onClose, title, description, children }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Sauvegarder l'élément focalisé
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focaliser le modal
      modalRef.current?.focus();

      // Trap focus
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }

        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      // Restaurer le focus
      previousFocusRef.current?.focus();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div
          ref={modalRef}
          className="inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-white shadow-xl rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
        >
          <h3 id={titleId} className="text-lg font-medium text-slate-900 mb-2">
            {title}
          </h3>

          {description && (
            <p id={descriptionId} className="text-sm text-slate-600 mb-4">
              {description}
            </p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

// Composant Skip Link pour navigation clavier
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      Aller au contenu principal
    </a>
  );
}

// Composant LiveRegion pour annonces dynamiques
interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export function LiveRegion({ message, priority = 'polite' }: LiveRegionProps) {
  return (
    <div
      className="sr-only"
      aria-live={priority}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

// Composant ProgressBar accessible
interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
}

export function AccessibleProgressBar({
  value,
  max = 100,
  label,
  showValue = true
}: ProgressBarProps) {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {showValue && (
          <span className="text-sm text-slate-600">
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label}: ${Math.round(percentage)}% complété`}
        />
      </div>
    </div>
  );
}

// Hook pour la gestion du focus
export function useFocusManagement() {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  const AnnouncementRegion = () => (
    <div
      ref={announcementRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  );

  return { announce, AnnouncementRegion };
}