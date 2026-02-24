export interface ToolConfig {
  name: string
  command: string
  link: string
  required: boolean
  versionCheck?: {
    minMajor: number
    maxMajor: number
    range?: string
  }
  extraCheck?: string
  category: 'frontend' | 'backend' | 'development'
  description?: string
}

export const toolConfig: ToolConfig[] = [
  // Frontend Development Tools
  {
    name: 'Node.js',
    command: 'node',
    link: 'https://nodejs.org/en/download',
    required: true,
    category: 'frontend',
    description: 'JavaScript runtime for frontend development',
    versionCheck: {
      minMajor: 20,
      maxMajor: 22,
      range: '^20.19.0 || >=22.12.0'
    }
  },
  {
    name: 'npm',
    command: 'npm',
    link: 'https://nodejs.org/en/download',
    required: true,
    category: 'frontend',
    description: 'Node.js package manager'
  },
  {
    name: 'pnpm',
    command: 'pnpm',
    link: 'https://pnpm.io/installation',
    required: false,
    category: 'frontend',
    description: 'Fast, disk space efficient package manager'
  },
  {
    name: 'yarn',
    command: 'yarn',
    link: 'https://classic.yarnpkg.com/en/docs/install',
    required: false,
    category: 'frontend',
    description: 'Alternative package manager for Node.js'
  },

  // Backend Development Tools
  {
    name: 'Java',
    command: 'java',
    link: 'https://www.oracle.com/in/java/technologies/downloads/',
    required: true,
    category: 'backend',
    description: 'Java runtime for backend development',
    versionCheck: {
      minMajor: 23,
      maxMajor: 24,
      range: '^23.0.0 || >=24.0.0'
    }
  },
  // Development Infrastructure Tools
  {
    name: 'Docker',
    command: 'docker',
    link: 'https://docs.docker.com/get-docker/',
    required: true,
    category: 'development',
    description: 'Containerization platform for development',
    extraCheck: 'dockerDaemon'
  },
  {
    name: 'Git',
    command: 'git',
    link: 'https://git-scm.com/downloads',
    required: true,
    category: 'development',
    description: 'Version control system'
  }
]

export const categoryConfig = {
  frontend: {
    title: 'Frontend Development',
    description:
      'Tools required for frontend development with React, Next.js, and modern web technologies',
    icon: '🌐'
  },
  backend: {
    title: 'Backend Development',
    description: 'Tools required for backend development with Java, Spring Boot, and .NET',
    icon: '⚙️'
  },
  development: {
    title: 'Development Infrastructure',
    description: 'Essential development tools and infrastructure requirements',
    icon: '🛠️'
  }
}
