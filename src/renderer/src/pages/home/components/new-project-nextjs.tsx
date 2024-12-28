import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useEffect, useState } from 'react'
import { AppConfig } from '@igrp/nextjs-engine/dist/interfaces/types'
import { setConfig, setBasePath, navigateToNextPage } from '@renderer/redux/thunks'
import { useDispatch } from 'react-redux'
import useToast from '../../../components/useToast'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConfigOptions } from 'src/main/types'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { PlusCircle } from 'lucide-react'

const initialValues: AppConfig = {
  type: ENV_TYPES.NEXTJS,
  appName: ''
}

const FormNewProjectNextJS = (): JSX.Element => {
  const navigate = useNavigate()
  const dispatch: any = useDispatch()
  const { showErrorToast } = useToast()
  const { t } = useTranslation()

  const [filePath, setFilePath] = useState<string>('')

  const validationSchema = Yup.object({
    appName: Yup.string()
      .required(t('thisFieldRequired', { name: 'Name' }))
      .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
      .max(20, t('maxLengthExceeded', { max: 20 }))
  })

  const validation: any = useFormik({
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
      const { error } = await window.api.createAppNext(validation.values, filePath)

      if (error) {
        showErrorToast(error)
        return
      }

      const config: ConfigOptions = {
        type: validation.values.type,
        name: validation.values.appName
      }

      dispatch(setBasePath(filePath))
      dispatch(setConfig(config))
      navigateToNextPage(navigate, config)
    } catch (error) {
      showErrorToast(error)
    }
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          validation.handleSubmit()
        }}
      >
        {' '}
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="appName">
              Project Name
            </Label>
            <Input
              id="appName"
              placeholder="Enter project name"
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.appName || ''}
              className="bg-background text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Buttons */}
          <Button variant="default" type="submit" className="w-full mt-6">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </form>
    </>
  )
}

export default FormNewProjectNextJS
