// Example: Spring Engine Changelog
const springEngineChangelog = {
  title: "What's New in IGRP Spring Engine",
  version: '0.1.0-beta.1',
  date: 'July 18, 2025',
  sections: [
    {
      title: '🚀 Added',
      items: [
        '.env.example file to project root as environment variables template',
        'Serves as a base reference for developers to create their own .env file',
        'Note: This does not affect existing projects — only new ones will include this file automatically',
        'Updated .gitignore and .dockerignore to ignore .env (avoid leaking secrets)',
        'Include .env.example in version control (template is tracked and shared)'
      ]
    },
    {
      title: '🔧 Changed - Project Structure Refactoring',
      items: [
        'Major restructuring following clean architecture and Domain-Driven Design (DDD) principles',
        'Clear separation between persistence and business logic layers',
        'Simplified folder structure to enhance readability and maintainability',
        'Provide clean starting point for developers to define business logic manually'
      ]
    },
    {
      title: '⚙️ Configuration Changes',
      items: [
        'Removed springBootVersion field from .igrpstudio/baseApi.json',
        'Renamed igrpCoreVersion to version and set to 0.1.0-beta.1',
        'Added IGRP version property (0.1.0-beta.1) to pom.xml',
        'Updated Java version to 23 with Spring Cloud 2025.0.0',
        'Integrated SpringDoc OpenAPI UI v2.8.9'
      ]
    },
    {
      title: '🏗️ Architecture Layer Changes',
      items: [
        'Domain Layer: Redefined for pure business logic implementation',
        'Persistence Layer: Entities moved to persistence/entity with Entity suffix',
        'Application Layer: Simplified commands/queries structure',
        'Interface Layer: Controllers moved to interfaces/rest'
      ]
    },
    {
      title: '📁 Directory Structure Changes',
      items: [
        'Before: application/commands/commands/ + application/commands/handlers/',
        'After: application/commands/ (direct structure)',
        'Before: domain/model/<Entity.java>',
        'After: persistence/entity/<EntityEntity.java>',
        'Before: infrastructure/controller/',
        'After: interfaces/rest/'
      ]
    }
  ]
}

// Example: Next.js Engine Changelog
const nextjsEngineChangelog = {
  title: "What's New in IGRP Next.js Template",
  version: '0.1.0-beta.1',
  date: 'July 18, 2025',
  sections: [
    {
      title: '🚀 New Features',
      items: [
        'Enhanced IGRP Framework Next.js integration',
        'Improved authentication session management',
        'Better menu loading and navigation system',
        'Streamlined project structure for better developer experience',
        'Enhanced component library integration'
      ]
    },
    {
      title: '🔧 Template Simplification',
      items: [
        'Removed locale folder structure (src/app/[locale])',
        'Moved content up one level for cleaner routing',
        'Eliminated static code and boilerplate',
        'Simplified project structure for faster development',
        'Cleaner, more maintainable codebase'
      ]
    },
    {
      title: '📦 New Dependencies',
      items: [
        '@igrp/framework-next: latest',
        '@igrp/framework-next-types: latest',
        '@igrp/framework-next-ui: latest',
        'Enhanced type safety with framework types',
        'Improved UI components and design system'
      ]
    },
    {
      title: '🏗️ Architecture Improvements',
      items: [
        'Resolved menu loading issues and performance',
        'Enhanced authentication session handling',
        'Better state management and data flow',
        'Improved error handling and user feedback',
        'Optimized bundle size and loading times'
      ]
    },
    {
      title: '📁 Directory Structure Changes',
      items: [
        'Before: src/app/[locale]/(igrp)/(generated)',
        'After: src/app/(igrp)/(generated)',
        'Removed: src/app/[locale] folder structure',
        'Simplified: Direct routing without locale complexity',
        'Cleaner: Reduced nesting and improved maintainability'
      ]
    }
  ]
}

// Export the changelog content for use in other components
export { springEngineChangelog, nextjsEngineChangelog }
