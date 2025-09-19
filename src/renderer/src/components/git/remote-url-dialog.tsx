import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useState } from "react";
import { Input } from "../ui/input";
import { IGRPButtonPrimitive } from "@igrp/igrp-framework-react-design-system";
import { useTranslation } from "react-i18next";

interface RemoteUrlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

export function RemoteUrlDialog({ isOpen, onClose, onConfirm }: RemoteUrlDialogProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");

  const handleConfirm = () => {
      onConfirm(url);
      setUrl("");
      onClose();
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{t('addRemoteRepository')}</DialogTitle>
                  <DialogDescription>
                      {t('enterRemoteRepositoryUrl')}
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Input
                      placeholder={t('remoteRepositoryUrlPlaceholder')}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full"
                  />
              </div>
              <DialogFooter>
                  <IGRPButtonPrimitive variant="outline" onClick={onClose}>
                      {t('cancel')}
                  </IGRPButtonPrimitive>
                  <IGRPButtonPrimitive onClick={handleConfirm} disabled={!url.trim()} variant={"default"}>
                      {t('addRemote')}
                  </IGRPButtonPrimitive>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );
}