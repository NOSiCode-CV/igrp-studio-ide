export const STEPS = [
    { id: 1, label: 'projectInfo' },
    { id: 2, label: 'framework' },
    { id: 3, label: 'configure' },
    { id: 4, label: 'summary' },
];

export const THEME_COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'Slate', value: '#64748b' }, // Dark grayish-blue
    { name: 'Indigo', value: '#6366f1' }, // Deep bluish-purple
    { name: 'Blue', value: '#3b82f6' }, // Bright blue
    { name: 'Cyan', value: '#06b6d4' }, // Blue-green
    { name: 'Teal', value: '#14b8a6' }, // Greenish-blue
    { name: 'Green', value: '#22c55e' }, // Bright green
    { name: 'Yellow', value: '#facc15' }, // Bright yellow
    { name: 'Orange', value: '#f97316' }, // Bright orange
    { name: 'Red', value: '#ef4444' }, // Vivid red
    { name: 'Pink', value: '#ec4899' }, // Vibrant pink
    { name: 'Purple', value: '#a855f7' }, // Bright purple
];

export const frontendFrameworks = [
    {
        id: 'nextjs',
        name: 'NextJs',
        description: 'The React Framework for production',
        icon: '/placeholder.svg?height=40&width=40',
        stars: '164K',
        views: '5.6K',
        availableSupport: true,
    },
    {
        id: 'vuejs',
        name: 'Vue',
        description: 'Progressive Framework for Web Development',
        icon: '/placeholder.svg?height=40&width=40',
        stars: '91K',
        views: '4K',
        availableSupport: false,
    },
    {
        id: 'angular',
        name: 'Angular',
        description: 'Enterprise Ready Web Framework',
        icon: '/placeholder.svg?height=40&width=40',
        stars: '87K',
        views: '4.7K',
        availableSupport: false,
    },
];

export const backendFrameworks = [
    {
        id: 'springboot',
        name: 'Spring Boot',
        description: 'The Java-Based Framework',
        icon: '/placeholder.svg?height=40&width=40',
        stars: '75K',
        views: '1.3K',
        availableSupport: true,
    },
    {
        id: 'dotnet',
        name: '.NET',
        description: 'Cross Platform Framework',
        icon: '/placeholder.svg?height=40&width=40',
        stars: '74K',
        views: '2K',
        availableSupport: false,
    },
    {
        id: 'django',
        name: 'Django',
        description: 'Rapid Web Development Python Framework',
        icon: '/placeholder.svg?height=40&width=40',
        stars: '72K',
        views: '2.3K',
        availableSupport: false,
    },
    {
        id: 'go',
        name: 'Go',
        description: 'Go Programming Language',
        icon: '/placeholder.svg?height=40&width=40',
        stars: '72K',
        views: '2.3K',
        availableSupport: false,
    },
];
