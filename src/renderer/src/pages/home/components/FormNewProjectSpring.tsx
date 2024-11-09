import { useFormik } from 'formik';
import * as Yup from "yup";
import { useEffect, useState } from 'react';
import { ApiConfig } from '@igrp/spring-engine/dist/interfaces/types';
import { ENV_TYPES, PATTERNS } from '@renderer/utils/constants';
import { useDispatch } from 'react-redux';
import useToast from '../../../components/useToast';
import { setConfig, setBasePath, navigateToNextPage } from "@renderer/redux/thunks";
import { useTranslation } from 'react-i18next';
import { ConfigOptions } from 'src/main/types';
import { useNavigate } from 'react-router-dom';
import Illustration from '../../../components/Ilustration';
import Select from "react-select";
import GoBack from '@renderer/components/GoBack';
import { Card } from '@renderer/components/ui/card';

const DatabaseOptions = [
	{ value: 'Postgresql', label: 'PostgreSQL' },
	{ value: 'Oracle', label: 'Oracle' },
	{ value: 'MySQL', label: 'MySQL' }
];

interface FormProps {
	type: String;
	onBackButtonClick?: () => void;
	onSaveButtonClick?: (apiConfig: ApiConfig, filePath: string) => void;
}

const initialValues: ApiConfig = {
	type: ENV_TYPES.SPRING,
	apiName: "",
	group: "",
	description: "",
	artifact: "",
	database: "Postgresql"
};

const FormNewProjectSpring = ({
	onBackButtonClick = (): void => { }
}: FormProps): JSX.Element => {

	const navigate = useNavigate();
	const dispatch: any = useDispatch();
	const { showErrorToast } = useToast();
	const { t } = useTranslation();

	const [filePath, setFilePath] = useState<string>("");

	const validationSchema = Yup.object({
		apiName: Yup.string().required(t("thisFieldRequired", { name: "Name" }))
			.matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
			.max(20, t("maxLengthExceeded", { max: 20 })),
		group: Yup.string().required(t("fieldRequired", { name: "Group" })),
		artifact: Yup.string().required(t("fieldRequired", { name: "Artifact" })),
		database: Yup.object().shape({
			value: Yup.string().required(t("fieldRequired", { name: "Database selection" }))
		})
	});

	const validation: any = useFormik({
		enableReinitialize: true,
		initialValues,
		validationSchema,
		onSubmit: (_values, actions) => {
			actions.setSubmitting(false);
			setFilePath("");
			handleOpenDirectory();
		},
	});

	const handleOpenDirectory = async (): Promise<void> => {
		window.electron.ipcRenderer.send('open-directory-dialog');

		window.electron.ipcRenderer.on('file-content', (_e, result) => {
			if (!result.canceled) {
				setFilePath(result.filePaths[0]);
			}
		});
	};

	useEffect(() => {
		if (filePath) {
			createProject();
		}
	}, [filePath]);

	const createProject = async (): Promise<void> => {
		try {
			const formData = {
				...validation.values,
				database: validation.values.database ? validation.values.database['value'] : "",
			};

			const config: ConfigOptions = {
				type: formData.type,
				name: formData.name,
				group: formData.group,
				description: formData.description,
				artifact: formData.artifact,
				database: formData.database,
			};

			const { error } = await window.api.createApi(formData, filePath);

			if (error) {
				showErrorToast(error);
				return;
			}

			dispatch(setBasePath(filePath));
			dispatch(setConfig(config));
			navigateToNextPage(navigate, config);

		} catch (error) {
			showErrorToast(error);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center ">
				<GoBack handleBackClick={onBackButtonClick} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				<div className="md:col-span-1">
					<Card className='p-6'>
						<div className="mb-4">
							<h2 className="text-2xl font-bold">{t('newProject')}</h2>
							<p className="text-sm text-gray-500">{t('newProjectInformatin')}</p>
						</div>
						<form
							className="space-y-6"
							onSubmit={(e) => {
								e.preventDefault();
								validation.handleSubmit();
							}}
						>
							<div className="space-y-4">
								<div>
									<label htmlFor="apiName" className="block text-sm font-medium text-gray-700">{t('nameOfProject')}</label>
									<input
										type="text"
										id="apiName"
										placeholder="Name of the project"
										className={`w-full p-2 border rounded-md ${validation.touched.apiName && validation.errors.apiName ? 'border-red-500' : 'border-gray-300'}`}
										onChange={validation.handleChange}
										onBlur={validation.handleBlur}
										value={validation.values.apiName || ""}
									/>
									{validation.touched.apiName && validation.errors.apiName ? (
										<p className="text-sm text-red-500">{validation.errors.apiName}</p>
									) : null}
								</div>

								<div>
									<label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('description')}</label>
									<textarea
										id="description"
										rows={3}
										className="w-full p-2 border rounded-md"
										onChange={validation.handleChange}
										onBlur={validation.handleBlur}
										value={validation.values.description || ""}
									></textarea>
								</div>

								<div className="grid grid-cols-2 gap-5">
									<div>
										<label htmlFor="group" className="block text-sm font-medium text-gray-700">{t('group')}</label>
										<input
											type="text"
											id="group"
											placeholder="Group"
											className={`w-full p-2 border rounded-md ${validation.touched.group && validation.errors.group ? 'border-red-500' : 'border-gray-300'}`}
											onChange={validation.handleChange}
											onBlur={validation.handleBlur}
											value={validation.values.group || ""}
										/>
										{validation.touched.group && validation.errors.group ? (
											<p className="text-sm text-red-500">{validation.errors.group}</p>
										) : null}
									</div>

									<div>
										<label htmlFor="artifact" className="block text-sm font-medium text-gray-700">{t('artifact')}</label>
										<input
											type="text"
											id="artifact"
											placeholder="Artifact"
											className={`w-full p-2 border rounded-md ${validation.touched.artifact && validation.errors.artifact ? 'border-red-500' : 'border-gray-300'}`}
											onChange={validation.handleChange}
											onBlur={validation.handleBlur}
											value={validation.values.artifact || ""}
										/>
										{validation.touched.artifact && validation.errors.artifact ? (
											<p className="text-sm text-red-500">{validation.errors.artifact}</p>
										) : null}
									</div>
								</div>

								<div>
									<label htmlFor="database" className="block text-sm font-medium text-gray-700">{t('database')}</label>
									<Select
										id="database"
										options={DatabaseOptions}
										onChange={(option) => validation.setFieldValue('database', option)}
										onBlur={() => validation.setFieldTouched('database', true)}
										value={validation.values.database}
										className={`w-full ${validation.touched.database && validation.errors.database ? 'border-red-500' : 'border-gray-300'}`}
									/>
									{validation.touched.database && validation.errors.database?.value ? (
										<p className="text-sm text-red-500">{validation.errors.database.value}</p>
									) : null}
								</div>
							</div>

							<div className="flex justify-end gap-4">
								<button
									type="button"
									className="bg-gray-200 text-sm text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
									onClick={onBackButtonClick}
								>
									{t('cancel')}
								</button>
								<button
									type="submit"
									className="bg-green-500 text-sm text-white py-2 px-4 rounded-md hover:bg-green-600"
								>
									{t('save')}
								</button>
							</div>
						</form>
					</Card>
				</div>
				<div className="xl:w-1/2 md:w-full hidden sm:block">
					<Illustration name="Project" />
				</div>
			</div>
		</div>
	);
};

export default FormNewProjectSpring;
