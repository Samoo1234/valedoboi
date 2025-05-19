import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  titleClassName?: string; // New prop for title styling
  headerClassName?: string; // New prop for header area styling
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  titleClassName, // Destructure new prop
  headerClassName, // Destructure new prop
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle clicking outside the modal
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
      <div 
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} m-4 bg-white rounded-lg shadow-xl transform transition-all`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 sm:p-6">
          {title && (
            <div className={`flex items-center justify-between mb-4 ${headerClassName || ''}`}> {/* Applied headerClassName */}
              <h3 className={titleClassName || "text-lg font-medium text-gray-900"}>{title}</h3> {/* Applied titleClassName, with fallback */}
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          )}
          
          <div className={title ? '' : 'pt-2'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;