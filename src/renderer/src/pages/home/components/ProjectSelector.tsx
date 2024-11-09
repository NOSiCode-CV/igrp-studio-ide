import { setConfig, setBasePath, navigateToNextPage } from "@renderer/redux/thunks";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import useToast from "../../../components/useToast";
import { FolderOpen, PackagePlus } from "lucide-react";

interface ProjectSelectorProps {
    onHandleNewProjectClick?: () => void
}

const ProjectSelector = ({
    onHandleNewProjectClick = (): void => { }
}: ProjectSelectorProps): JSX.Element => {

    const { t } = useTranslation();

    const navigate = useNavigate();

    const dispatch: any = useDispatch();

    const { showErrorToast } = useToast();

    const handleOpenDirectory = async (): Promise<void> => {

        const result = await window.api.openDirectory("");

        if (result.canceled) {
            return; // User canceled the directory selection
        }

        if (!result.folderExists || !result.config?.type) {
            showErrorToast(t('notFoundProject'));
            return;
        }

        dispatch(setBasePath(result.basePath));
        dispatch(setConfig(result.config));

        await window.repo.project.save({ config: result.config, path: result.basePath });

        // Navigate to the next page
        navigateToNextPage(navigate, result.config)
    }

    return (
        <div className="space-y-4">
            <div className="mt-4 mb-3 pb-2">
                <h3 className="text-lg font-semibold">{t('start')}</h3>
            </div>
            <div className="flex items-center mb-3">
                <button
                    onClick={onHandleNewProjectClick}
                    className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-500 bg-opacity-10 text-primary flex items-center justify-center cursor-pointer hover:bg-opacity-20 transition-colors duration-200"
                >
                    <PackagePlus className="w-4 h-4" />
                </button>
                <div className="ml-3">
                    <h5 className="text-base font-medium">{t('newProject')}</h5>
                </div>
            </div>
            <div className="flex items-center mb-3">
                <button
                    onClick={handleOpenDirectory}
                    className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-500 bg-opacity-10 text-primary flex items-center justify-center cursor-pointer hover:bg-opacity-20 transition-colors duration-200"
                >
                    <FolderOpen className="w-4 h-4" />
                </button>
                <div className="ml-3">
                    <h5 className="text-base font-medium">{t('openProject')}</h5>
                </div>
            </div>
        </div>
    );
};

export default ProjectSelector;
