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
import { Button } from "../ui/button";
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
                  <Button variant="outline" onClick={onClose}>
                      {t('cancel')}
                  </Button>
                  <Button onClick={handleConfirm} disabled={!url.trim()}>
                      {t('addRemote')}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );
}