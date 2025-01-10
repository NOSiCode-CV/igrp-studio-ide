// engines/EngineFactory.ts
import { BaseEngine } from '../interfaces'
import { DotNetEngine } from './DotNetEngine';
import { SpringEngine } from './SpringEngine';

export class EngineFactory {
  static getEngine(type: string): BaseEngine {
    switch (type) {
      case 'baseApi':
        return new SpringEngine();
      case "dotnet":
        return new DotNetEngine();
      default:
        throw new Error(`Unsupported engine type: ${type}`);
    }
  }
}