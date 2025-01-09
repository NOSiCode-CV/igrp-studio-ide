// engines/EngineFactory.ts
import { DotNetEngine } from './DotNetEngine';
import { BaseEngine } from './BaseEngine';
import { SpringEngine } from './SpringEngine';

export class EngineFactory {
  static getEngine(type: string): BaseEngine {
    switch (type.toLowerCase()) {
      case 'spring':
        return new SpringEngine();
      case 'dotnet':
        return new DotNetEngine();
      default:
        throw new Error(`Unsupported engine type: ${type}`);
    }
  }
}