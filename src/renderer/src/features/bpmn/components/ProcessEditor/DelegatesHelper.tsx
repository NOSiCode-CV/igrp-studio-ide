import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPIcon,
    type IGRPIconName,
    useIGRPToast
} from '@igrp/igrp-framework-react-design-system'
import { type JSX, useState } from 'react'

interface DelegateParameter {
    name: string
    description: string
}

interface Delegate {
    name: string
    category: string
    icon: IGRPIconName | string
    description: string
    syntax: string
    parameters: DelegateParameter[]
    example: string
}

const delegates: Delegate[] = [
    {
        name: 'igrpSendEmailDelegate',
        category: 'Mail',
        icon: 'Mail',
        description:
            'Sends an email message to the specified recipient with the provided subject and body.',
        syntax: '${igrpSendEmailDelegate}',
        parameters: [
            { name: 'emailTo', description: 'Destination email address' },
            { name: 'emailSubject', description: 'Subject of the email' },
            { name: 'emailBody', description: 'Content/body of the email' },
            { name: 'emailFrom', description: 'Sender email address' }
        ],
        example: `<!-- Service Task Configuration -->
Implementation Type: Delegate Expression
Delegate Expression: \${igrpSendEmailDelegate}

<!-- Variables -->
emailTo: user@example.com
emailSubject: Process Notification
emailBody: Your process has been completed successfully
emailFrom: noreply@company.com`
    },
    {
        name: 'igrpMessageBrokerSenderDelegate',
        category: 'Message',
        icon: 'MessageSquare',
        description:
            'Sends a message through the configured message broker (e.g., Kafka or RabbitMQ) based on predefined integration settings.',
        syntax: '${igrpMessageBrokerSenderDelegate}',
        parameters: [
            {
                name: 'topic',
                description: 'The kafka topic where the message will be sent'
            }
        ],
        example: `<!-- Service Task Configuration -->
Implementation Type: Delegate Expression
Delegate Expression: \${igrpMessageBrokerSenderDelegate}

<!-- Variables -->
topic: Sends a message through the configured`
    },
    {
        name: 'igrpWebhookDelegate',
        category: 'Webhook',
        icon: 'Webhook',
        description:
            'Executes an HTTP request to an external webhook endpoint with customizable method, parameters, and payload.',
        syntax: '${igrpWebhookDelegate}',
        parameters: [
            { name: 'webhookUrl', description: 'Base URL for the webhook endpoint' },
            { name: 'webhookMethod', description: 'HTTP method to use (GET, POST, PUT, etc.)' },
            {
                name: 'webhookUrlPath',
                description: 'Path appended to the base URL for the specific resource'
            },
            { name: 'webhookQueryParams', description: 'Query parameters for the request' },
            { name: 'webhookPayload', description: 'Request body (payload) sent to the webhook' },
            { name: 'webhookPayloadHeader', description: 'HTTP headers included in the request' }
        ],
        example: `<!-- Service Task Configuration -->
Implementation Type: Delegate Expression
Delegate Expression: \${igrpWebhookDelegate}

<!-- Variables -->
webhookUrl: https://api.example.com
webhookMethod: POST
webhookUrlPath: /api/v1/notifications
webhookQueryParams: {"userId": "12345"}
webhookPayload: {"message": "Process completed", "status": "success"}
webhookPayloadHeader: {"Content-Type": "application/json", "Authorization": "Bearer token123"}`
    },
    {
        name: 'igrpJsonParseDelegate',
        category: 'Parse',
        icon: 'FileBraces',
        description: 'Extracts a payload into a data variable in the process.',
        syntax: '${igrpJsonParseDelegate}',
        parameters: [
            { name: 'json', description: 'A JSON structured data (encoded in base64 or not)' },
            {
                name: 'isBase64Encoded',
                description: 'A boolean value to set if the json is encoded or not'
            }
        ],
        example: `<!-- Service Task Configuration -->
Implementation Type: Delegate Expression
Delegate Expression: \${igrpJsonParseDelegate}

<!-- Variables -->
json: {"name": "John Doe", "age": 30, "email": "john@example.com"}
isBase64Encoded: false

<!-- Or with base64 encoding -->
json: eyJuYW1lIjoiSm9obiBEb2UiLCJhZ2UiOjMwfQ==
isBase64Encoded: true`
    }
]

