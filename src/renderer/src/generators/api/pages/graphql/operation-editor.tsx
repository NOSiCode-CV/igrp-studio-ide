import {
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import { FormList } from '../../../../components/form-list'
import type { IColumnsTabelProps } from '../../types/Interfaces'
import NavigationBar from '../../components/navigation-bar'
import { SelectInput, TextInput } from '../../components/inputs-form'
import { addNewRow, removeRow } from '../../helpers'
import { useGraphQLOperation } from './useGraphQLOperation'

interface GraphQLOperationEditorProps {
    currentItem: any
    onCloseTab: () => void
}

const argsColumns: IColumnsTabelProps[] = [
    { key: 'name', name: 'Name', type: 'text' },
    {
        key: 'type',
        name: 'Type',
        type: 'select',
        options: [
            { label: 'ID', value: 'ID' },
            { label: 'String', value: 'String' },
            { label: 'Int', value: 'Int' },
            { label: 'Float', value: 'Float' },
            { label: 'Boolean', value: 'Boolean' }
        ]
    },
    { key: 'defaultValue', name: 'Default Value', type: 'text' },
    { key: 'description', name: 'Description', type: 'text' },
    { key: 'required', name: 'Required', type: 'checkbox' },
    { key: 'primaryKey', name: 'Primary Key', type: 'checkbox' }
]

export const GraphQLOperationEditor = ({
    currentItem,
    onCloseTab
}: GraphQLOperationEditorProps) => {
    const {
        formik,
        changeArgValue,
        handleDelete,
        title,
        isMutation,
        isSubscription,
        isPersisted,
        returnTypeOptions,
        inputTypeOptions
    } = useGraphQLOperation({
        currentItem,
        onCloseTab
    })

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                formik.handleSubmit()
            }}
        >
            <NavigationBar title={title} isNew={!isPersisted} onDelete={handleDelete} />

            <div className="space-y-4 p-4">
                <IGRPCardPrimitive>
                    <IGRPCardHeaderPrimitive>
                        <IGRPCardTitlePrimitive>Definition</IGRPCardTitlePrimitive>
                        <IGRPCardDescriptionPrimitive>
                            Configure this GraphQL operation and persist it to the module manifest.
                        </IGRPCardDescriptionPrimitive>
                    </IGRPCardHeaderPrimitive>
                    <IGRPCardContentPrimitive>
                        <div className="w-full">
                            <div
                                className="grid gap-4"
                                style={{
                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
                                }}
                            >
                                <div>
                                    <TextInput
                                        id="name"
                                        label="Operation Name"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        isRequired
                                        error={formik.errors.name}
                                        isTouched={Boolean(formik.touched.name)}
                                    />
                                </div>
                                <div>
                                    <TextInput
                                        id="comment"
                                        label="Comment"
                                        value={formik.values.comment}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </div>
                            </div>

                            <IGRPSeparator orientation="horizontal" className="my-4" />

                            <div
                                className="grid gap-4"
                                style={{
                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
                                }}
                            >
                                <div>
                                    <SelectInput
                                        id="returnType"
                                        label="Return Type"
                                        value={formik.values.returnType}
                                        options={returnTypeOptions}
                                        onChange={(value) =>
                                            formik.setFieldValue('returnType', value)
                                        }
                                        isRequired
                                        error={formik.errors.returnType}
                                        isTouched={Boolean(formik.touched.returnType)}
                                    />
                                </div>
                                <div>
                                    <SelectInput
                                        id="returnMode"
                                        label="Return Mode"
                                        value={formik.values.returnMode}
                                        options={[
                                            { label: 'Single Object', value: 'single' },
                                            { label: 'List', value: 'list' }
                                        ]}
                                        onChange={(value) =>
                                            formik.setFieldValue('returnMode', value)
                                        }
                                        isRequired
                                        error={formik.errors.returnMode}
                                        isTouched={Boolean(formik.touched.returnMode)}
                                    />
                                </div>
                            </div>
                        </div>
                    </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>

                {isMutation && (
                    <IGRPCardPrimitive>
                        <IGRPCardHeaderPrimitive>
                            <IGRPCardTitlePrimitive>Input Type</IGRPCardTitlePrimitive>
                            <IGRPCardDescriptionPrimitive>
                                Define the complex input object for this mutation.
                            </IGRPCardDescriptionPrimitive>
                        </IGRPCardHeaderPrimitive>
                        <IGRPCardContentPrimitive>
                            <SelectInput
                                id="inputType"
                                label="Input Type Reference"
                                value={formik.values.inputType}
                                options={inputTypeOptions}
                                onChange={(value) => formik.setFieldValue('inputType', value)}
                                error={formik.errors.inputType}
                                isTouched={Boolean(formik.touched.inputType)}
                            />
                        </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                )}

                {isSubscription && (
                    <IGRPCardPrimitive>
                        <IGRPCardHeaderPrimitive>
                            <IGRPCardTitlePrimitive>
                                Event Pattern Configuration
                            </IGRPCardTitlePrimitive>
                            <IGRPCardDescriptionPrimitive>
                                Define which events trigger this GraphQL subscription.
                            </IGRPCardDescriptionPrimitive>
                        </IGRPCardHeaderPrimitive>
                        <IGRPCardContentPrimitive>
                            <TextInput
                                id="eventTopic"
                                label="Event Topic / Pattern"
                                value={formik.values.eventTopic}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isRequired
                                error={formik.errors.eventTopic}
                                isTouched={Boolean(formik.touched.eventTopic)}
                            />
                        </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                )}

                <div className="space-y-3">
                    <p className="text-sm">
                        {isMutation
                            ? 'Mutation Params'
                            : isSubscription
                              ? 'Subscription Params'
                              : 'Query Params'}
                    </p>
                    <div className="border rounded-sm py-0">
                        <FormList
                            name="args"
                            data={formik.values.args}
                            formik={formik}
                            errors={formik.errors.args}
                            touched={formik.touched.args}
                            columns={argsColumns}
                            changeValue={changeArgValue}
                            addRow={() =>
                                addNewRow(formik, 'args', {
                                    name: '',
                                    type: 'string',
                                    required: false,
                                    primaryKey: false,
                                    defaultValue: '',
                                    description: ''
                                })
                            }
                            removeRow={(index) => removeRow(formik, 'args', index)}
                        />
                    </div>
                </div>
            </div>
        </form>
    )
}
