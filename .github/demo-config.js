/**
 * Unified demo configuration
 * Replaces .github/demo-config.json with a TypeScript configuration
 */
export const demoConfig = {
    examples: {
        exclude: ['github'],
        order: ['hive', 'pokemon'],
        minimumPolenVersion: '0.9.0',
    },
    deployment: {
        basePaths: {
            '/latest/': 'Stable releases',
            '/next/': 'Next/beta releases',
        },
        redirects: [
            {
                from: 'pokemon',
                to: '/latest/pokemon/',
            },
            {
                from: 'star-wars',
                to: '/latest/star-wars/',
            },
        ],
        gc: {
            retainStableVersions: true,
            retainCurrentCycle: true,
            retainDays: 30,
        },
    },
    ui: {
        theme: {
            primaryColor: '#000',
            backgroundColor: '#fff',
            textColor: '#000',
            mutedTextColor: '#666',
        },
        branding: {
            title: 'Polen Demos',
            description: 'Interactive GraphQL API documentation',
        },
    },
    metadata: {
        disabledDemos: {
            github: {
                title: 'GitHub API',
                description: "Browse GitHub's extensive GraphQL API with over 1600 types.",
                reason: 'Currently disabled due to build performance.',
            },
        },
    },
};
export default demoConfig;
//# sourceMappingURL=demo-config.js.map