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

    useEffect(() => {
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

    const handleClear = async (projectRecent: Project, index: number): Promise<void> => {
        try {
            await window.repo.project.delete(projectRecent, index);
            fetchProjects();
        } catch (err) {
            setError("Failed to fetch projects");
        } finally {
        }
    }

    return (
        <>
            {projects.data.length > 0 && (

                <div className="space-y-4">
                    <div className="mt-4 mb-3 pb-2">
                        <h3 className="text-lg font-semibold">{t('recent')}</h3>
                    </div>

                    {error && <p>{error}</p>}
                    {projects.data.map((p, index) => (
                        p?.config?.name && (
                            <div
                                key={p.path}
                                className="relative flex items-center mb-3 group"
                            >
                                {/* Button with Icon */}
                                <button
                                    className="relative flex-shrink-0 w-12 h-12 rounded-md bg-gray-500 bg-opacity-10 text-primary flex items-center justify-center cursor-pointer hover:bg-opacity-20 transition-colors duration-200"
                                    onClick={() => handleClick(p)}
                                >
                                    <img src={IconMap[p?.config.type]} alt="Project Icon" />

                                    {/* "X" Icon (Shown on Hover) */}
                                    <span
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent triggering the button click handler
                                            handleClear(p, index); // Your clear handler function
                                        }}
                                    >
                                        X
                                    </span>
                                </button>

                                {/* Project Name */}
                                <div className="flex-grow-1 ms-3 cursor-pointer" onClick={() => handleClick(p)}>
                                    <h5 className="text-base font-medium" style={{ maxWidth: '150px' }}>
                                        {p.config.name}
                                    </h5>
                                </div>
                            </div>
                        )
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
