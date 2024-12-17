import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useEffect, useState } from 'react'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { useDispatch } from 'react-redux'
import useToast from '../../../components/useToast'
import { setConfig, setBasePath, navigateToNextPage } from '@renderer/redux/thunks'
import { useTranslation } from 'react-i18next'
import { ConfigOptions } from 'src/main/types'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { BaseApiConfig } from '@igrp/spring-engine/dist/interfaces/types'
import { PlusCircle } from 'lucide-react'

const DatabaseOptions = [
  { value: 'Postgresql', label: 'PostgreSQL' },
  { value: 'Oracle', label: 'Oracle' },
  { value: 'MySQL', label: 'MySQL' }
]

const projectStructureStyle = [
  { value: 'technical', label: 'Technical' },
  { value: 'domain', label: 'Domain' }
]

const initialValues: BaseApiConfig = {
  type: ENV_TYPES.SPRING,
  apiName: '',
  group: '',
  description: '',
  artifact: '',
  database: 'Postgresql',
  projectStructureStyle: 'technical',
  enableObservability: false,
  igrpCoreVersion: ''
}

const FormNewProjectSpring = (): JSX.Element => {
  const navigate = useNavigate()
  const dispatch: any = useDispatch()
  const { showErrorToast } = useToast()
  const { t } = useTranslation()

  const [filePath, setFilePath] = useState<string>('')

  const validationSchema = Yup.object({
    apiName: Yup.string()
      .required(t('thisFieldRequired', { name: 'Name' }))
      .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
      .max(20, t('maxLengthExceeded', { max: 20 })),
    group: Yup.string().required(t('fieldRequired', { name: 'Group' })),
    artifact: Yup.string().required(t('fieldRequired', { name: 'Artifact' })),
    database: Yup.object().shape({
      value: Yup.string().required(t('fieldRequired', { name: 'Database selection' }))
    })
  })

  const formik: any = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: (_values, actions) => {
      actions.setSubmitting(false)
      setFilePath('')
      handleOpenDirectory()
    }
  })

  const handleOpenDirectory = async (): Promise<void> => {
    window.electron.ipcRenderer.send('open-directory-dialog')

    window.electron.ipcRenderer.on('file-content', (_e, result) => {
      if (!result.canceled) {
        setFilePath(result.filePaths[0])
      }
    })
  }

  useEffect(() => {
    if (filePath) {
      createProject()
    }
  }, [filePath])

  const createProject = async (): Promise<void> => {
    try {
      const formData = {
        ...formik.values,
        database: formik.values.database ? formik.values.database['value'] : ''
      }

      const config: ConfigOptions = {
        type: formData.type,
        name: formData.name,
        group: formData.group,
        description: formData.description,
        artifact: formData.artifact,
        database: formData.database,
        projectStructureStyle: formData.projectStructureStyle
      }

      const { error } = await window.api.createApi(formData, filePath)

      if (error) {
        showErrorToast(error)
        return
      }

      dispatch(setBasePath(filePath))
      dispatch(setConfig(config))
      navigateToNextPage(navigate, config)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const PackageName = () => {
    return (
      <>
        {formik.values.group && (
          <p className="w-full text-sm font-medium italic -mt-2">
            {`Package Name: ${formik.values.group.replace(/[-\s]/g, '_')}.${formik.values.artifact.replace(/[-\s]/g, '_')}`}
          </p>
        )}
      </>
    )
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        formik.handleSubmit()
      }}
    >
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="apiName" className="text-muted-foreground">
            {t('nameOfProject')}
          </Label>
          <Input
            type="text"
            id="apiName"
            placeholder="Name of the project"
            className={`w-full p-2 border rounded-md ${formik.touched.apiName && formik.errors.apiName ? 'border-red-500' : 'border-gray-300'}`}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.apiName || ''}
          />
          {formik.touched.apiName && formik.errors.apiName ? (
            <p className="text-sm text-red-500">{formik.errors.apiName}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-muted-foreground">
            {t('description')}
          </Label>
          <textarea
            id="description"
            rows={3}
            className="w-full p-2 border rounded-md"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.description || ''}
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="group" className="text-muted-foreground">
              {t('group')}
            </Label>
            <Input
              type="text"
              id="group"
              placeholder="Group"
              className={`w-full p-2 rounded-md ${formik.touched.group && formik.errors.group ? 'border-red-500' : 'border-gray-300'}`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.group || ''}
            />
            {formik.touched.group && formik.errors.group ? (
              <p className="text-sm text-red-500">{formik.errors.group}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="artifact" className="text-muted-foreground">
              {t('artifact')}
            </Label>
            <Input
              type="text"
              id="artifact"
              placeholder="Artifact"
              className={`w-full p-2 border rounded-md ${formik.touched.artifact && formik.errors.artifact ? 'border-red-500' : 'border-gray-300'}`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.artifact || ''}
            />
            {formik.touched.artifact && formik.errors.artifact ? (
              <p className="text-sm text-red-500">{formik.errors.artifact}</p>
            ) : null}
          </div>
          <PackageName />
        </div>

        <div className="space-y-2">
          <Label htmlFor="database" className="text-muted-foreground">
            {t('database')}
          </Label>
          <Select
            id="database"
            options={DatabaseOptions}
            onChange={(option) => formik.setFieldValue('database', option)}
            onBlur={() => formik.setFieldTouched('database', true)}
            value={formik.values.database}
            className={`w-full ${formik.touched.database && formik.errors.database ? 'border-red-500' : 'border-gray-300'}`}
          />
          {formik.touched.database && formik.errors.database?.value ? (
            <p className="text-sm text-red-500">{formik.errors.database.value}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Configuration</Label>
        </div>
        <div className="space-y-3">
          <Label htmlFor="projectStructureStyle" className="text-muted-foreground">
            {t('Project Structure Style')}
          </Label>
          <RadioGroup
            defaultValue="technical"
            className="flex flex-col"
            value={formik.values.projectStructureStyle}
            onValueChange={(value) => formik.setFieldValue('projectStructureStyle', value)}
          >
            {projectStructureStyle.map((style) => (
              <div key={style.value} className="flex items-center space-x-2">
                <RadioGroupItem value={style.value} id={style.value} />
                <Label htmlFor={style.value} className="text-muted-foreground">
                  {style.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="enableObservability"
            onCheckedChange={(checked) => formik.setFieldValue('enableObservability', checked)}
            checked={formik.values.enableObservability}
          />
          <Label htmlFor="enableObservability" className="text-muted-foreground">
            {t('Enable Observability')}
          </Label>
        </div>

        <Button variant="default" type="submit" className="w-full mt-6">
          <PlusCircle className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>
    </form>
  )
}

export default FormNewProjectSpring
