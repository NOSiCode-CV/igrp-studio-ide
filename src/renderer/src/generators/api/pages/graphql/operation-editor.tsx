import {
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import { Plus } from 'lucide-react'
import NavigationBar from '../../components/navigation-bar'
import { CheckboxInput, SelectInput, TextInput } from '../../components/inputs-form'
import { addNewRow, removeRow } from '../../helpers'
import { useGraphQLOperation } from './useGraphQLOperation'

interface GraphQLOperationEditorProps {
    currentItem: any
    onCloseTab: () => void
}

export const GraphQLOperationEditor = ({
    currentItem,
    onCloseTab
}: GraphQLOperationEditorProps) => {
    const {
        formik,
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
                                isRequired
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

                <IGRPCardPrimitive>
                    <IGRPCardHeaderPrimitive>
                        <div className="flex items-center justify-between">
                            <div>
                                <IGRPCardTitlePrimitive>
                                    {isMutation
                                        ? 'Mutation Params'
                                        : isSubscription
                                          ? 'Subscription Params'
                                          : 'Query Params'}
                                </IGRPCardTitlePrimitive>
                                <IGRPCardDescriptionPrimitive>
                                    Optional arguments persisted into the GraphQL manifest.
                                </IGRPCardDescriptionPrimitive>
                            </div>
                            <IGRPButtonPrimitive
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    addNewRow(formik, 'args', {
                                        name: '',
                                        type: 'string',
                                        required: false,
                                        defaultValue: '',
                                        description: ''
                                    })
                                }
                                title="Add Param"
                            >
                                <Plus className="h-4 w-4" />
                            </IGRPButtonPrimitive>
                        </div>
                    </IGRPCardHeaderPrimitive>
                    <IGRPCardContentPrimitive>
                        <div className="space-y-4">
                            {formik.values.args.length === 0 && (
                                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No parameters defined.
                                </div>
                            )}

                            {formik.values.args.map((_: unknown, index: number) => (
                                <div
                                    key={`arg-${index}`}
                                    className="grid lg:grid-cols-6 gap-3 items-end rounded-md border p-3"
                                >
                                    <TextInput
                                        id={`args.${index}.name`}
                                        label="Name"
                                        value={formik.values.args[index].name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={(formik.errors.args as any)?.[index]?.name}
                                        isTouched={Boolean(
                                            (formik.touched.args as any)?.[index]?.name
                                        )}
                                    />
                                    <SelectInput
                                        id={`args.${index}.type`}
                                        label="Type"
                                        value={formik.values.args[index].type}
                                        options={[
                                            { label: 'id', value: 'id' },
                                            { label: 'string', value: 'string' },
                                            { label: 'int', value: 'int' },
                                            { label: 'float', value: 'float' },
                                            { label: 'boolean', value: 'boolean' }
                                        ]}
                                        onChange={(value) =>
                                            formik.setFieldValue(`args.${index}.type`, value)
                                        }
                                        error={(formik.errors.args as any)?.[index]?.type}
                                        isTouched={Boolean(
                                            (formik.touched.args as any)?.[index]?.type
                                        )}
                                    />
                                    <TextInput
                                        id={`args.${index}.defaultValue`}
                                        label="Default Value"
                                        value={String(formik.values.args[index].defaultValue ?? '')}
                                        onChange={(event) =>
                                            formik.setFieldValue(
                                                `args.${index}.defaultValue`,
                                                event.target.value
                                            )
                                        }
                                        onBlur={formik.handleBlur}
                                    />
                                    <TextInput
                                        id={`args.${index}.description`}
                                        label="Description"
                                        value={formik.values.args[index].description}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    <div className="pb-2">
                                        <CheckboxInput
                                            id={`args.${index}.required`}
                                            label="Required"
                                            value={formik.values.args[index].required}
                                            onChange={(value) =>
                                                formik.setFieldValue(
                                                    `args.${index}.required`,
                                                    value
                                                )
                                            }
                                        />
                                    </div>
                                    <IGRPButtonPrimitive
                                        type="button"
                                        variant="outline"
                                        onClick={() => removeRow(formik, 'args', index)}
                                    >
                                        Remove
                                    </IGRPButtonPrimitive>
                                </div>
                            ))}
                        </div>
                    </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
            </div>
        </form>
    )
}
