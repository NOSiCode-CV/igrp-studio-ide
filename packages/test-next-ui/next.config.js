/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        swcMinify: true,
    },
    swcMinify: true,
    transpilePackages: ['@igrp/framework-next-ui'],
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@igrp/framework-next-ui': require.resolve(
                '@igrp/framework-next-ui'
            ),
        };
        return config;
    },
};

export default nextConfig;
