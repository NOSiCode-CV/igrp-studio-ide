import { ModelConfig } from '@igrp/spring-engine/dist/interfaces/types'
import { formatMethods } from '../../helpers'
import { IColumnsTabelProps } from '../../types/Interfaces'

export const initialValues = {
	type: 'model',
	module: '',
	name: '',
	tableName: '',
	audit: true,
	crud: false,
	attributes: [
		{
			name: 'id',
			type: 'integer',
			length: null,
			defaultValue: '',
			nullable: false,
			unique: false,
			primaryKey: true,
			generationType: 'IDENTITY'
		},
		{
			name: '',
			type: 'string',
			length: null,
			defaultValue: '',
			nullable: true,
			unique: false,
			primaryKey: false
		}
	],
	indexes: [
		{
			name: '',
			columns: [],
			unique: false
		}
	],

	uniqueConstraints: [
		{
			name: '',
			columns:[]
		}
	]
}

export const defaultValues: any = {
	attributes: {
		name: '',
		type: 'string',
		length: 0,
		defaultValue: '',
		nullable: false,
		unique: false,
		primaryKey: false
	},
	indexes: {
		name: '',
		columns: [],
		unique: false
	},
	uniqueConstraints: {
		name: '',
		columns: [],
		unique: false
	}
}

export const btnLabels = {
	attributes: 'field',
	relations: 'relation',
	indexes: 'index',
	uniqueConstraints: 'unique Constraints'
}

// SELECT, SELECT-MULTI AND CHECKBOX OPTIONS
export type TabType = 'attributes' | 'indexes' | 'uniqueConstraints'

export const TabList = [
	{ label: 'Fields', value: 'attributes' },
	{ label: 'Indexes', value: 'indexes' },
	{ label: 'Unique Constraints', value: 'uniqueConstraints' }
]

export const indexOptionsOptions = [{ label: 'Unique', value: 'unique' }]

// TABLES FORMAT
export const getTablesColumns = ({
	selectors,
	attributes,
	models
}): { [value: string]: IColumnsTabelProps[] } => {

	const modelsOptions = (models || [])
		.map((model) => ({
			value: model.content?.name || model.name,
			label: model.content?.name || model.name,
		}));

	const columns = attributes.map((attribute) => ({
		value: attribute.name,
		label: attribute.name
	}))

	const fieldTypeOptions = formatMethods(
		(
			selectors.find((selector) => 'MODEL_ATTRIBUTE_TYPES' in selector) as
			| {
				MODEL_ATTRIBUTE_TYPES: string[]
			}
			| undefined
		)?.MODEL_ATTRIBUTE_TYPES || []


	)
	const generateTypes = formatMethods(
		(
			selectors.find((selector) => 'GENERATION_TYPES' in selector) as
			| { GENERATION_TYPES: string[] }
			| undefined
		)?.GENERATION_TYPES || []
	)
	return {
		attributes: [
			{ key: 'name', name: 'Name', type: 'text' },
			{ key: 'type', name: 'Type', type: 'select', options: fieldTypeOptions },
			{
				key: 'group', name: '', type: 'group', items: [
					{ key: 'primaryKey', name: 'Primary Key', type: 'checkbox' },
					{ key: 'advanced', name: '', type: 'popoverModel', options: generateTypes },
					{ key: 'relation', name: 'Relation', type: 'popoverRelation', options: { modelsOptions, models } },
				]
			}
		],
		indexes: [
			{ key: 'name', name: 'Name', type: 'text', width: '25%' },
			{
				key: 'columns',
				name: 'Columns',
				type: 'multiSelect',
				options: columns,
				width: '50%'
			},
			{
				key: 'unique',
				name: 'Unique',
				type: 'checkbox',
				width: '25%'
			}
		],
		uniqueConstraints: [
			{ key: 'name', name: 'Name', type: 'text', width: '25%' },
			{ key: 'columns', name: 'Columns', type: 'multiSelect', options: columns, width: '50%' }
		]
	}
}

export const getValuesToSubmit = (values, module) => {

	const uniqueConstraints =
		values.uniqueConstraints?.filter((rel) => rel.name !== '') || [];

	const indexes = values.indexes?.filter((idx) => idx.name !== '') || [];

	const attributes = values.attributes.map(({ ...field }) => ({
		...field,
		length: field.length ? Number(field.length) : 255,
		nullable: !field.nullable
	}));

	const primaryKey = values.attributes
		.filter((attribute) => attribute.primaryKey === true)
		.map(({ name, type }) => ({
			name,
			type,
		}));

	const hasListPk = primaryKey.length > 1 ? true : false;

	const filteredAttributes = hasListPk
		? attributes.filter((attribute) => attribute.primaryKey !== true)
		: attributes;

	const newValues: ModelConfig = {
		...values,
		attributes: filteredAttributes,
		uniqueConstraints,
		indexes,
		primaryKey: hasListPk ? primaryKey : [],
		module
	};

	return newValues;
};