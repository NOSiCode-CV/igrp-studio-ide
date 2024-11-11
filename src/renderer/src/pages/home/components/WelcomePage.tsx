import { useTranslation } from "react-i18next";
import RecentsProjects from './RecentsProjects';
import ProjectSelector from './ProjectSelector';
import Illustration from "@renderer/components/ilustration";

interface SelectProjectProps {
  onHandleNewProjectClick?: () => void
}

const WelcomePage = ({
  onHandleNewProjectClick = (): void => { }
}: SelectProjectProps): JSX.Element => {

  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap -mx-4">
      <div className="w-full md:w-1/3 px-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{t('selectProject')}</h2>
        </div>
        <div className="ml-5">
          <ProjectSelector onHandleNewProjectClick={onHandleNewProjectClick} />
          <RecentsProjects />
        </div>
      </div>
      <div className="w-full md:w-2/3 px-4 mt-5 hidden sm:block">
        <Illustration name="Welcome" />
      </div>
    </div>
  )
}

export default WelcomePage
