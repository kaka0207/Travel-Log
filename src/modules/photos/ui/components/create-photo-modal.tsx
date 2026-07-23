"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import MultiStepForm from "./multi-step-form";
import { useModal } from "@/hooks/use-modal";

const CreatePhotoModal = () => {
  const { isOpen, onClose } = useModal();

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onClose}
      title="创建照片"
      className="sm:max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
      dismissible={false}
    >
      <MultiStepForm />
    </ResponsiveModal>
  );
};

export default CreatePhotoModal;