export function DelegatesHelper(): JSX.Element {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const { igrpToast } = useIGRPToast()

    const copyToClipboard = async (text: string, id: string, label: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            igrpToast({
                type: 'success',
                title: 'Copied!',
                description: `${label} copied to clipboard`
            })
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error('Failed to copy', err)
            igrpToast({
                type: 'error',
                title: 'Failed to copy',
                description: 'Please try again'
            })
        }
    }

    return (
        <div className="space-y-6">
            <IGRPCardPrimitive>
                <IGRPCardHeaderPrimitive>
                    <IGRPCardTitlePrimitive>Available Delegates</IGRPCardTitlePrimitive>
                    <IGRPCardDescriptionPrimitive>
                        Delegates allow you to integrate custom logic or external services
                        directly into BPMN process workflows. Use them in Service Tasks by
                        setting the Implementation Type to{' '}
                        <IGRPBadgePrimitive variant="secondary">
                            Delegate Expression
                        </IGRPBadgePrimitive>
                    </IGRPCardDescriptionPrimitive>
                </IGRPCardHeaderPrimitive>
            </IGRPCardPrimitive>

            <div className="grid gap-6">
                {delegates.map((delegate) => (
                    <IGRPCardPrimitive key={delegate.name}>
                        <IGRPCardHeaderPrimitive>
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <IGRPIcon iconName={delegate.icon as IGRPIconName} />
                                </div>
                                <div>
                                    <IGRPCardTitlePrimitive className="text-xl">
                                        {delegate.name}
                                    </IGRPCardTitlePrimitive>
                                    <IGRPBadgePrimitive variant="outline" className="mt-1">
                                        {delegate.category}
                                    </IGRPBadgePrimitive>
                                </div>
                            </div>
                            <IGRPCardDescriptionPrimitive className="mt-3">
                                {delegate.description}
                            </IGRPCardDescriptionPrimitive>
                        </IGRPCardHeaderPrimitive>
                        <IGRPCardContentPrimitive className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Delegate Expression Syntax
                                    </h4>
                                    <IGRPButtonPrimitive
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            copyToClipboard(
                                                delegate.syntax,
                                                `syntax-${delegate.name}`,
                                                'Delegate syntax'
                                            )
                                        }
                                    >
                                        {copiedId === `syntax-${delegate.name}` ? (
                                            <IGRPIcon iconName="Check" />
                                        ) : (
                                            <IGRPIcon iconName="Copy" />
                                        )}
                                        Copy Syntax
                                    </IGRPButtonPrimitive>
                                </div>
                                <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                                    {delegate.syntax}
                                </div>
                            </div>

                            {delegate.parameters.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 text-foreground">
                                        Parameters
                                    </h4>
                                    <div className="space-y-2">
                                        {delegate.parameters.map((param) => (
                                            <div
                                                key={param.name}
                                                className="flex items-center gap-3 text-sm group"
                                            >
                                                <IGRPBadgePrimitive
                                                    variant="secondary"
                                                    className="font-mono shrink-0"
                                                >
                                                    {param.name}
                                                </IGRPBadgePrimitive>
                                                <span className="text-muted-foreground flex-1">
                                                    {param.description}
                                                </span>
                                                <IGRPButtonPrimitive
                                                    variant="ghost"
                                                    size="sm"
                                                    className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            param.name,
                                                            `param-${delegate.name}-${param.name}`,
                                                            `Parameter "${param.name}"`
                                                        )
                                                    }
                                                >
                                                    {copiedId ===
                                                    `param-${delegate.name}-${param.name}` ? (
                                                        <IGRPIcon
                                                            iconName="Check"
                                                            className="size-3.5"
                                                        />
                                                    ) : (
                                                        <IGRPIcon
                                                            iconName="Copy"
                                                            className="size-3.5"
                                                        />
                                                    )}
                                                </IGRPButtonPrimitive>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Example Configuration
                                    </h4>
                                </div>
                                <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
                                    <pre className="whitespace-pre-wrap text-foreground">
                                        {delegate.example}
                                    </pre>
                                </div>
                            </div>
                        </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                ))}
            </div>
        </div>
    )
}
