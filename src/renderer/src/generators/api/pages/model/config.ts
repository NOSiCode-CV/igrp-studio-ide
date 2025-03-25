import { ModelConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types'
import { formatMethods, getOptionsByObject } from '../../helpers'
import { IColumnsTabelProps } from '../../types/Interfaces'
import { SchemaTypeItem } from 'src/main/types'

export const initialValues = {
	type: 'model',
	module: '',
	name: '',
	tableName: '',
	audit: true,
	crud: false,
	revision: false,
	attributes: [
		{
			name: 'id',
			type: 'integer',
			length: null,
			defaultValue: '',
			nullable: false,
			unique: false,
			primaryKey: true,
			generationType: 'IDENTITY',
			skipFieldRevision: false
		},
		{
			name: '',
			type: 'string',
			length: null,
			defaultValue: '',
			nullable: true,
			unique: false,
			primaryKey: false,
			skipFieldRevision: false
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
			columns: []
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
		primaryKey: false,
		skipFieldRevision: false
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
	revision,
	models,
	enums,
	currentItem,
	t
}): { [value: string]: IColumnsTabelProps[] } => {

	const { module } = currentItem || {}

	const modelsOptions = (models || [])
		.filter((model) => model.content?.name !== name)
		.map((model) => ({
			value: model.content?.name || model.name,
			label: model.content?.name || model.name,
			module: model.content?.module
		}));

	const columns = attributes.map((attribute) => ({
		value: attribute.name,
		label: attribute.name
	}))

	const dataTypes = (
		selectors.find((selector) => 'MODEL_ATTRIBUTE_TYPES' in selector) as
		| {
			MODEL_ATTRIBUTE_TYPES: string[]
		}
		| undefined
	)?.MODEL_ATTRIBUTE_TYPES || []

	const generateTypes = formatMethods(
		(
			selectors.find((selector) => 'GENERATION_TYPES' in selector) as
			| { GENERATION_TYPES: string[] }
			| undefined
		)?.GENERATION_TYPES || [])

	const enumMap = getOptionsByObject(enums, module, null);

	const fieldTypeOptions: SchemaTypeItem[] = [
		{ label: t('dataTypes'), value: 'java', items: dataTypes },
		{ label: t('enum'), value: 'enum', items: enumMap }
	]

	return {
		attributes: [
			{ key: 'name', name: t('name'), type: 'text' },
			{ key: 'type', name: t('type'), type: 'typeSelectorDropdown', options: fieldTypeOptions },
			{
				key: 'group', name: '', type: 'group', items: [
					{ key: 'primaryKey', name: 'Primary Key', type: 'checkbox' },
					{ key: 'advanced', name: '', type: 'popoverModel', options: { generateTypes, revision } },
					{ key: 'relation', name: 'Relation', type: 'popoverRelation', options: { modelsOptions, models } },
				]
			}
		],
		indexes: [
			{ key: 'name', name: t('name'), type: 'text', width: '25%' },
			{
				key: 'columns',
				name: t('columns'),
				type: 'multiSelect',
				options: columns,
				width: '50%'
			},
			{
				key: 'unique',
				name: t('unique'),
				type: 'checkbox',
				width: '25%'
			}
		],
		uniqueConstraints: [
			{ key: 'name', name: t('name'), type: 'text', width: '25%' },
			{ key: 'columns', name: t('columns'), type: 'multiSelect', options: columns, width: '50%' }
		]
	}
}

export const getValuesToSubmit = (values: any, module: string) => {

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

	const hasListPk = primaryKey.length > 1;

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
