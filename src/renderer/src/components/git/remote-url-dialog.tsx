import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPInputPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
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
      <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
          <IGRPDialogContentPrimitive>
              <IGRPDialogHeaderPrimitive>
                  <IGRPDialogTitlePrimitive>{t('addRemoteRepository')}</IGRPDialogTitlePrimitive>
                  <IGRPDialogDescriptionPrimitive>
                      {t('enterRemoteRepositoryUrl')}
                  </IGRPDialogDescriptionPrimitive>
              </IGRPDialogHeaderPrimitive>
              <div className="py-4">
                  <IGRPInputPrimitive
                      placeholder={t('remoteRepositoryUrlPlaceholder')}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full"
                  />
              </div>
              <IGRPDialogFooterPrimitive>
                  <IGRPButtonPrimitive variant="outline" onClick={onClose}>
                      {t('cancel')}
                  </IGRPButtonPrimitive>
                  <IGRPButtonPrimitive onClick={handleConfirm} disabled={!url.trim()} variant={"default"}>
                      {t('addRemote')}
                  </IGRPButtonPrimitive>
              </IGRPDialogFooterPrimitive>
          </IGRPDialogContentPrimitive>
      </IGRPDialogPrimitive>
  );
}