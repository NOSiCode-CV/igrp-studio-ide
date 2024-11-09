import { MoveLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next'

interface GoBackProps {
  hasTitle?: true | false;
  className?: string,
  handleBackClick?: () => void
}

const GoBack = ({ hasTitle, className, handleBackClick = (): void => { } }: GoBackProps): JSX.Element => {

  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center text-left cursor-pointer fs-4 ${className}`}
      onClick={handleBackClick}
    >
      <MoveLeft className="me-2" />
      <i className="ri-arrow-left-line me-2" />
      {hasTitle && t('goBack')}
    </div>

  )
}

export default GoBack
