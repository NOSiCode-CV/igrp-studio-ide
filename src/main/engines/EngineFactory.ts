// engines/EngineFactory.ts
import type { BaseEngine } from '../interfaces'
import { DotNetEngine } from './DotNetEngine'
import { NextjsEngine } from './NextjsEngine'
import { SpecificationEngine } from './SpecificationEngine'
import { SpringEngine } from './SpringEngine'

export enum ENV_TYPES {
    NEXTJS = 'baseApp',
    SPRING = 'baseApi',
    DOTNET = 'dotnet',
    SPECIFICATION = 'baseSpec'
}

export class EngineFactory {
    static getEngine(type: string): BaseEngine {
        switch (type) {
            case 'springboot':
                return new SpringEngine()
            case 'dotnet':
                return new DotNetEngine()
            case 'nextjs':
                return new NextjsEngine()
            case 'specification':
                return new SpecificationEngine()
            default:
                throw new Error(`Unsupported engine type: ${type}`)
        }
    }
}
