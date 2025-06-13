export const toolConfig = [
    {
      name: 'Node.js',
      command: 'node',
      link: 'https://nodejs.org/en/download',
      required: true,
      versionCheck: {
        minMajor: 18,
        maxMajor: 22,
      },
    },
    {
      name: 'npm',
      command: 'npm',
      link: 'https://nodejs.org/en/download',
      required: true,
    },
    {
      name: 'pnpm',
      command: 'pnpm',
      link: 'https://pnpm.io/installation',
      required: false,
    },
    {
      name: 'yarn',
      command: 'yarn',
      link: 'https://classic.yarnpkg.com/en/docs/install',
      required: false,
    },
    {
      name: 'Java',
      command: 'java',
      link: 'https://adoptium.net/',
      required: true,
    },
    {
      name: 'Maven',
      command: 'mvn',
      link: 'https://maven.apache.org/download.cgi',
      required: true,
    },
    {
      name: 'Docker',
      command: 'docker',
      link: 'https://docs.docker.com/get-docker/',
      required: true,
      extraCheck: 'dockerDaemon',
    },
    {
      name: 'Git',
      command: 'git',
      link: 'https://git-scm.com/downloads',
      required: true,
    },
  ];
  