import {
    IGRPButtonPrimitive,
    IGRPDialogClosePrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useFramework } from '@renderer/hooks/use-framework'
import { useGit } from '@renderer/hooks/use-git'
import { defaultPrimaryKeyGenerationType } from '../../pages/model/config'
import useToast from '@renderer/hooks/useToast'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { getId, toFullCamelCaseFromSnakeCase } from '@renderer/utils'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { getValuesToSubmit, initialValues } from '../../pages/model/config'
import { ConnectionManager } from './ConnectionManager'
import { TableManager } from './TableManager'

interface DatabaseManagerModalProps {
    isOpen?: boolean
    setIsOpen?: (open: boolean) => void
    item?: any
    basePath?: string
}

const typeMapping = {
    'character varying': 'string',
    text: 'string',
    integer: 'integer',
    bigint: 'long',
    smallint: 'short',
    boolean: 'boolean',
    decimal: 'decimal',
    numeric: 'decimal',
    real: 'float',
    'double precision': 'double',
    'timestamp without time zone': 'datetime',
    'timestamp with time zone': 'datetime',
    date: 'date',
    'time without time zone': 'time',
    'time with time zone': 'time',
    uuid: 'uuid',
    bytea: 'file'
}

const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
    isOpen = false,
    setIsOpen,
    item,
    basePath
}) => {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()) // Track selected rows
    const [selectedConnection, setSelectedConnection] = useState<string>('')
    const { showErrorToast, showSuccessToast } = useToast()
    const { t } = useTranslation()
    const { createGitCommit } = useGit()
    const framework = useFramework()
    const dispatch: any = useDispatch()

    const { module } = item

    const handleClickSubmit = async (): Promise<void> => {
        if (!basePath) return

        const errorMessages: string[] = []
        const processedTables = new Set<string>()

        const processTable = async (tableName: string): Promise<void> => {
            if (processedTables.has(tableName)) return
            processedTables.add(tableName)

            try {
                const { success, message, structure } =
                    await window.igrpStudio.connection.getTableStructure(
                        selectedConnection,
                        tableName
                    )

                if (success) {
                    // Map the attributes
                    const attributes = structure
                        .filter(() => true)
                        .map((column: any) => {
                            const relation = column.foreign_key_table
                                ? {
                                      type: 'ManyToOne',
                                      entity: toFullCamelCaseFromSnakeCase(
                                          column.foreign_key_table
                                      ),
                                      referencedColumnName: column.foreign_key_column,
                                      joinTable: '',
                                      inverseJoinColumn: '',
                                      cardinality: 'oneWay',
                                      module
                                  }
                                : null

                            return {
                                name: column.name || '',
                                type: relation
                                    ? 'relation'
                                    : typeMapping[column.data_type as keyof typeof typeMapping] ||
                                      'string', // Map types
                                length: column.max_length || null,
                                defaultValue: !column.is_primary_key ? column.default_value : '',
                                nullable: column.is_nullable ?? true, // Use nullish coalescing for better accuracy
                                unique: column.is_unique || false,
                                primaryKey: column.is_primary_key || false,
                                relation, // Add the relation if it exists
                                // When importing tables from an existing DB,
                                // PK columns get the framework's identity
                                // marker (`'IDENTITY'` for Spring/JPA,
                                // `'Identity'` for EF Core). Non-PK columns
                                // stay `null` so the engine treats them as
                                // "not provided".
                                generationType: column.is_primary_key
                                    ? defaultPrimaryKeyGenerationType(framework)
                                    : null
                            }
                        })

                    // Add referenced foreign_key_table to selectedRows dynamically if not present
                    for (const column of structure.filter((col: any) => col.foreign_key_table)) {
                        const foreignKeyTable = column.foreign_key_table
                        if (!selectedRows.has(foreignKeyTable)) {
                            selectedRows.add(foreignKeyTable) // Add to the list
                            await processTable(foreignKeyTable)
                        }
                    }

                    const tableJson = {
                        ...initialValues,
                        id: getId(),
                        tableName: tableName,
                        attributes,
                        name: tableName.charAt(0).toUpperCase() + tableName.slice(1)
                    }

                    const values = getValuesToSubmit(tableJson, module)

                    const { error } = await window.engine.createModel(
                        values,
                        framework,
                        basePath
                    )

                    if (error) errorMessages.push(error)
                } else {
                    console.error(
                        `Failed to fetch structure for table: ${tableName}. Message: ${message}`
                    )
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'An unknown error occurred'
                errorMessages.push(message)
            }
        }

        // Process all initially selected rows
        for (const tableName of selectedRows) {
            await processTable(tableName)
        }

        if (errorMessages.length > 0) {
            errorMessages.forEach((errMsg: string) => {
                showErrorToast(errMsg)
            })
        } else {
            // Wait a bit for file system operations to complete
            await new Promise((resolve) => setTimeout(resolve, 100))

            await createGitCommit(basePath, `Import data tables`)
            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('schemaCreatedSuccess'))
        }
    }

    const handleClose = (): void => {
        setIsOpen?.(false)
    }

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={setIsOpen}>
            <IGRPDialogContentPrimitive
                className="sm:max-w-[600px] md:max-w-[900px] max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                        {t('importDataTableFromDatabase')}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('manageDatabaseConnections')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <IGRPTabsPrimitive defaultValue="tables" className="w-full">
                    <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
                        <IGRPTabsTriggerPrimitive value="tables">
                            {t('importDataTables')}
                        </IGRPTabsTriggerPrimitive>
                        <IGRPTabsTriggerPrimitive value="connections">
                            {t('manageConnections')}
                        </IGRPTabsTriggerPrimitive>
                    </IGRPTabsListPrimitive>
                    <IGRPTabsContentPrimitive value="tables">
                        <TableManager
                            onRowsSubmit={setSelectedRows}
                            onSelectedConnection={setSelectedConnection}
                        />
                    </IGRPTabsContentPrimitive>
                    <IGRPTabsContentPrimitive value="connections">
                        <ConnectionManager />
                    </IGRPTabsContentPrimitive>
                </IGRPTabsPrimitive>
                <IGRPDialogFooterPrimitive>
                    <IGRPDialogClosePrimitive asChild>
                        <IGRPButtonPrimitive
                            type="button"
                            variant="secondary"
                            onClick={() => handleClose}
                        >
                            {t('close')}
                        </IGRPButtonPrimitive>
                    </IGRPDialogClosePrimitive>
                    <IGRPButtonPrimitive type="submit" onClick={handleClickSubmit}>
                        {t('save')}
                    </IGRPButtonPrimitive>
                </IGRPDialogFooterPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}

export default DatabaseManagerModal
