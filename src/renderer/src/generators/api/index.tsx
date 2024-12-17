import { useEffect, useState } from 'react';
import ModelLayout from './components/model';
import DtoLayout from './components/dto';
import ControllerLayout from './components/controller';
import EmptyPage from './EmptyPage';
import { createSelector } from 'reselect';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentItem } from '@renderer/redux/thunks';
import { ROUTES } from '@renderer/routes/routeConstants';
import { SidebarTrigger } from '@renderer/components/ui/sidebar';
import { extractByType, getMergedFiles } from './helpers';
import { OPTION_TYPE, OptionType } from '@renderer/constants/appConstants';

interface PageBuilderState {
	basePath: string;
	currentItem: { path: string; module: string, type: OptionType } | null;
	folderFiles: {
		models?: any[];
		dto?: any[];
	};
}

const PageBuilderApi = (): JSX.Element => {
	const [selectors, setSelectors] = useState<any[]>([]);
	const [currentData, setCurrentData] = useState<any>(null);
	const [option, setOption] = useState<OptionType>('none');
	const [module, setModule] = useState<string>("shared")

	const dispatch: any = useDispatch();
	const navigate = useNavigate();

	const selectState = (state: any): PageBuilderState => state.PageBuilder;

	const selectProperties = createSelector(
		selectState,
		(studio) => {

			const moduleData = getMergedFiles(studio, module);

			return {
				basePath: studio.basePath,
				currentItem: studio.currentItem,
				models: extractByType(moduleData, OPTION_TYPE.MODELS),
				dto: extractByType(moduleData, OPTION_TYPE.DATA_OBJECTS),
				controllers: extractByType(moduleData, OPTION_TYPE.CONTROLLERS),
			};
		}
	);

	const { currentItem, basePath, models, dto } = useSelector(selectProperties);

	useEffect(() => {
		const getJsonData = async () => {
			if (!currentItem) return;

			try {
				const data = await window.api.getJsonContent(currentItem.path);
				setCurrentData(data);
				setOption(currentItem.type);
				setModule(currentItem.module)
				dispatch(setCurrentItem(null));
			} catch (error) {
				console.error('Failed to load JSON content:', error);
			}
		};

		getJsonData();
	}, [currentItem, dispatch]);

	useEffect(() => {
		if (!basePath) {
			navigate(ROUTES.HOME);
		}
	}, [basePath, navigate]);

	useEffect(() => {
		const getAllSelectors = async () => {
			try {
				const allSelectors = await window.api.fetchSelectors(module, basePath);
				setSelectors(allSelectors);
			} catch (error) {
				console.error('Failed to fetch selectors:', error);
			}
		};

		if (basePath) {
			getAllSelectors();
		}
	}, [basePath, module]);

	const handleCancel = () => {
		setOption('none');
		setCurrentData(null);
	};

	const handleOptionClick = (opt: OptionType) => {
		setOption(opt);
		setModule("shared")
		setCurrentData(null);
	};

	return (
		<>
			{option === 'none' && (
				<>
					<SidebarTrigger className="ml-4 mt-4" />
					<EmptyPage onClick={handleOptionClick} />
				</>
			)}
			{option === OPTION_TYPE.MODELS && (
				<ModelLayout
					onCancel={handleCancel}
					basePath={basePath}
					selectors={selectors}
					jsonData={currentData}
					models={models}
					module={module}
				/>
			)}
			{option === OPTION_TYPE.CONTROLLERS && (
				<ControllerLayout
					onCancel={handleCancel}
					basePath={basePath}
					selectors={selectors}
					jsonData={currentData}
					module={module}
				/>
			)}
			{option === OPTION_TYPE.DATA_OBJECTS && (
				<DtoLayout
					onCancel={handleCancel}
					basePath={basePath}
					selectors={selectors}
					jsonData={currentData}
					dto={dto}
					models={models}
					module={module}
				/>
			)}
		</>
	);
};

export default PageBuilderApi;
