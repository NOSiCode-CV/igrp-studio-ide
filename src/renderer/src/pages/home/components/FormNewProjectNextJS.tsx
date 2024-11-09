import GoBack from '../../../components/GoBack'
import { useFormik } from 'formik';
import * as Yup from "yup";
import { useEffect, useState } from 'react';
import { ApiConfig } from '@igrp/spring-engine/dist/interfaces/types';
import { ENV_TYPES, PATTERNS } from '@renderer/utils/constants';
import { AppConfig } from '@igrp/nextjs-engine/dist/interfaces/types';
import { setConfig, setBasePath, navigateToNextPage } from "@renderer/redux/thunks";
import { useDispatch } from 'react-redux';
import useToast from '../../../components/useToast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Illustration from '../../../components/Ilustration';
import { ConfigOptions } from 'src/main/types';
import { Card } from '@renderer/components/ui/card';

interface FormProps {
	type: String,
	onBackButtonClick?: () => void;
	onSaveButtonClick?: (apiConfig: ApiConfig, filePath: string) => void;
}

const initialValues: AppConfig = {
	type: ENV_TYPES.NEXTJS,
	appName: ""
};

const FormNewProjectNextJS = ({
	onBackButtonClick = (): void => { }
}: FormProps): JSX.Element => {

	const navigate = useNavigate();
	const dispatch: any = useDispatch();
	const { showErrorToast } = useToast();
	const { t } = useTranslation();

	const [filePath, setFilePath] = useState<string>("");

	const validationSchema = Yup.object({
		appName: Yup.string().required(t("thisFieldRequired", { name: "Name" }))
			.matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
			.max(20, t("maxLengthExceeded", { max: 20 }))
	});

	const validation: any = useFormik({
		enableReinitialize: true,
		initialValues,
		validationSchema,
		onSubmit: (_values, actions) => {
			actions.setSubmitting(false);
			setFilePath("")
			handleOpenDirectory();
		},
	});

	const handleOpenDirectory = async (): Promise<void> => {
		window.electron.ipcRenderer.send('open-directory-dialog')

		window.electron.ipcRenderer.on('file-content', (_e, result) => {
			if (!result.canceled) {
				setFilePath(result.filePaths[0]);
			}
		})
	}

	useEffect(() => {
		if (filePath) {
			createProject()
		}
	}, [filePath]);

	const createProject = async (): Promise<void> => {
		try {
			const { error } = await window.api.createAppNext(validation.values, filePath);

			if (error) {
				showErrorToast(error);
				return;
			}

			const config: ConfigOptions = { type: validation.values.type, name: validation.values.appName }

			dispatch(setBasePath(filePath));
			dispatch(setConfig(config));
			navigateToNextPage(navigate, config)

		} catch (error) {
			showErrorToast(error)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center">
				<GoBack handleBackClick={onBackButtonClick} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				{/* Form Section */}
				<div className="md:col-span-1">
					<Card className='p-6'>
						<div className="mb-4">
							<h2 className="text-2xl font-semibold mb-2">{t('newProject')}</h2>
							<p className="text-lg">{t('newProjectInformatin')}</p>
						</div>
						<form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
							<div className="space-y-4">
								{/* App Name */}
								<div>
									<label htmlFor="appName" className="block text-sm font-medium">{t('nameOfProject')}</label>
									<input
										type="text"
										id="appName"
										className={`mt-1 block w-full px-3 py-2 border ${validation.touched.appName && validation.errors.appName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
										placeholder="Name of the project"
										onChange={validation.handleChange}
										onBlur={validation.handleBlur}
										value={validation.values.appName || ""}
									/>
									{validation.touched.appName && validation.errors.appName && (
										<p className="text-sm text-red-500">{validation.errors.appName}</p>
									)}
								</div>
							</div>

							{/* Buttons */}
							<div className="mt-4 flex justify-end gap-4">
								<button
									type="button"
									className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
									onClick={onBackButtonClick}>
									{t('cancel')}
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-green-500 text-white rounded-md">
									{t('save')}
								</button>
							</div>
						</form>
					</Card>
				</div>

				{/* Illustration Section */}
				<div className="hidden sm:block md:col-span-1">
					<Illustration name="Project" />
				</div>
			</div>
		</div>
	)
}

export default FormNewProjectNextJS;
