import React, { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { IColumnsTabelProps } from '../Interfaces'
import { FormList } from '../form-list'
import { getTablesColumns, TabList, defaultValues, initialValues } from './config'

import { useDispatch } from 'react-redux'
import { setChangeStatus as onSetChangeStatus } from "@renderer/redux/thunks"
import useToast from '@renderer/components/useToast'
import { useControllerValidation } from './validation'
import { useTranslation } from 'react-i18next'
import { ControllerAction, ControllerConfig } from '@igrp/spring-engine/dist/interfaces/types'
import { Card } from '@renderer/components/ui/card'
import { TextInput } from '../inputs-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@renderer/components/ui/accordion'
import { ShieldAlert } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import NavigationBar from '../navigation-bar'

interface ControllerProps {
	jsonData?: any
	basePath: string
	selectors: Array<any>
	onCancel: () => void
}

const ControllerLayout = ({ jsonData, onCancel, basePath, selectors }: ControllerProps): JSX.Element => {

	const { t } = useTranslation()

	const dispatch: any = useDispatch()

	const [openAccordion, setOpenAccordion] = useState('ACTION-0')

	const [tablesColumns, setTableColumns] = useState<{ [value: string]: IColumnsTabelProps[] }>({})

	const { showErrorToast, showSuccessToast } = useToast()

	const validationSchema = useControllerValidation({ t })

	const formik: any = useFormik({
		enableReinitialize: true,
		initialValues,
		validationSchema,
		onSubmit: (_values, actions) => {
			actions.setSubmitting(false)
			handleSave()
		}
	})

	useEffect(() => {
		const res = getTablesColumns(selectors)
		setTableColumns(res)
	}, [selectors])

	useEffect(() => {
		if (jsonData) {
			const { actions, name, basePath } = jsonData
			const newActions = actions.map(({ actionName, path, method, accepts, requestBody, response, pathVariables, requestParams }) => ({
				general: [{ actionName, path, method, accepts, requestBody, response }],
				pathVariables: pathVariables || [defaultValues.pathVariables],
				requestParams: requestParams || [defaultValues.requestParams],
			}))

			formik.setFieldValue('name', name)
			formik.setFieldValue('basePath', basePath)
			formik.setFieldValue('actions', newActions)
		} else
			formik.resetForm()
	}, [jsonData])

	const getValuesToSubmit = () => {
		const values = { ...formik.values };

		const transformedActions = values.actions.map(action => {

			const generalData = action.general[0] || {};

			// Filter out invalid pathVariables
			const validPathVariables = action.pathVariables && action.pathVariables.filter(
				item => item.type && item.name
			);

			// Filter out invalid requestParams
			const validRequestParams = action.requestParams && action.requestParams.filter(
				item => item.type && item.name
			);

			return {
				...generalData,
				...action,
				pathVariables: validPathVariables,
				requestParams: validRequestParams
			};
		});

		const actions: ControllerAction[] = transformedActions.map(({ general, ...rest }) => rest);

		const newValues: ControllerConfig = {
			...values,
			actions
		}

		return newValues

	}

	const toggleBordered = (id: any) => {
		if (openAccordion !== id) {
			setOpenAccordion(id);
		}
	};


	const handleAddAction = () => {
		formik.setFieldValue('actions', [
			...formik.values.actions,
			{ general: [defaultValues.general], pathVariables: [defaultValues.pathVariables], requestParams: [defaultValues.requestParams] }
		])

		setOpenAccordion(`ACTION-${formik.values.actions.length}`)
	}

	const handleDeleteAction = (position: number) => {
		formik.setFieldValue(
			'actions',
			formik.values.actions?.filter((_, index) => index !== position)
		)
	}

	const getErrorsLength = (values: string[], position: number) => {
		return values.reduce((count, value) => {
			const errors = formik.errors?.actions?.[position]?.[value];
			if (Array.isArray(errors)) {
				// Only count if errors is an array
				return count + errors.reduce((sum, d) => sum + (d ? Object.keys(d).length : 0), 0);
			}
			return count;
		}, 0);
	};


	const addNewRow = (actionIndex: number, field: string) => {
		formik.setFieldValue(
			'actions',
			formik.values.actions.map((action: any, index: number) =>
				actionIndex === index
					? { ...action, [field]: [...action?.[field], defaultValues[field]] }
					: action
			)
		)
	}

	const removeRow = (field: string, actionIndex: number, position: number) => {
		formik.setFieldValue(
			'actions',
			formik.values.actions.map((action: any, index: number) =>
				actionIndex === index
					? { ...action, [field]: action?.[field]?.filter((_, i: number) => position !== i) }
					: action
			)
		)
	}

	const changeValue = (
		element: string,
		actionPosition: number,
		position: number,
		value: any,
		name: string
	) => {
		formik.setFieldValue(
			'actions',
			formik.values.actions.map((action: any, index: number) =>
				index === actionPosition
					? {
						...action,
						[name]: action?.[name]?.map((row: any, i: number) =>
							position === i ? { ...row, [element]: value } : row
						)
					}
					: action
			)
		)
	}

	const handleSave = async (): Promise<void> => {
		try {
			const values = getValuesToSubmit()
			const { error } = await window.api.createController(values, basePath)

			if (error) {
				showErrorToast(error)
				return
			}

			dispatch(onSetChangeStatus(true))
			showSuccessToast(`Controller ${values.name} has been successfully added.`)
		} catch (error: unknown) {
			showErrorToast(error)
		}
	}

	const handleDelete = async (): Promise<void> => {
		try {
			const values = getValuesToSubmit()

			const { error } = await window.api.deleteController(values, basePath);

			if (error) {
				showErrorToast(error);
				return;
			}

			dispatch(onSetChangeStatus(true));
			onCancel()

			showSuccessToast('Controller deleted successfully!')

		} catch (error) {
			showErrorToast(error);
		}
	}

	const handleCancel = () => {
		onCancel();
		formik.resetForm();
	}

	return (
		<React.Fragment>
			<NavigationBar
				onDelete={handleDelete}
				onCancel={handleCancel}
				onSubmit={formik.handleSubmit}
				isNew={!jsonData}
				title="Controller"
			/>

			<div className="space-y-4 p-4">
				<Card className="rounded-sm p-6">
					<div className="flex gap-4 mb-4">
						<TextInput
							label={t('Name')}
							id="name"
							placeholder={t('Enter name')}
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.name ? formik.errors.name : undefined}
						/>
						<TextInput
							label={t('Base Path')}
							id="basePath"
							placeholder={t('Enter Base Path')}
							value={formik.values.basePath}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.basePath ? formik.errors.basePath : undefined}
						/>

					</div>
				</Card>
				<Accordion type="single" className="w-full space-y-3" collapsible value={openAccordion} onValueChange={toggleBordered}>
					{formik.values.actions?.map((action: any, index: number) => (
						<AccordionItem value={`ACTION-${index}`} className="shadow px-3 rounded-lg">
							<AccordionTrigger>
								<div className='space-x-2 align-middle '>
									<span>{action?.general?.[0]?.actionName || `ACTION ${index + 1}`}</span>
									{getErrorsLength(
										TabList.map((d) => d.tabId),
										index
									) > 0 &&
										openAccordion !== `ACTION-${index}` && (
											<Badge variant='outline' className='text-red-500'>
												<ShieldAlert className='h-4 ' />
												{getErrorsLength(
													TabList.map((d) => d.tabId),
													index
												)}
											</Badge>
										)}
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<Tabs defaultValue={'general'}>
									<TabsList className="grid w-full grid-cols-3">
										{TabList.map(({ label, tabId }, key) => (
											<TabsTrigger key={key} value={tabId}>
												{label}
											</TabsTrigger>
										))}
									</TabsList>

									{TabList.map(({ tabId, label }, key) => (
										<TabsContent key={key} value={tabId}>
											{tablesColumns && tablesColumns[tabId] && (
												<FormList
													columns={tablesColumns[tabId]}
													data={formik.values.actions[index]?.[tabId]}
													changeValue={(element, position, value) =>
														changeValue(element, index, position, value, tabId)
													}
													addRow={tabId !== 'general' ? () => addNewRow(index, tabId) : undefined}
													removeRow={
														tabId !== 'general'
															? (position) => removeRow(tabId, index, position)
															: undefined
													}
													errors={formik.errors.actions?.[index]?.[tabId]}
													name={label}
												/>
											)}
											<Button
												size="sm"
												variant="outline"
												className="ms-1 mt-4 outline outline-1 outline-red-500 text-red-500"
												onClick={() => handleDeleteAction(index)}
											>
												{t('delete')}
											</Button>
										</TabsContent>
									))}
								</Tabs>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
				<div className="bg-white px-2  w-full">
					<Button color="success" variant={'outline'} onClick={handleAddAction}>
						New Action
					</Button>
				</div>
			</div>
		</React.Fragment>
	)
}

export default ControllerLayout
