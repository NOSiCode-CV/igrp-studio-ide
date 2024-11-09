import React, { useEffect, useState } from 'react'
import { Card, CardBody, Col, FormFeedback, FormGroup, Input, Label, Row } from 'reactstrap'
import { useFormik } from 'formik'
import Select from 'react-select'
import { IColumnsTabelProps } from '../Interfaces'
import { FormList } from '../form-list'
import useToast from '@renderer/components/useToast'
import { defaultValues, getTablesColumns, TabList, TemplateOptions, initialValues } from './config'
import { DTOConfig } from '@igrp/spring-engine/dist/interfaces/types'
import { useTranslation } from 'react-i18next'

import {
	setChangeStatus as onSetChangeStatus,
} from "@renderer/redux/thunks";
import { useDispatch } from 'react-redux'
import FormAction from '../form-actions'
import { useDtoValidation } from './validation'

interface DtoProps {
	jsonData?: any
	onCancel: () => void
	basePath: string
	selectors: Array<any>
	models?: Array<any>
	dto?: Array<any>
}

const DtoLayout = ({ jsonData, onCancel, basePath, selectors, dto, models }: DtoProps): JSX.Element => {

	const dispatch: any = useDispatch();
	const { showErrorToast, showSuccessToast } = useToast()
	const { t } = useTranslation();

	const [tablesColumns, setTableColumns] = useState<{ [value: string]: IColumnsTabelProps[] }>({});

	const validationSchema = useDtoValidation({ t })

	const validation: any = useFormik({
		enableReinitialize: true,

		initialValues,

		validationSchema,

		onSubmit: (values, actions) => {
			actions.setSubmitting(false)
			save(values)
		}
	})

	// Load DTO fields
	useEffect(() => {
		if (jsonData) {
			const { name, template, attributes } = jsonData

			validation.setFieldValue('name', name || '')
			validation.setFieldValue('template', template || '')
			validation.setFieldValue('attributes', attributes || [defaultValues.attributes])
		} else
			validation.resetForm()

	}, [jsonData])

	useEffect(() => {
		const res = getTablesColumns({ selectors, dto, models, currentDto: jsonData?.name })
		setTableColumns(res)
	}, [selectors])

	const addNewRow = (field: string) => {
		validation.setFieldValue(field, [...validation.values[field], defaultValues[field]])
	}

	const removeRow = (field: string, position: number) => {
		validation.setFieldValue(
			field,
			validation.values[field].filter((_, index: number) => index !== position)
		)
	}

	const changeValue = (element: string, position: number, value: any, name: string) => {
		validation.setFieldValue(
			name,
			validation.values[name].map((row: any, index: number) =>
				index === position ? { ...row, [element]: value } : row
			)
		)
	}

	const save = async (newValues: DTOConfig): Promise<void> => {
		try {

			const { error } = await window.api.createDto(newValues, basePath);

			if (error) {
				showErrorToast(error);
				return;
			}

			dispatch(onSetChangeStatus(true));

			showSuccessToast(`Dto for ${newValues.name} have been successfully added.`);

		} catch (error) {
			showErrorToast(error);
		}
	}

	const handleDelete = async (): Promise<void> => {
		try {
			const { error } = await window.api.deleteDTO({
				type: 'dto',
				name: validation.values.name
			}, basePath);

			if (error) {
				showErrorToast(error);
				return;
			}

			dispatch(onSetChangeStatus(true));
			onCancel()

			showSuccessToast('Dto deleted successfully!')

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
				title="DTO" />

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
										type="text"
										className="form-control"
										placeholder="Name"
										id="name"
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
									<Label htmlFor="template" className="form-label">
										Template
									</Label>
									<Select
										id="template"
										name="select-template"
										options={TemplateOptions}
										onChange={(selectedOption) => {
											validation.setFieldValue('template', selectedOption?.value)
										}}
										value={TemplateOptions?.filter((d) => d.value === validation.values.template)}
										styles={{
											control: (baseStyles) =>
												validation.errors.template
													? { ...baseStyles, borderColor: 'red' }
													: baseStyles
										}}
										isSearchable={false}
									/>
									{validation.errors.template ? (
										<span className="text-danger" style={{ fontSize: 11 }}>
											{validation.errors.template}
										</span>
									) : null}
								</FormGroup>
							</div>
						</Col>
					</Row>
					<Row>
						<Col>
							<h6 className='text-muted'>Fields</h6>
							{TabList.map(({ value }) => (
								tablesColumns && tablesColumns[value] && (
									<FormList
										columns={tablesColumns[value]}
										data={validation.values[value]}
										changeValue={(element, position, val) =>
											changeValue(element, position, val, value)
										}
										errors={validation.errors[value]}
										addRow={() => addNewRow(value)}
										removeRow={(position) => removeRow(value, position)}
										name={'field'}
									/>
								)
							))}
						</Col>
					</Row>
				</CardBody>
			</Card>
		</React.Fragment>
	)
}

export default DtoLayout
