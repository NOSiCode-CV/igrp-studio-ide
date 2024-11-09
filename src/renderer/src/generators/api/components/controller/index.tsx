import React, { useEffect, useState } from 'react'
import {
	Accordion,
	AccordionBody,
	AccordionHeader,
	AccordionItem,
	Button, Card, CardBody, Col, FormFeedback, FormGroup, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane
} from 'reactstrap'
import { useFormik } from 'formik'
import { IColumnsTabelProps } from '../Interfaces'
import { FormList } from '../FormList'
import { CardTableList, getTablesColumns, TabList, TabType, defaultValues, initialValues } from './config'

import {
	setChangeStatus as onSetChangeStatus,
} from "@renderer/redux/thunks";
import { useDispatch } from 'react-redux'
import { ControllerAction, ControllerConfig } from '@igrp/spring-engine/dist/interfaces/types'
import useToast from '@renderer/components/useToast'
import FormAction from '../form-actions'
import { useControllerValidation } from './validation'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'

interface ControllerProps {
	jsonData?: any
	onCancel: () => void
	basePath: string
	selectors: Array<any>
}

const ControllerLayout = ({ jsonData, onCancel, basePath, selectors }: ControllerProps): JSX.Element => {

	const { t } = useTranslation()

	const dispatch: any = useDispatch();

	const [openBordered, setOpenBordered] = useState('ACTION-0');

	const [activeTabs, setActiveTabs] = useState<string>('general')

	const [tablesColumns, setTableColumns] = useState<{ [value: string]: IColumnsTabelProps[] }>({});

	const { showErrorToast, showSuccessToast } = useToast()

	const validationSchema = useControllerValidation({ t })

	const validation: any = useFormik({
		enableReinitialize: true,

		initialValues,

		validationSchema,

		onSubmit: (_values, actions) => {
			actions.setSubmitting(false)
			handleSave();
		}
	})

	const toggleBordered = (id: any) => {
		if (openBordered !== id) {
			setOpenBordered(id);
		}
	};

	useEffect(() => {
		const res = getTablesColumns(selectors)
		setTableColumns(res)
	}, [selectors])

	useEffect(() => {
		if (jsonData) {
			// Load the Controller data to edit
			const { actions, name, basePath } = jsonData

			const newActions = actions.map(({ actionName, path, method, accepts, requestBody, response, pathVariables, requestParams }) => ({
				general: [{ actionName, path, method, accepts, requestBody, response }],
				pathVariables: pathVariables || [defaultValues.pathVariables],
				requestParams: requestParams || [defaultValues.requestParams],
			}));

			validation.setFieldValue('name', name)
			validation.setFieldValue('basePath', basePath)
			validation.setFieldValue('actions', newActions)
		} else
			validation.resetForm()

	}, [jsonData])


	const toggleTab = (tab: string) => {
		setActiveTabs(tab)
	}

	const addNewRow = (actionIndex: number, field: string) => {
		validation.setFieldValue(
			'actions',
			validation.values.actions.map((action: any, index: number) =>
				actionIndex === index
					? { ...action, [field]: [...action?.[field], defaultValues[field]] }
					: action
			)
		)
	}

	const removeRow = (field: string, actionIndex: number, position: number) => {
		validation.setFieldValue(
			'actions',
			validation.values.actions.map((action: any, index: number) =>
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
		validation.setFieldValue(
			'actions',
			validation.values.actions.map((action: any, index: number) =>
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

	const handleAddAction = () => {
		validation.setFieldValue('actions', [
			...validation.values.actions,
			{
				general: [defaultValues.general],
				pathVariables: [defaultValues.pathVariables],
				requestParams: [defaultValues.requestParams]
			}
		])
		setOpenBordered(`ACTION-${validation.values.actions.length}`)
	}

	const handleDeleteAction = (position: number) => {
		validation.setFieldValue(
			'actions',
			validation.values.actions?.filter((_, index) => index !== position)
		)
	}

	const getErrorsLength = (values: string[], position: number) => {
		return values.reduce((count, value) => {
			const errors = validation.errors?.actions?.[position]?.[value];
			if (Array.isArray(errors)) {
				// Only count if errors is an array
				return count + errors.reduce((sum, d) => sum + (d ? Object.keys(d).length : 0), 0);
			}
			return count;
		}, 0);
	};


	const getValuesToSubmit = () => {
		const values = { ...validation.values };

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

	const handleSave = async (): Promise<void> => {
		try {
			const values = getValuesToSubmit()

			const { error } = await window.api.createController(values, basePath);

			if (error) {
				showErrorToast(error);
				return;
			}

			dispatch(onSetChangeStatus(true));

			showSuccessToast(`Controller ${values.name} have been successfully added.`);

		} catch (error: unknown) {
			showErrorToast(error);

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
		validation.resetForm();
	}

	return (
		<React.Fragment>
			<FormAction
				onDelete={handleDelete}
				onCancel={handleCancel}
				onSubmit={validation.handleSubmit}
				isNew={jsonData === null}
				title="Controller" />

			<Card>
				<CardBody>
					<Row>
						<Col md={4}>
							<div className="mb-3">
								<FormGroup>
									<Label htmlFor="name" className="form-label">
										Name
									</Label>
									<Input
										name="name"
										type="text"
										className="form-control"
										placeholder="Name"
										onChange={validation.handleChange}
										onBlur={validation.handleBlur}
										value={validation.values.name || ''}
										invalid={validation.touched.name && validation.errors.name ? true : false}
									/>
									{validation.touched.name && validation.errors.name ? (
										<FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
									) : null}
								</FormGroup>
							</div>
						</Col>
						<Col md={4}>
							<div className="mb-3">
								<FormGroup>
									<Label htmlFor="basePath" className="form-label">
										Base Path
									</Label>
									<Input
										name="basePath"
										type="text"
										className="form-control"
										placeholder="Base Path"
										onChange={validation.handleChange}
										onBlur={validation.handleBlur}
										value={validation.values.basePath || ''}
										invalid={validation.touched.basePath && validation.errors.basePath ? true : false}
									/>
									{validation.touched.basePath && validation.errors.basePath ? (
										<FormFeedback type="invalid">{validation.errors.basePath}</FormFeedback>
									) : null}
								</FormGroup>
							</div>
						</Col>
					</Row>
				</CardBody>
			</Card>
			<Accordion className="custom-accordionwithicon custom-accordion-border accordion-border-box" id="accordionBordered" open={openBordered} toggle={toggleBordered}>
				{validation.values.actions?.map((action, index: number) => (
					<AccordionItem key={index}>
						<AccordionHeader targetId={`ACTION-${index}`}>
							{action?.general?.[0]?.actionName || `ACTION ${index + 1}`}
							{getErrorsLength(
								TabList.map((d) => d.value),
								index
							) > 0 &&
								openBordered !== `ACTION-${index}` && (
									<span className="badge rounded-pill bg-danger ms-3">
										<i className="bx bx-error"></i>
										{getErrorsLength(
											TabList.map((d) => d.value),
											index
										)}
									</span>
								)}
						</AccordionHeader>
						<AccordionBody accordionId={`ACTION-${index}`}>
							<Nav tabs className="nav nav-tabs nav-tabs-custom nav-success nav-justified mt-n3 mx-n3">
								{TabList.map(({ label, value }, key) => (
									<NavItem key={key}>
										<NavLink
											className={classNames({
												active: activeTabs === value,
											}, 'cursor-pointer')}
											onClick={() => {
												toggleTab(value as TabType)
											}}
										>
											{label}
											{getErrorsLength([value], index) > 0 && (
												<span className="m-auto badge rounded-pill bg-danger ms-3">
													<i className="bx bx-error"></i>
													{getErrorsLength([value], index)}
												</span>
											)}
										</NavLink>
									</NavItem>
								))}
							</Nav>
							<TabContent activeTab={activeTabs} className='mx-n3'>
								{CardTableList.map(({ key, label }, index2) => (
									<TabPane tabId={key} key={index2}>
										{tablesColumns && tablesColumns[key] && (
											<FormList
												columns={tablesColumns[key]}
												data={validation.values.actions[index]?.[key]}
												changeValue={(element, position, value) =>
													changeValue(element, index, position, value, key)
												}
												addRow={activeTabs !== 'general' ? () => addNewRow(index, key) : undefined}
												removeRow={
													activeTabs !== 'general'
														? (position) => removeRow(key, index, position)
														: undefined
												}
												errors={validation.errors.actions?.[index]?.[key]}
												name={label}
											/>
										)}
										<div className="pe-2 justify-content-end d-flex">
											<Button
												color="danger"
												outline
												onClick={() => handleDeleteAction(index)}
												className="d-flex align-items-center gap-1 border-0"
											>
												<i className="bx bxs-trash"></i>
												Delete
											</Button>
										</div>
									</TabPane>
								))}
							</TabContent>
						</AccordionBody>
					</AccordionItem>
				))}
			</Accordion>
			<div className="bg-white p-2  mt-3">
				<Button color="success" outline onClick={handleAddAction}>
					New Action
				</Button>
			</div>
		</React.Fragment>
	)
}

export default ControllerLayout
