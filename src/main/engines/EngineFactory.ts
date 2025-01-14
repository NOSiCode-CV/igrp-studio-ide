// engines/EngineFactory.ts
import { BaseEngine } from '../interfaces';
// import { ENV_TYPES } from '../types';
import { DotNetEngine } from './DotNetEngine';
import { SpringEngine } from './SpringEngine';

export enum ENV_TYPES {
  NEXTJS = "baseApp",
  SPRING = "baseApi",
  DOTNET = "dotnet"
};

export class EngineFactory {
  static getEngine(type: string): BaseEngine {
    switch (type.toLowerCase()) {
      case ENV_TYPES.SPRING:
        return new SpringEngine();
      case ENV_TYPES.DOTNET:
        return new DotNetEngine();
      default:
        throw new Error(`Unsupported engine type: ${type}`);
    }
  }
}