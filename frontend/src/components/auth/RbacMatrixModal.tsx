import React from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';

export function RbacMatrixModal({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose?.()}
      title="Roles and permissions"
      description="Access to actions depends on the role assigned to each account."
      footer={<Button variant="secondary" size="sm" onClick={() => onClose?.()}>Close</Button>}
    >
      <p className="text-sm text-[#4B5869]">Role-based access controls limit which actions are available to each user.</p>
    </Modal>
  );
}