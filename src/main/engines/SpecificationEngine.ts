// engines/SpecificationEngine.ts
import { join } from 'node:path'
import type { DeleteConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ensureDirectoryExists } from '../helpers'
import type { BaseEngine } from '../interfaces'
import type { NextConfigData, ProjectData, SpecificationConfigData } from '../types'
import { NextjsEngine } from './NextjsEngine'

/**
 * Sub-pastas criadas dentro do basePath de um projeto Specification.
 * - docs:       documentos markdown (Documents tab)
 * - kb:         materiais originais + .md convertidos pelo MarkItDown
 * - vectors:    storage do LanceDB (collection por projeto)
 * - chats:      histórico de sessões do AIAssistant (Docs + Prototype)
 * - prototype:  app Next.js gerado/iterado pelo Prototype builder
 *               (criado via NextjsEngine.createProject — ver createProject)
 */
export const SPEC_SUBDIRS = {
    docs: 'docs',
    kb: 'kb',
    vectors: 'vectors',
    chats: 'chats',
    prototype: 'prototype'
} as const

/**
 * Engine para o tipo de projeto `specification`.
 *
 * Não temos (ainda) uma lib `@igrp/igrp-studio-specification-engine` dedicada.
 * Reutilizamos o `NextjsEngine.createProject` para fazer scaffold do app
 * Next.js que serve de **prototype output** dentro de `<basePath>/prototype/`.
 * O resto da estrutura (docs, kb, vectors, chats) é gerido por handlers
 * `spec:*` deste módulo (ver IMPLEMENTATION_PLAN.md §5).
 */
export class SpecificationEngine implements BaseEngine {
    private readonly nextEngine: NextjsEngine

    constructor(nextEngine: NextjsEngine = new NextjsEngine()) {
        this.nextEngine = nextEngine
    }

    async createProject(project: ProjectData, basePath: string): Promise<void> {
        await ensureDirectoryExists(basePath)

        await Promise.all([
            ensureDirectoryExists(join(basePath, SPEC_SUBDIRS.docs)),
            ensureDirectoryExists(join(basePath, SPEC_SUBDIRS.kb)),
            ensureDirectoryExists(join(basePath, SPEC_SUBDIRS.vectors)),
            ensureDirectoryExists(join(basePath, SPEC_SUBDIRS.chats))
        ])

        // O protótipo gerado é um app Next.js — delegamos no NextjsEngine
        // para o scaffold inicial. Iterações posteriores são feitas pelo
        // PrototypeGeneratorService aplicando file ops sobre esta pasta.
        //
        // O lib `@igrp/igrp-studio-nextjs-engine` (newApp) só conhece os campos
        // de NextConfigData. Strip dos extras de Specification (defaultLLM,
        // embeddings, systemPrompt) até existir um engine próprio.
        const prototypePath = join(basePath, SPEC_SUBDIRS.prototype)
        await this.nextEngine.createProject(
            {
                ...project,
                framework: 'nextjs',
                config: toNextConfig(project.config as SpecificationConfigData)
            },
            prototypePath
        )
    }

    async delete(config: DeleteConfig, basePath: string): Promise<void> {
        // Operações de delete específicas do Specification (docs, kb items,
        // chats, snapshots) são feitas via handlers `spec:*`. Para elementos
        // dentro do protótipo Next.js, delegamos no NextjsEngine.
        const prototypePath = join(basePath, SPEC_SUBDIRS.prototype)
        await this.nextEngine.delete(config, prototypePath)
    }

    async duplicate(config: any, basePath: string): Promise<void> {
        const prototypePath = join(basePath, SPEC_SUBDIRS.prototype)
        await this.nextEngine.duplicate(config, prototypePath)
    }

    /**
     * Acesso ao engine subjacente para operações avançadas sobre o protótipo
     * (createPage, registry, getComponents, etc.) sem duplicar código.
     */
    getPrototypeEngine(): NextjsEngine {
        return this.nextEngine
    }
}

/**
 * Reduz uma `SpecificationConfigData` aos campos suportados por `NextConfigData`
 * (o lib `@igrp/igrp-studio-nextjs-engine` rejeita/ignora campos extra como
 * `defaultLLM`, `embeddings`, `systemPrompt`). Remover quando existir um engine
 * próprio para Specification.
 */
function toNextConfig(config: SpecificationConfigData): NextConfigData {
    return {
        name: config.name,
        description: config.description,
        workspaceId: config.workspaceId,
        id: config.id,
        version: config.version
    }
}

