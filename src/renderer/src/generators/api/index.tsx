import React, { useEffect, useState } from 'react';
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

interface PageBuilderState {
	basePath: string;
	currentItem: { path: string; type: 'models' | 'controllers' | 'dto' } | null;
	folderFiles: {
		models?: any[];
		dto?: any[];
	};
}

type OptionType = 'models' | 'controllers' | 'dto' | 'none';

const PageBuilderApi = (): JSX.Element => {
	const [selectors, setSelectors] = useState<any[]>([]);
	const [currentData, setCurrentData] = useState<any>(null);
	const [option, setOption] = useState<OptionType>('none');

	const dispatch: any = useDispatch();
	const navigate = useNavigate();

	const selectState = (state: any): PageBuilderState => state.PageBuilder;

	const selectProperties = createSelector(selectState, (studio) => ({
		basePath: studio.basePath,
		currentItem: studio.currentItem,
		models: studio.folderFiles?.models,
		dto: studio.folderFiles?.dto,
	}));

	const { currentItem, basePath, models, dto } = useSelector(selectProperties);

	useEffect(() => {
		const getJsonData = async () => {
			if (!currentItem) return;

			try {
				const data = await window.api.getJsonContent(currentItem.path);
				setCurrentData(data);
				setOption(currentItem.type);
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
				const allSelectors = await window.api.fetchSelectors(basePath);
				setSelectors(allSelectors);
			} catch (error) {
				console.error('Failed to fetch selectors:', error);
			}
		};

		if (basePath) {
			getAllSelectors();
		}
	}, [basePath]);

	const handleCancel = () => {
		setOption('none');
		setCurrentData(null);
	};

	const handleOptionClick = (opt: OptionType) => {
		setOption(opt);
		setCurrentData(null);
	};

	return (
		<>
			{option === 'none' && (
				<>
					<SidebarTrigger className="ml-1" />
					<EmptyPage onClick={handleOptionClick} />
				</>
			)}
			{option === 'models' && (
				<ModelLayout
					onCancel={handleCancel}
					basePath={basePath}
					selectors={selectors}
					jsonData={currentData}
					models={models}
				/>
			)}
			{option === 'controllers' && (
				<ControllerLayout
					onCancel={handleCancel}
					basePath={basePath}
					selectors={selectors}
					jsonData={currentData}
				/>
			)}
			{option === 'dto' && (
				<DtoLayout
					onCancel={handleCancel}
					basePath={basePath}
					selectors={selectors}
					jsonData={currentData}
					dto={dto}
					models={models}
				/>
			)}
		</>
	);
};

export default PageBuilderApi;
