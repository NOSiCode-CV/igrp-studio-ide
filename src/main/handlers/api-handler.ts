// handlers/apiHandler.ts
import { EngineFactory } from '../engines/EngineFactory'
import { handleWithCustomErrors } from '../helpers'

import { engineTypes } from '@igrp/igrp-studio-springboot-engine'

import { ipcMain } from 'electron'
import { ProjectData } from '../types'
import {
  ComponentRegistrationConfig,
  PageConfig,
  ProcessConfig,
  ProcessStepConfig
} from '@igrp/igrp-studio-nextjs-engine/types'
import { EVENTS } from '../constants/events'

handleWithCustomErrors(
  EVENTS.ENGINE.CREATE_PROJECT,
  async (_event, project: ProjectData, basePath: string) => {
    const engine = EngineFactory.getEngine(project.framework)
    await engine.createProject(project, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.SPRING.CREATE_ENUM,
  async (_event, config: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createEnum?.(config, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.SPRING.CREATE_RESPONSE,
  async (_event, response: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createResponse?.(response, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.SPRING.CREATE_MODULE,
  async (_event, moduleConfig: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createModule?.(moduleConfig, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.SPRING.CREATE_MODEL,
  async (_event, modelConfig: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createModel?.(modelConfig, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.SPRING.CREATE_DTO,
  async (_event, dtoConfig: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createDto?.(dtoConfig, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.SPRING.CREATE_CONTROLLER,
  async (_event, controllerConfig: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createController?.(controllerConfig, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.ENGINE.DELETE_ELEMENT,
  async (_event, config: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.delete(config, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.ENGINE.DUPLICATE_ELEMENT,
  async (_event, config: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.duplicate(config, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.ENGINE.SERIALIZE_ELEMENT,
  async (_event, config: any, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.serializeElement?.(config, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.NEXT.CREATE_PAGE,
  async (_event, pageConfig: PageConfig, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createPage?.(pageConfig, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.NEXT.DELETE_PAGE,
  async (_event, pageConfig: PageConfig, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.delete?.(pageConfig, basePath)
  }
)

handleWithCustomErrors(EVENTS.NEXT.REGISTRY_COMPONENT, async (_event, engineType: string) => {
  const engine = EngineFactory.getEngine(engineType)
  await engine.registry?.()
})

handleWithCustomErrors(EVENTS.NEXT.GET_COMPONENT, async (_event, engineType: string) => {
  const engine = EngineFactory.getEngine(engineType)
  const data = engine.getComponents?.()
  return data
})

handleWithCustomErrors(EVENTS.NEXT.GET_SERVICE, async (_event, engineType: string) => {
  const engine = EngineFactory.getEngine(engineType)
  const data = engine.getServices?.()
  return data
})

handleWithCustomErrors(EVENTS.ENGINE.GET_DEPENDENCIES, async (_event, engineType: string) => {
  const engine = EngineFactory.getEngine(engineType)
  const data = engine.getDependencies?.()
  return data
})

handleWithCustomErrors(EVENTS.NEXT.GET_CODE_SNIPPET, async (_event, engineType: string) => {
  const engine = EngineFactory.getEngine(engineType)
  const data = engine.getCodeSnippets?.()
  return data
})

handleWithCustomErrors(
  EVENTS.NEXT.LOAD_METADATA,
  async (_event, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    return engine.getAppMetadata?.(basePath)
  }
)

handleWithCustomErrors(
  EVENTS.NEXT.REGISTER_COMPONENT,
  async (_event, engineType: string, config: ComponentRegistrationConfig) => {
    const engine = EngineFactory.getEngine(engineType)
    return engine.registerComponent?.(config)
  }
)

handleWithCustomErrors(
  EVENTS.NEXT.CREATE_PROCESS,
  async (_event, process: ProcessConfig, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createProcess?.(process, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.NEXT.CREATE_PROCESS_STEP,
  async (_event, step: ProcessStepConfig, engineType: string, basePath: string) => {
    const engine = EngineFactory.getEngine(engineType)
    await engine.createProcessStep?.(step, basePath)
  }
)

ipcMain.handle(EVENTS.SPRING.FETCH_SELECTORS, async (_event, module: string, basePath: string) => {
  return await engineTypes(module, basePath)
})
