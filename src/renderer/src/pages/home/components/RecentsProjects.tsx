import { setConfig, setBasePath, navigateToNextPage } from "@renderer/redux/thunks";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PageableProjects, Project } from "src/main/types";
import { ENV_TYPES } from '@renderer/constants/appConstants';
import NextIcon from '@renderer/assets/images/Next30x30.svg'
import SpringIcon from '@renderer/assets/images/Spring30x30.svg'

const IconMap = {
    [ENV_TYPES.NEXTJS]: NextIcon,
    [ENV_TYPES.SPRING]: SpringIcon,
};

const RecentsProjects = (): JSX.Element => {
    const [pagination] = useState({ page: 1, size: 5 });
    const [projects, setProjects] = useState<PageableProjects>({ data: [], total: 0 });
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const dispatch: any = useDispatch();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchProjects = async () => {
            setError(null);
            try {
                const res = await window.repo.project.findAllRecent(pagination);
                setProjects(res);
            } catch (err) {
                setError("Failed to fetch projects");
            } finally {
            }
        };

        fetchProjects();
    }, [pagination.page, pagination.size]);

    /*   const handleLoadMore = () => {
          setPagination((prev) => ({ ...prev, size: prev.size + 5 }));
      }; */

    const handleClick = async (p: Project): Promise<void> => {

        try {
            await window.repo.project.save(p);
        } catch (err) {
        }

        dispatch(setBasePath(p.path));

        dispatch(setConfig(p.config));

        navigateToNextPage(navigate, p.config)
    }

    /* const totalProjects = projects.total ?? 0;
    const requestedTotal = pagination.page * pagination.size; */

    return (
        <>
            {projects.data.length > 0 && (

                <div className="space-y-4">
                    <div className="mt-4 mb-3 pb-2">
                        <h3 className="text-lg font-semibold">{t('recent')}</h3>
                    </div>

                    {error && <p>{error}</p>}
                    {projects.data.map((p) => (
                        p?.config?.name &&
                        <div key={p.path} className="flex items-center mb-3" onClick={() => handleClick(p)}>

                            <button
                                className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-500 bg-opacity-10 text-primary flex items-center justify-center cursor-pointer hover:bg-opacity-20 transition-colors duration-200"
                            >
                                <img src={IconMap[p?.config.type]} />
                            </button>

                            <div className="flex-grow-1 ms-3">
                                <h5 className="text-base font-medium" style={{ maxWidth: '150px' }}>{p.config.name}</h5>
                            </div>
                        </div>
                    ))}
                    {/*  {totalProjects > 0 && requestedTotal < totalProjects && (
                        <button type="button" className="btn btn-link visually-hidden" onClick={handleLoadMore}>
                            {t('loadMore')}
                        </button>
                    )} */}
                </div>
            )}
        </>
    );
};

export default RecentsProjects;
