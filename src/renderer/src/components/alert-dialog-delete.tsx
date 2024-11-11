import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

interface DeleteModalProps {
  isOpen: boolean
  onConfirm?: () => void;
  onClose: () => void
  recordId?: string;
  hasTrigger: false
}

const AlertDialogDelete: React.FC<DeleteModalProps> = ({ isOpen, onConfirm, onClose, hasTrigger, recordId }) => {
  const { t } = useTranslation()
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      {hasTrigger && (
        <AlertDialogTrigger>
          <Button variant="outline" size="sm" className="outline outline-1 outline-red-500 text-red-500"> <Trash /> {t('delete')}</Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this record {recordId ? recordId : ""}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500">Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  )
};

export default AlertDialogDelete;
