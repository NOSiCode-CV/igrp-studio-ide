import { Button } from '@renderer/components/ui/button';
import { Switch } from '@renderer/components/ui/switch';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInitCap } from '@renderer/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Shield, AlertCircle } from 'lucide-react';
import { Separator } from '@renderer/components/ui/separator';

interface FormValidationPopoverProps {
    children?: ReactNode;
    index: number;
    field: any;
    fieldType: string;
    changeValue: (element: string, position: number, value: any) => void;
}

export function FormValidationPopover({
    index,
    field,
    fieldType,
    changeValue,
}: FormValidationPopoverProps) {
    const { t } = useTranslation();

    const [isNumber, setIsNumber] = useState(false);
    const [isString, setIsString] = useState(false);
    const [isBoolean, setIsBoolean] = useState(false);
    const [isDate, setIsDate] = useState(false);
    const [isEmail, setIsEmail] = useState(false);

    const handleValidationKeyChange = (key: string, value: string | boolean | number) => {
        const currentValidation = field?.validation || {};
        const updatedValidation = {
            ...currentValidation,
            [key]: value
        };
        changeValue('validation', index, updatedValidation);
    };


    useEffect(() => {
        setIsNumber(['number', 'integer', 'long', 'double', 'float'].includes(fieldType));
        setIsString(['string', 'text', 'textarea', 'password'].includes(fieldType));
        setIsBoolean(fieldType === 'boolean');
        setIsDate(['date', 'datetime', 'time'].includes(fieldType));
        setIsEmail(fieldType === 'email');
    }, [fieldType]);

    const shouldShowValidation = (validation: string) => {
        switch (validation) {
            case 'min':
            case 'max':
            case 'positive':
            case 'negative':
            case 'int':
            case 'finite':
                return isNumber;
            case 'minLength':
            case 'maxLength':
            case 'regex':
            case 'startsWith':
            case 'endsWith':
            case 'includes':
                return isString;
            case 'email':
                return isString || isEmail;
            case 'url':
                return isString;
            case 'uuid':
                return isString;
            case 'minDate':
            case 'maxDate':
                return isDate;
            case 'required':
            case 'optional':
                return true;
            default:
                return true;
        }
    };

    const getValidationOptions = () => {
        const stringValidations = ['minLength', 'maxLength', 'regex', 'email', 'url', 'uuid', 'startsWith', 'endsWith', 'includes'];
        const numberValidations = ['min', 'max', 'positive', 'negative', 'int', 'finite'];
        const dateValidations = ['minDate', 'maxDate'];
        const booleanValidations: string[] = [];

        let validations: string[] = [];

        if (isString || isEmail) {
            validations = [...validations, ...stringValidations];
        }
        if (isNumber) {
            validations = [...validations, ...numberValidations];
        }
        if (isDate) {
            validations = [...validations, ...dateValidations];
        }
        if (isBoolean) {
            validations = [...validations, ...booleanValidations];
        }

        return validations;
    };

    const renderValidationField = (validation: string) => {
        const value = field?.validation?.[validation];
        
        switch (validation) {
            case 'min':
            case 'max':
            case 'minLength':
            case 'maxLength':
                return (
                    <Input
                        type="number"
                        className="h-8"
                        value={value || ''}
                        placeholder={validation === 'min' || validation === 'minLength' ? '>=0' : '>=0'}
                        min={0}
                        onChange={(ev) => {
                            const numValue = Number(ev.target.value);
                            if (numValue >= 0) {
                                handleValidationKeyChange(validation, numValue);
                            }
                        }}
                    />
                );
            case 'regex':
                return (
                    <Input
                        className="h-8"
                        value={value || ''}
                        placeholder="/pattern/"
                        onChange={(ev) => handleValidationKeyChange(validation, ev.target.value)}
                    />
                );
            case 'startsWith':
            case 'endsWith':
            case 'includes':
                return (
                    <Input
                        className="h-8"
                        value={value || ''}
                        placeholder={t('enterValue')}
                        onChange={(ev) => handleValidationKeyChange(validation, ev.target.value)}
                    />
                );
            case 'minDate':
            case 'maxDate':
                return (
                    <Input
                        type="date"
                        className="h-8"
                        value={value || ''}
                        onChange={(ev) => handleValidationKeyChange(validation, ev.target.value)}
                    />
                );
            default:
                return (
                    <Switch
                        checked={value || false}
                        onCheckedChange={(checked) => handleValidationKeyChange(validation, checked)}
                    />
                );
        }
    };

    const generateZodSchema = () => {
        const validations = getValidationOptions();
        let schema = 'z.';
        
        // Base type
        if (isString || isEmail) {
            schema += 'string()';
        } else if (isNumber) {
            schema += 'number()';
        } else if (isBoolean) {
            schema += 'boolean()';
        } else if (isDate) {
            schema += 'date()';
        } else {
            schema += 'string()'; // default
        }

        // Apply validations
        validations.forEach(validation => {
            if (field?.[validation]) {
                switch (validation) {
                    case 'min':
                    case 'max':
                    case 'minLength':
                    case 'maxLength':
                        schema += `.${validation}(${field[validation]})`;
                        break;
                    case 'positive':
                        schema += '.positive()';
                        break;
                    case 'negative':
                        schema += '.negative()';
                        break;
                    case 'int':
                        schema += '.int()';
                        break;
                    case 'finite':
                        schema += '.finite()';
                        break;
                    case 'email':
                        schema += '.email()';
                        break;
                    case 'url':
                        schema += '.url()';
                        break;
                    case 'uuid':
                        schema += '.uuid()';
                        break;
                    case 'regex':
                        schema += `.regex(/${field[validation]}/)`;
                        break;
                    case 'startsWith':
                        schema += `.startsWith('${field[validation]}')`;
                        break;
                    case 'endsWith':
                        schema += `.endsWith('${field[validation]}')`;
                        break;
                    case 'includes':
                        schema += `.includes('${field[validation]}')`;
                        break;
                    case 'minDate':
                    case 'maxDate':
                        schema += `.${validation === 'minDate' ? 'min' : 'max'}(new Date('${field[validation]}'))`;
                        break;
                }
            }
        });

        return schema;
    };

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center"
                            size={'icon'}
                        >
                            <Shield className="w-4 h-4" />
                            <span className="sr-only">{t('validation')}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                    {t('openValidationSettings')}
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-96" align="end" side="bottom">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Tabs defaultValue="validations">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="validations">
                                    {t('validations')}
                                </TabsTrigger>
                                <TabsTrigger value="zod">
                                    Zod Schema
                                </TabsTrigger>
                                <TabsTrigger value="preview">
                                    {t('preview')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="validations" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('setValidationsForFormField')}
                                </p>
                                

                                <Separator orientation="horizontal" />

                                {/* Type-specific validations */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium">{t('typeSpecificValidations')}</h4>
                                    <div className="grid gap-3">
                                        {getValidationOptions()
                                            .filter(validation => !['optional'].includes(validation))
                                            .filter(shouldShowValidation)
                                            .map((validation) => (
                                                <div
                                                    key={`${validation}-${index}`}
                                                    className="flex items-center gap-4"
                                                >
                                                    <Label htmlFor={`${validation}-${index}`} className="w-24">
                                                        {toInitCap(t(validation))}
                                                    </Label>
                                                    <div className="flex-1">
                                                        {renderValidationField(validation)}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="zod" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('generatedZodSchema')}
                                </p>
                                <div className="bg-muted p-3 rounded-md">
                                    <pre className="text-xs overflow-x-auto">
                                        <code>{generateZodSchema()}</code>
                                    </pre>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generateZodSchema());
                                        }}
                                    >
                                        {t('copyToClipboard')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('validationPreview')}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{t('activeValidations')}:</span>
                                    </div>
                                    <div className="space-y-1">
                                        {/* Show validation key if present */}
                                        {field?.validation?.key && (
                                            <div className="text-xs text-muted-foreground ml-6">
                                                • <span className="font-medium">{t('validationKey')}:</span> {field.validation.key}
                                            </div>
                                        )}
                                        
                                        {getValidationOptions()
                                            .filter(validation => field?.[validation])
                                            .map((validation) => (
                                                <div key={validation} className="text-xs text-muted-foreground ml-6">
                                                    • {toInitCap(t(validation))}
                                                    {field[validation] !== true && field[validation] !== false && 
                                                        `: ${field[validation]}`
                                                    }
                                                </div>
                                            ))}
                                        {getValidationOptions().filter(validation => field?.[validation]).length === 0 && 
                                         !field?.validation?.key && (
                                            <div className="text-xs text-muted-foreground ml-6">
                                                {t('noValidationsSet')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
} 