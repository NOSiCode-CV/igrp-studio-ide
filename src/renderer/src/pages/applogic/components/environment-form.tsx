'use client'

import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPTextAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type React from 'react'
import { useState } from 'react'
import type { AppLogicEnvironment } from 'src/main/types'
import { EnvironmentValidator } from '../validation'

interface EnvironmentFormProps {
    environment?: Partial<AppLogicEnvironment>
    onSubmit: (data: Omit<AppLogicEnvironment, 'id' | 'status' | 'createdAt'>) => void
    onCancel: () => void
    loading?: boolean
}

export function EnvironmentForm({
    environment,
    onSubmit,
    onCancel,
    loading
}: EnvironmentFormProps) {
    const [formData, setFormData] = useState({
        name: environment?.name || '',
        url: environment?.url || '',
        apiKey: environment?.apiKey || '',
        description: environment?.description || ''
    })

    const [errors, setErrors] = useState<string[]>([])
    const [warnings, setWarnings] = useState<string[]>([])

    const validateForm = () => {
        const validation = EnvironmentValidator.validateEnvironment(formData)
        setErrors(validation.errors)
        setWarnings(validation.warnings)
        return validation.isValid
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            const sanitized = EnvironmentValidator.sanitizeEnvironment(formData)
            onSubmit(sanitized as Omit<AppLogicEnvironment, 'id' | 'status' | 'createdAt'>)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Environment Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <IGRPLabelPrimitive htmlFor="name">Environment Name *</IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value
                                }))
                            }
                            placeholder="Production API"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <IGRPLabelPrimitive htmlFor="url">Base URL *</IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="url"
                            type="url"
                            value={formData.url}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    url: e.target.value
                                }))
                            }
                            placeholder="https://api.applogic.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <IGRPLabelPrimitive htmlFor="description">Description</IGRPLabelPrimitive>
                    <IGRPTextAreaPrimitive
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: e.target.value
                            }))
                        }
                        placeholder="Brief description of this environment"
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <IGRPLabelPrimitive htmlFor="apiKey">API Key *</IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                        id="apiKey"
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                apiKey: e.target.value
                            }))
                        }
                        placeholder="Enter your API key"
                        required
                    />
                </div>
            </div>

            {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                    <ul className="list-disc list-inside text-red-700 text-sm">
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                    <ul className="list-disc list-inside text-yellow-700 text-sm">
                        {warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
                <IGRPButtonPrimitive type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive type="submit" disabled={loading}>
                    {loading
                        ? 'Saving...'
                        : environment
                          ? 'Update Environment'
                          : 'Create Environment'}
                </IGRPButtonPrimitive>
            </div>
        </form>
    )
}
