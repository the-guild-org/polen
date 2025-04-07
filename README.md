# Repro

## To Run

1. `pnpm i`
2. `pnpm build`
3. `cd examples/github-developer-portal`
4. `pnpm build`
5. `pnpm preview

## Build Output

<details>
<summary>Click to expand!</summary>

```shell
vite:config config file loaded in 137.91ms +0ms
  vite:env loading env files: [
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.local',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.production',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.production.local'
  vite:env ] +0ms
  vite:env env files loaded in 0.30ms +0ms
  vite:env using resolved env: {} +1ms
  vite:config using resolved config: {
  vite:config   plugins: [
  vite:config     'vite:build-metadata',
  vite:config     'vite:watch-package-data',
  vite:config     'alias',
  vite:config     'vite:react-babel',
  vite:config     'vite:react-refresh',
  vite:config     'vite:modulepreload-polyfill',
  vite:config     'vite:resolve',
  vite:config     'vite:html-inline-proxy',
  vite:config     'vite:css',
  vite:config     'vite:esbuild',
  vite:config     'vite:json',
  vite:config     'vite:wasm-helper',
  vite:config     'vite:worker',
  vite:config     'vite:asset',
  vite:config     'pollen-build-client',
  vite:config     'pollen-manifest',
  vite:config     'pollen-ssr-build',
  vite:config     'vite:wasm-fallback',
  vite:config     'vite:define',
  vite:config     'vite:css-post',
  vite:config     'vite:build-html',
  vite:config     'vite:worker-import-meta-url',
  vite:config     'vite:asset-import-meta-url',
  vite:config     'vite:force-systemjs-wrap-complete',
  vite:config     'commonjs',
  vite:config     'vite:data-uri',
  vite:config     'vite:rollup-options-plugins',
  vite:config     'vite:dynamic-import-vars',
  vite:config     'vite:import-glob',
  vite:config     'vite:build-import-analysis',
  vite:config     'vite:esbuild-transpile',
  vite:config     'vite:terser',
  vite:config     'vite:manifest',
  vite:config     'vite:ssr-manifest',
  vite:config     'vite:reporter',
  vite:config     'vite:load-fallback'
  vite:config   ],
  vite:config   build: {
  vite:config     target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     polyfillModulePreload: true,
  vite:config     modulePreload: { polyfill: true },
  vite:config     outDir: 'dist',
  vite:config     assetsDir: 'assets',
  vite:config     assetsInlineLimit: 4096,
  vite:config     sourcemap: false,
  vite:config     terserOptions: {},
  vite:config     rollupOptions: { onwarn: [Function: onwarn] },
  vite:config     commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config     dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config     write: true,
  vite:config     emptyOutDir: null,
  vite:config     copyPublicDir: true,
  vite:config     manifest: false,
  vite:config     lib: false,
  vite:config     ssrManifest: false,
  vite:config     ssrEmitAssets: false,
  vite:config     reportCompressedSize: true,
  vite:config     chunkSizeWarningLimit: 500,
  vite:config     watch: null,
  vite:config     cssCodeSplit: true,
  vite:config     minify: 'esbuild',
  vite:config     ssr: false,
  vite:config     emitAssets: false,
  vite:config     createEnvironment: [Function: createEnvironment],
  vite:config     cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     cssMinify: true
  vite:config   },
  vite:config   builder: {
  vite:config     sharedConfigBuild: false,
  vite:config     sharedPlugins: false,
  vite:config     buildApp: [AsyncFunction: defaultBuildApp]
  vite:config   },
  vite:config   esbuild: { jsxDev: false, jsx: 'automatic', jsxImportSource: undefined },
  vite:config   optimizeDeps: {
  vite:config     include: [
  vite:config       'react',
  vite:config       'react-dom',
  vite:config       'react/jsx-dev-runtime',
  vite:config       'react/jsx-runtime'
  vite:config     ],
  vite:config     exclude: [],
  vite:config     needsInterop: [],
  vite:config     extensions: [],
  vite:config     disabled: undefined,
  vite:config     holdUntilCrawlEnd: true,
  vite:config     force: false,
  vite:config     noDiscovery: false,
  vite:config     esbuildOptions: { preserveSymlinks: false, jsx: 'automatic' }
  vite:config   },
  vite:config   resolve: {
  vite:config     externalConditions: [ 'node' ],
  vite:config     extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config     dedupe: [ 'react', 'react-dom' ],
  vite:config     noExternal: [],
  vite:config     external: [],
  vite:config     preserveSymlinks: false,
  vite:config     alias: [
  vite:config       {
  vite:config         find: /^\/?@vite\/env/,
  vite:config         replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config       },
  vite:config       {
  vite:config         find: /^\/?@vite\/client/,
  vite:config         replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config       }
  vite:config     ],
  vite:config     mainFields: [ 'browser', 'module', 'jsnext:main', 'jsnext' ],
  vite:config     conditions: [ 'module', 'browser', 'development|production' ],
  vite:config     builtins: []
  vite:config   },
  vite:config   environments: {
  vite:config     client: {
  vite:config       define: undefined,
  vite:config       resolve: {
  vite:config         externalConditions: [ 'node' ],
  vite:config         extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config         dedupe: [ 'react', 'react-dom' ],
  vite:config         noExternal: [],
  vite:config         external: [],
  vite:config         preserveSymlinks: false,
  vite:config         alias: [
  vite:config           {
  vite:config             find: /^\/?@vite\/env/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config           },
  vite:config           {
  vite:config             find: /^\/?@vite\/client/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config           }
  vite:config         ],
  vite:config         mainFields: [ 'browser', 'module', 'jsnext:main', 'jsnext' ],
  vite:config         conditions: [ 'module', 'browser', 'development|production' ],
  vite:config         builtins: []
  vite:config       },
  vite:config       keepProcessEnv: false,
  vite:config       consumer: 'client',
  vite:config       optimizeDeps: {
  vite:config         include: [
  vite:config           'react',
  vite:config           'react-dom',
  vite:config           'react/jsx-dev-runtime',
  vite:config           'react/jsx-runtime'
  vite:config         ],
  vite:config         exclude: [],
  vite:config         needsInterop: [],
  vite:config         extensions: [],
  vite:config         disabled: undefined,
  vite:config         holdUntilCrawlEnd: true,
  vite:config         force: false,
  vite:config         noDiscovery: false,
  vite:config         esbuildOptions: { preserveSymlinks: false, jsx: 'automatic' }
  vite:config       },
  vite:config       dev: {
  vite:config         warmup: [],
  vite:config         sourcemap: { js: true },
  vite:config         sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config         preTransformRequests: true,
  vite:config         createEnvironment: [Function: defaultCreateClientDevEnvironment],
  vite:config         recoverable: true,
  vite:config         moduleRunnerTransform: false
  vite:config       },
  vite:config       build: {
  vite:config         target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         polyfillModulePreload: true,
  vite:config         modulePreload: { polyfill: true },
  vite:config         outDir: 'dist',
  vite:config         assetsDir: 'assets',
  vite:config         assetsInlineLimit: 4096,
  vite:config         sourcemap: false,
  vite:config         terserOptions: {},
  vite:config         rollupOptions: {
  vite:config           onwarn: [Function: onwarn],
  vite:config           input: [
  vite:config             '/Users/jasonkuhrt/projects/the-guild-org/polen/build/app-template/entry.client.jsx'
  vite:config           ]
  vite:config         },
  vite:config         commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config         dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config         write: true,
  vite:config         emptyOutDir: null,
  vite:config         copyPublicDir: true,
  vite:config         manifest: true,
  vite:config         lib: false,
  vite:config         ssrManifest: false,
  vite:config         ssrEmitAssets: false,
  vite:config         reportCompressedSize: true,
  vite:config         chunkSizeWarningLimit: 500,
  vite:config         watch: null,
  vite:config         cssCodeSplit: true,
  vite:config         minify: false,
  vite:config         ssr: false,
  vite:config         emitAssets: true,
  vite:config         createEnvironment: [Function: createEnvironment],
  vite:config         cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         cssMinify: false
  vite:config       }
  vite:config     },
  vite:config     ssr: {
  vite:config       define: undefined,
  vite:config       resolve: {
  vite:config         externalConditions: [ 'node' ],
  vite:config         extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config         dedupe: [ 'react', 'react-dom' ],
  vite:config         noExternal: [],
  vite:config         external: [],
  vite:config         preserveSymlinks: false,
  vite:config         alias: [
  vite:config           {
  vite:config             find: /^\/?@vite\/env/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config           },
  vite:config           {
  vite:config             find: /^\/?@vite\/client/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config           }
  vite:config         ],
  vite:config         mainFields: [ 'module', 'jsnext:main', 'jsnext' ],
  vite:config         conditions: [ 'module', 'node', 'development|production' ],
  vite:config         builtins: [
  vite:config           '_http_agent',         '_http_client',        '_http_common',
  vite:config           '_http_incoming',      '_http_outgoing',      '_http_server',
  vite:config           '_stream_duplex',      '_stream_passthrough', '_stream_readable',
  vite:config           '_stream_transform',   '_stream_wrap',        '_stream_writable',
  vite:config           '_tls_common',         '_tls_wrap',           'assert',
  vite:config           'assert/strict',       'async_hooks',         'buffer',
  vite:config           'child_process',       'cluster',             'console',
  vite:config           'constants',           'crypto',              'dgram',
  vite:config           'diagnostics_channel', 'dns',                 'dns/promises',
  vite:config           'domain',              'events',              'fs',
  vite:config           'fs/promises',         'http',                'http2',
  vite:config           'https',               'inspector',           'inspector/promises',
  vite:config           'module',              'net',                 'os',
  vite:config           'path',                'path/posix',          'path/win32',
  vite:config           'perf_hooks',          'process',             'punycode',
  vite:config           'querystring',         'readline',            'readline/promises',
  vite:config           'repl',                'stream',              'stream/consumers',
  vite:config           'stream/promises',     'stream/web',          'string_decoder',
  vite:config           'sys',                 'timers',              'timers/promises',
  vite:config           'tls',                 'trace_events',        'tty',
  vite:config           'url',                 'util',                'util/types',
  vite:config           'v8',                  'vm',                  'wasi',
  vite:config           'worker_threads',      'zlib',                /^node:/,
  vite:config           /^npm:/,               /^bun:/
  vite:config         ]
  vite:config       },
  vite:config       keepProcessEnv: true,
  vite:config       consumer: 'server',
  vite:config       optimizeDeps: {
  vite:config         include: [],
  vite:config         exclude: [],
  vite:config         needsInterop: [],
  vite:config         extensions: [],
  vite:config         disabled: undefined,
  vite:config         holdUntilCrawlEnd: true,
  vite:config         force: false,
  vite:config         noDiscovery: true,
  vite:config         esbuildOptions: { preserveSymlinks: false }
  vite:config       },
  vite:config       dev: {
  vite:config         warmup: [],
  vite:config         sourcemap: { js: true },
  vite:config         sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config         preTransformRequests: false,
  vite:config         createEnvironment: [Function: defaultCreateDevEnvironment],
  vite:config         recoverable: false,
  vite:config         moduleRunnerTransform: true
  vite:config       },
  vite:config       build: {
  vite:config         target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         polyfillModulePreload: true,
  vite:config         modulePreload: { polyfill: true },
  vite:config         outDir: 'dist',
  vite:config         assetsDir: 'assets',
  vite:config         assetsInlineLimit: 4096,
  vite:config         sourcemap: false,
  vite:config         terserOptions: {},
  vite:config         rollupOptions: {
  vite:config           onwarn: [Function: onwarn],
  vite:config           input: 'virtual:pollen/server/entry'
  vite:config         },
  vite:config         commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config         dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config         write: true,
  vite:config         emptyOutDir: false,
  vite:config         copyPublicDir: true,
  vite:config         manifest: false,
  vite:config         lib: false,
  vite:config         ssrManifest: false,
  vite:config         ssrEmitAssets: false,
  vite:config         reportCompressedSize: true,
  vite:config         chunkSizeWarningLimit: 500,
  vite:config         watch: null,
  vite:config         cssCodeSplit: true,
  vite:config         minify: false,
  vite:config         ssr: true,
  vite:config         emitAssets: false,
  vite:config         createEnvironment: [Function: createEnvironment],
  vite:config         cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         cssMinify: 'esbuild'
  vite:config       }
  vite:config     }
  vite:config   },
  vite:config   configFile: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/vite.config.ts',
  vite:config   configFileDependencies: [
  vite:config     '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/vite.config.ts'
  vite:config   ],
  vite:config   inlineConfig: {
  vite:config     root: undefined,
  vite:config     base: undefined,
  vite:config     mode: undefined,
  vite:config     configFile: undefined,
  vite:config     configLoader: undefined,
  vite:config     logLevel: undefined,
  vite:config     clearScreen: undefined,
  vite:config     build: {},
  vite:config     builder: {}
  vite:config   },
  vite:config   root: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config   base: '/',
  vite:config   decodedBase: '/',
  vite:config   rawBase: '/',
  vite:config   publicDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/public',
  vite:config   cacheDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.vite',
  vite:config   command: 'build',
  vite:config   mode: 'production',
  vite:config   isWorker: false,
  vite:config   mainConfig: null,
  vite:config   bundleChain: [],
  vite:config   isProduction: true,
  vite:config   css: {
  vite:config     transformer: 'postcss',
  vite:config     preprocessorMaxWorkers: 0,
  vite:config     devSourcemap: false,
  vite:config     lightningcss: undefined
  vite:config   },
  vite:config   json: { namedExports: true, stringify: 'auto' },
  vite:config   server: {
  vite:config     port: 5173,
  vite:config     strictPort: false,
  vite:config     host: undefined,
  vite:config     allowedHosts: [],
  vite:config     https: undefined,
  vite:config     open: false,
  vite:config     proxy: undefined,
  vite:config     cors: {
  vite:config       origin: /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/
  vite:config     },
  vite:config     headers: {},
  vite:config     warmup: { clientFiles: [], ssrFiles: [] },
  vite:config     middlewareMode: false,
  vite:config     fs: {
  vite:config       strict: true,
  vite:config       deny: [ '.env', '.env.*', '*.{crt,pem}', '**/.git/**' ],
  vite:config       allow: [
  vite:config         '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal'
  vite:config       ]
  vite:config     },
  vite:config     preTransformRequests: true,
  vite:config     perEnvironmentStartEndDuringDev: false,
  vite:config     sourcemapIgnoreList: [Function: isInNodeModules$1]
  vite:config   },
  vite:config   preview: {
  vite:config     port: 4173,
  vite:config     strictPort: false,
  vite:config     host: undefined,
  vite:config     allowedHosts: [],
  vite:config     https: undefined,
  vite:config     open: false,
  vite:config     proxy: undefined,
  vite:config     cors: {
  vite:config       origin: /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/
  vite:config     },
  vite:config     headers: {}
  vite:config   },
  vite:config   envDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config   env: { BASE_URL: '/', MODE: 'production', DEV: false, PROD: true },
  vite:config   assetsInclude: [Function: assetsInclude],
  vite:config   logger: {
  vite:config     hasWarned: false,
  vite:config     info: [Function: info],
  vite:config     warn: [Function: warn],
  vite:config     warnOnce: [Function: warnOnce],
  vite:config     error: [Function: error],
  vite:config     clearScreen: [Function: clearScreen],
  vite:config     hasErrorLogged: [Function: hasErrorLogged]
  vite:config   },
  vite:config   packageCache: Map(1) {
  vite:config     'fnpd_/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal' => {
  vite:config       dir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config       data: {
  vite:config         name: 'github-developer-portal',
  vite:config         private: true,
  vite:config         version: '0.0.0',
  vite:config         type: 'module',
  vite:config         scripts: {
  vite:config           dev: 'vite',
  vite:config           'build:client': 'vite build',
  vite:config           'build:server': 'vite build --ssr',
  vite:config           build: 'vite build --app',
  vite:config           preview: 'node dist/entry.js'
  vite:config         },
  vite:config         devDependencies: { typescript: '~5.8.2', vite: '^6.2.4' },
  vite:config         dependencies: { pollen: 'link:../..' }
  vite:config       },
  vite:config       hasSideEffects: [Function: hasSideEffects],
  vite:config       setResolvedCache: [Function: setResolvedCache],
  vite:config       getResolvedCache: [Function: getResolvedCache]
  vite:config     },
  vite:config     set: [Function (anonymous)]
  vite:config   },
  vite:config   worker: { format: 'iife', plugins: '() => plugins', rollupOptions: {} },
  vite:config   appType: 'spa',
  vite:config   experimental: { importGlobRestoreExtension: false, hmrPartialAccept: false },
  vite:config   future: undefined,
  vite:config   ssr: {
  vite:config     target: 'node',
  vite:config     optimizeDeps: {
  vite:config       esbuildOptions: { preserveSymlinks: false },
  vite:config       include: [],
  vite:config       exclude: [],
  vite:config       needsInterop: [],
  vite:config       extensions: [],
  vite:config       holdUntilCrawlEnd: true,
  vite:config       force: false,
  vite:config       noDiscovery: true
  vite:config     },
  vite:config     external: [],
  vite:config     noExternal: [],
  vite:config     resolve: {
  vite:config       conditions: [ 'module', 'node', 'development|production' ],
  vite:config       externalConditions: [ 'node' ]
  vite:config     }
  vite:config   },
  vite:config   dev: {
  vite:config     warmup: [],
  vite:config     sourcemap: { js: true },
  vite:config     sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config     preTransformRequests: false,
  vite:config     createEnvironment: [Function: defaultCreateDevEnvironment],
  vite:config     recoverable: false,
  vite:config     moduleRunnerTransform: false
  vite:config   },
  vite:config   webSocketToken: '69EEauVE7DPy',
  vite:config   getSortedPlugins: [Function: getSortedPlugins],
  vite:config   getSortedPluginHooks: [Function: getSortedPluginHooks],
  vite:config   createResolver: [Function: createResolver],
  vite:config   fsDenyGlob: [Function: arrayMatcher],
  vite:config   safeModulePaths: Set(0) {},
  vite:config   additionalAllowedHosts: []
  vite:config } +33ms
  vite:config config file loaded in 5.47ms +9ms
  vite:env loading env files: [
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.local',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.production',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.production.local'
  vite:env ] +40ms
  vite:env env files loaded in 0.08ms +0ms
  vite:env using resolved env: {} +0ms
  vite:config using resolved config: {
  vite:config   plugins: [
  vite:config     'vite:build-metadata',
  vite:config     'vite:watch-package-data',
  vite:config     'alias',
  vite:config     'vite:react-babel',
  vite:config     'vite:react-refresh',
  vite:config     'vite:modulepreload-polyfill',
  vite:config     'vite:resolve',
  vite:config     'vite:html-inline-proxy',
  vite:config     'vite:css',
  vite:config     'vite:esbuild',
  vite:config     'vite:json',
  vite:config     'vite:wasm-helper',
  vite:config     'vite:worker',
  vite:config     'vite:asset',
  vite:config     'pollen-build-client',
  vite:config     'pollen-manifest',
  vite:config     'pollen-ssr-build',
  vite:config     'vite:wasm-fallback',
  vite:config     'vite:define',
  vite:config     'vite:css-post',
  vite:config     'vite:build-html',
  vite:config     'vite:worker-import-meta-url',
  vite:config     'vite:asset-import-meta-url',
  vite:config     'vite:force-systemjs-wrap-complete',
  vite:config     'commonjs',
  vite:config     'vite:data-uri',
  vite:config     'vite:rollup-options-plugins',
  vite:config     'vite:dynamic-import-vars',
  vite:config     'vite:import-glob',
  vite:config     'vite:build-import-analysis',
  vite:config     'vite:esbuild-transpile',
  vite:config     'vite:terser',
  vite:config     'vite:manifest',
  vite:config     'vite:ssr-manifest',
  vite:config     'vite:reporter',
  vite:config     'vite:load-fallback'
  vite:config   ],
  vite:config   build: {
  vite:config     target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     polyfillModulePreload: true,
  vite:config     modulePreload: { polyfill: true },
  vite:config     outDir: 'dist',
  vite:config     assetsDir: 'assets',
  vite:config     assetsInlineLimit: 4096,
  vite:config     sourcemap: false,
  vite:config     terserOptions: {},
  vite:config     rollupOptions: {
  vite:config       onwarn: [Function: onwarn],
  vite:config       input: [
  vite:config         '/Users/jasonkuhrt/projects/the-guild-org/polen/build/app-template/entry.client.jsx'
  vite:config       ]
  vite:config     },
  vite:config     commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config     dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config     write: true,
  vite:config     emptyOutDir: null,
  vite:config     copyPublicDir: true,
  vite:config     manifest: true,
  vite:config     lib: false,
  vite:config     ssrManifest: false,
  vite:config     ssrEmitAssets: false,
  vite:config     reportCompressedSize: true,
  vite:config     chunkSizeWarningLimit: 500,
  vite:config     watch: null,
  vite:config     cssCodeSplit: true,
  vite:config     minify: false,
  vite:config     ssr: false,
  vite:config     emitAssets: true,
  vite:config     createEnvironment: [Function: createEnvironment],
  vite:config     cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     cssMinify: false
  vite:config   },
  vite:config   builder: {
  vite:config     sharedConfigBuild: false,
  vite:config     sharedPlugins: false,
  vite:config     buildApp: [AsyncFunction: defaultBuildApp]
  vite:config   },
  vite:config   esbuild: { jsxDev: false, jsx: 'automatic', jsxImportSource: undefined },
  vite:config   optimizeDeps: {
  vite:config     include: [
  vite:config       'react',
  vite:config       'react-dom',
  vite:config       'react/jsx-dev-runtime',
  vite:config       'react/jsx-runtime'
  vite:config     ],
  vite:config     exclude: [],
  vite:config     needsInterop: [],
  vite:config     extensions: [],
  vite:config     disabled: undefined,
  vite:config     holdUntilCrawlEnd: true,
  vite:config     force: false,
  vite:config     noDiscovery: false,
  vite:config     esbuildOptions: { preserveSymlinks: false, jsx: 'automatic' }
  vite:config   },
  vite:config   resolve: {
  vite:config     externalConditions: [ 'node' ],
  vite:config     extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config     dedupe: [ 'react', 'react-dom' ],
  vite:config     noExternal: [],
  vite:config     external: [],
  vite:config     preserveSymlinks: false,
  vite:config     alias: [
  vite:config       {
  vite:config         find: /^\/?@vite\/env/,
  vite:config         replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config       },
  vite:config       {
  vite:config         find: /^\/?@vite\/client/,
  vite:config         replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config       }
  vite:config     ],
  vite:config     mainFields: [ 'browser', 'module', 'jsnext:main', 'jsnext' ],
  vite:config     conditions: [ 'module', 'browser', 'development|production' ],
  vite:config     builtins: []
  vite:config   },
  vite:config   environments: {
  vite:config     client: {
  vite:config       define: undefined,
  vite:config       resolve: {
  vite:config         externalConditions: [ 'node' ],
  vite:config         extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config         dedupe: [ 'react', 'react-dom' ],
  vite:config         noExternal: [],
  vite:config         external: [],
  vite:config         preserveSymlinks: false,
  vite:config         alias: [
  vite:config           {
  vite:config             find: /^\/?@vite\/env/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config           },
  vite:config           {
  vite:config             find: /^\/?@vite\/client/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config           }
  vite:config         ],
  vite:config         mainFields: [ 'browser', 'module', 'jsnext:main', 'jsnext' ],
  vite:config         conditions: [ 'module', 'browser', 'development|production' ],
  vite:config         builtins: []
  vite:config       },
  vite:config       keepProcessEnv: false,
  vite:config       consumer: 'client',
  vite:config       optimizeDeps: {
  vite:config         include: [
  vite:config           'react',
  vite:config           'react-dom',
  vite:config           'react/jsx-dev-runtime',
  vite:config           'react/jsx-runtime'
  vite:config         ],
  vite:config         exclude: [],
  vite:config         needsInterop: [],
  vite:config         extensions: [],
  vite:config         disabled: undefined,
  vite:config         holdUntilCrawlEnd: true,
  vite:config         force: false,
  vite:config         noDiscovery: false,
  vite:config         esbuildOptions: { preserveSymlinks: false, jsx: 'automatic' }
  vite:config       },
  vite:config       dev: {
  vite:config         warmup: [],
  vite:config         sourcemap: { js: true },
  vite:config         sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config         preTransformRequests: true,
  vite:config         createEnvironment: [Function: defaultCreateClientDevEnvironment],
  vite:config         recoverable: true,
  vite:config         moduleRunnerTransform: false
  vite:config       },
  vite:config       build: {
  vite:config         target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         polyfillModulePreload: true,
  vite:config         modulePreload: { polyfill: true },
  vite:config         outDir: 'dist',
  vite:config         assetsDir: 'assets',
  vite:config         assetsInlineLimit: 4096,
  vite:config         sourcemap: false,
  vite:config         terserOptions: {},
  vite:config         rollupOptions: {
  vite:config           onwarn: [Function: onwarn],
  vite:config           input: [
  vite:config             '/Users/jasonkuhrt/projects/the-guild-org/polen/build/app-template/entry.client.jsx'
  vite:config           ]
  vite:config         },
  vite:config         commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config         dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config         write: true,
  vite:config         emptyOutDir: null,
  vite:config         copyPublicDir: true,
  vite:config         manifest: true,
  vite:config         lib: false,
  vite:config         ssrManifest: false,
  vite:config         ssrEmitAssets: false,
  vite:config         reportCompressedSize: true,
  vite:config         chunkSizeWarningLimit: 500,
  vite:config         watch: null,
  vite:config         cssCodeSplit: true,
  vite:config         minify: false,
  vite:config         ssr: false,
  vite:config         emitAssets: true,
  vite:config         createEnvironment: [Function: createEnvironment],
  vite:config         cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         cssMinify: false
  vite:config       }
  vite:config     },
  vite:config     ssr: {
  vite:config       define: undefined,
  vite:config       resolve: {
  vite:config         externalConditions: [ 'node' ],
  vite:config         extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config         dedupe: [ 'react', 'react-dom' ],
  vite:config         noExternal: [],
  vite:config         external: [],
  vite:config         preserveSymlinks: false,
  vite:config         alias: [
  vite:config           {
  vite:config             find: /^\/?@vite\/env/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config           },
  vite:config           {
  vite:config             find: /^\/?@vite\/client/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config           }
  vite:config         ],
  vite:config         mainFields: [ 'module', 'jsnext:main', 'jsnext' ],
  vite:config         conditions: [ 'module', 'node', 'development|production' ],
  vite:config         builtins: [
  vite:config           '_http_agent',         '_http_client',        '_http_common',
  vite:config           '_http_incoming',      '_http_outgoing',      '_http_server',
  vite:config           '_stream_duplex',      '_stream_passthrough', '_stream_readable',
  vite:config           '_stream_transform',   '_stream_wrap',        '_stream_writable',
  vite:config           '_tls_common',         '_tls_wrap',           'assert',
  vite:config           'assert/strict',       'async_hooks',         'buffer',
  vite:config           'child_process',       'cluster',             'console',
  vite:config           'constants',           'crypto',              'dgram',
  vite:config           'diagnostics_channel', 'dns',                 'dns/promises',
  vite:config           'domain',              'events',              'fs',
  vite:config           'fs/promises',         'http',                'http2',
  vite:config           'https',               'inspector',           'inspector/promises',
  vite:config           'module',              'net',                 'os',
  vite:config           'path',                'path/posix',          'path/win32',
  vite:config           'perf_hooks',          'process',             'punycode',
  vite:config           'querystring',         'readline',            'readline/promises',
  vite:config           'repl',                'stream',              'stream/consumers',
  vite:config           'stream/promises',     'stream/web',          'string_decoder',
  vite:config           'sys',                 'timers',              'timers/promises',
  vite:config           'tls',                 'trace_events',        'tty',
  vite:config           'url',                 'util',                'util/types',
  vite:config           'v8',                  'vm',                  'wasi',
  vite:config           'worker_threads',      'zlib',                /^node:/,
  vite:config           /^npm:/,               /^bun:/
  vite:config         ]
  vite:config       },
  vite:config       keepProcessEnv: true,
  vite:config       consumer: 'server',
  vite:config       optimizeDeps: {
  vite:config         include: [],
  vite:config         exclude: [],
  vite:config         needsInterop: [],
  vite:config         extensions: [],
  vite:config         disabled: undefined,
  vite:config         holdUntilCrawlEnd: true,
  vite:config         force: false,
  vite:config         noDiscovery: true,
  vite:config         esbuildOptions: { preserveSymlinks: false }
  vite:config       },
  vite:config       dev: {
  vite:config         warmup: [],
  vite:config         sourcemap: { js: true },
  vite:config         sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config         preTransformRequests: false,
  vite:config         createEnvironment: [Function: defaultCreateDevEnvironment],
  vite:config         recoverable: false,
  vite:config         moduleRunnerTransform: true
  vite:config       },
  vite:config       build: {
  vite:config         target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         polyfillModulePreload: true,
  vite:config         modulePreload: { polyfill: true },
  vite:config         outDir: 'dist',
  vite:config         assetsDir: 'assets',
  vite:config         assetsInlineLimit: 4096,
  vite:config         sourcemap: false,
  vite:config         terserOptions: {},
  vite:config         rollupOptions: {
  vite:config           onwarn: [Function: onwarn],
  vite:config           input: 'virtual:pollen/server/entry'
  vite:config         },
  vite:config         commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config         dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config         write: true,
  vite:config         emptyOutDir: false,
  vite:config         copyPublicDir: true,
  vite:config         manifest: false,
  vite:config         lib: false,
  vite:config         ssrManifest: false,
  vite:config         ssrEmitAssets: false,
  vite:config         reportCompressedSize: true,
  vite:config         chunkSizeWarningLimit: 500,
  vite:config         watch: null,
  vite:config         cssCodeSplit: true,
  vite:config         minify: false,
  vite:config         ssr: true,
  vite:config         emitAssets: true,
  vite:config         createEnvironment: [Function: createEnvironment],
  vite:config         cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         cssMinify: 'esbuild'
  vite:config       }
  vite:config     }
  vite:config   },
  vite:config   configFile: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/vite.config.ts',
  vite:config   configFileDependencies: [
  vite:config     '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/vite.config.ts'
  vite:config   ],
  vite:config   inlineConfig: {
  vite:config     root: undefined,
  vite:config     base: undefined,
  vite:config     mode: undefined,
  vite:config     configFile: undefined,
  vite:config     configLoader: undefined,
  vite:config     logLevel: undefined,
  vite:config     clearScreen: undefined,
  vite:config     build: {},
  vite:config     builder: {}
  vite:config   },
  vite:config   root: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config   base: '/',
  vite:config   decodedBase: '/',
  vite:config   rawBase: '/',
  vite:config   publicDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/public',
  vite:config   cacheDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.vite',
  vite:config   command: 'build',
  vite:config   mode: 'production',
  vite:config   isWorker: false,
  vite:config   mainConfig: null,
  vite:config   bundleChain: [],
  vite:config   isProduction: true,
  vite:config   css: {
  vite:config     transformer: 'postcss',
  vite:config     preprocessorMaxWorkers: 0,
  vite:config     devSourcemap: false,
  vite:config     lightningcss: undefined
  vite:config   },
  vite:config   json: { namedExports: true, stringify: 'auto' },
  vite:config   server: {
  vite:config     port: 5173,
  vite:config     strictPort: false,
  vite:config     host: undefined,
  vite:config     allowedHosts: [],
  vite:config     https: undefined,
  vite:config     open: false,
  vite:config     proxy: undefined,
  vite:config     cors: {
  vite:config       origin: /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/
  vite:config     },
  vite:config     headers: {},
  vite:config     warmup: { clientFiles: [], ssrFiles: [] },
  vite:config     middlewareMode: false,
  vite:config     fs: {
  vite:config       strict: true,
  vite:config       deny: [ '.env', '.env.*', '*.{crt,pem}', '**/.git/**' ],
  vite:config       allow: [
  vite:config         '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal'
  vite:config       ]
  vite:config     },
  vite:config     preTransformRequests: true,
  vite:config     perEnvironmentStartEndDuringDev: false,
  vite:config     sourcemapIgnoreList: [Function: isInNodeModules$1]
  vite:config   },
  vite:config   preview: {
  vite:config     port: 4173,
  vite:config     strictPort: false,
  vite:config     host: undefined,
  vite:config     allowedHosts: [],
  vite:config     https: undefined,
  vite:config     open: false,
  vite:config     proxy: undefined,
  vite:config     cors: {
  vite:config       origin: /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/
  vite:config     },
  vite:config     headers: {}
  vite:config   },
  vite:config   envDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config   env: { BASE_URL: '/', MODE: 'production', DEV: false, PROD: true },
  vite:config   assetsInclude: [Function: assetsInclude],
  vite:config   logger: {
  vite:config     hasWarned: false,
  vite:config     info: [Function: info],
  vite:config     warn: [Function: warn],
  vite:config     warnOnce: [Function: warnOnce],
  vite:config     error: [Function: error],
  vite:config     clearScreen: [Function: clearScreen],
  vite:config     hasErrorLogged: [Function: hasErrorLogged]
  vite:config   },
  vite:config   packageCache: Map(1) {
  vite:config     'fnpd_/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal' => {
  vite:config       dir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config       data: {
  vite:config         name: 'github-developer-portal',
  vite:config         private: true,
  vite:config         version: '0.0.0',
  vite:config         type: 'module',
  vite:config         scripts: {
  vite:config           dev: 'vite',
  vite:config           'build:client': 'vite build',
  vite:config           'build:server': 'vite build --ssr',
  vite:config           build: 'vite build --app',
  vite:config           preview: 'node dist/entry.js'
  vite:config         },
  vite:config         devDependencies: { typescript: '~5.8.2', vite: '^6.2.4' },
  vite:config         dependencies: { pollen: 'link:../..' }
  vite:config       },
  vite:config       hasSideEffects: [Function: hasSideEffects],
  vite:config       setResolvedCache: [Function: setResolvedCache],
  vite:config       getResolvedCache: [Function: getResolvedCache]
  vite:config     },
  vite:config     set: [Function (anonymous)]
  vite:config   },
  vite:config   worker: { format: 'iife', plugins: '() => plugins', rollupOptions: {} },
  vite:config   appType: 'spa',
  vite:config   experimental: { importGlobRestoreExtension: false, hmrPartialAccept: false },
  vite:config   future: undefined,
  vite:config   ssr: {
  vite:config     target: 'node',
  vite:config     optimizeDeps: {
  vite:config       esbuildOptions: { preserveSymlinks: false },
  vite:config       include: [],
  vite:config       exclude: [],
  vite:config       needsInterop: [],
  vite:config       extensions: [],
  vite:config       holdUntilCrawlEnd: true,
  vite:config       force: false,
  vite:config       noDiscovery: true
  vite:config     },
  vite:config     external: [],
  vite:config     noExternal: [],
  vite:config     resolve: {
  vite:config       conditions: [ 'module', 'node', 'development|production' ],
  vite:config       externalConditions: [ 'node' ]
  vite:config     }
  vite:config   },
  vite:config   dev: {
  vite:config     warmup: [],
  vite:config     sourcemap: { js: true },
  vite:config     sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config     preTransformRequests: false,
  vite:config     createEnvironment: [Function: defaultCreateDevEnvironment],
  vite:config     recoverable: false,
  vite:config     moduleRunnerTransform: false
  vite:config   },
  vite:config   webSocketToken: 'eLoJHbbkXXMr',
  vite:config   getSortedPlugins: [Function: getSortedPlugins],
  vite:config   getSortedPluginHooks: [Function: getSortedPluginHooks],
  vite:config   createResolver: [Function: createResolver],
  vite:config   fsDenyGlob: [Function: arrayMatcher],
  vite:config   safeModulePaths: Set(0) {},
  vite:config   additionalAllowedHosts: []
  vite:config } +1ms
  vite:config config file loaded in 36.67ms +42ms
  vite:env loading env files: [
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.local',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.production',
  vite:env   '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/.env.production.local'
  vite:env ] +44ms
  vite:env env files loaded in 0.62ms +0ms
  vite:env using resolved env: {} +1ms
  vite:config using resolved config: {
  vite:config   plugins: [
  vite:config     'vite:build-metadata',
  vite:config     'vite:watch-package-data',
  vite:config     'alias',
  vite:config     'vite:react-babel',
  vite:config     'vite:react-refresh',
  vite:config     'vite:modulepreload-polyfill',
  vite:config     'vite:resolve',
  vite:config     'vite:html-inline-proxy',
  vite:config     'vite:css',
  vite:config     'vite:esbuild',
  vite:config     'vite:json',
  vite:config     'vite:wasm-helper',
  vite:config     'vite:worker',
  vite:config     'vite:asset',
  vite:config     'pollen-build-client',
  vite:config     'pollen-manifest',
  vite:config     'pollen-ssr-build',
  vite:config     'vite:wasm-fallback',
  vite:config     'vite:define',
  vite:config     'vite:css-post',
  vite:config     'vite:build-html',
  vite:config     'vite:worker-import-meta-url',
  vite:config     'vite:asset-import-meta-url',
  vite:config     'vite:force-systemjs-wrap-complete',
  vite:config     'commonjs',
  vite:config     'vite:data-uri',
  vite:config     'vite:rollup-options-plugins',
  vite:config     'vite:dynamic-import-vars',
  vite:config     'vite:import-glob',
  vite:config     'vite:build-import-analysis',
  vite:config     'vite:esbuild-transpile',
  vite:config     'vite:terser',
  vite:config     'vite:manifest',
  vite:config     'vite:ssr-manifest',
  vite:config     'vite:reporter',
  vite:config     'vite:load-fallback'
  vite:config   ],
  vite:config   build: {
  vite:config     target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     polyfillModulePreload: true,
  vite:config     modulePreload: { polyfill: true },
  vite:config     outDir: 'dist',
  vite:config     assetsDir: 'assets',
  vite:config     assetsInlineLimit: 4096,
  vite:config     sourcemap: false,
  vite:config     terserOptions: {},
  vite:config     rollupOptions: {
  vite:config       onwarn: [Function: onwarn],
  vite:config       input: 'virtual:pollen/server/entry'
  vite:config     },
  vite:config     commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config     dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config     write: true,
  vite:config     emptyOutDir: false,
  vite:config     copyPublicDir: true,
  vite:config     manifest: false,
  vite:config     lib: false,
  vite:config     ssrManifest: false,
  vite:config     ssrEmitAssets: false,
  vite:config     reportCompressedSize: true,
  vite:config     chunkSizeWarningLimit: 500,
  vite:config     watch: null,
  vite:config     cssCodeSplit: true,
  vite:config     minify: false,
  vite:config     ssr: true,
  vite:config     emitAssets: false,
  vite:config     createEnvironment: [Function: createEnvironment],
  vite:config     cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     cssMinify: 'esbuild'
  vite:config   },
  vite:config   builder: {
  vite:config     sharedConfigBuild: false,
  vite:config     sharedPlugins: false,
  vite:config     buildApp: [AsyncFunction: defaultBuildApp]
  vite:config   },
  vite:config   esbuild: { jsxDev: false, jsx: 'automatic', jsxImportSource: undefined },
  vite:config   optimizeDeps: {
  vite:config     include: [
  vite:config       'react',
  vite:config       'react-dom',
  vite:config       'react/jsx-dev-runtime',
  vite:config       'react/jsx-runtime'
  vite:config     ],
  vite:config     exclude: [],
  vite:config     needsInterop: [],
  vite:config     extensions: [],
  vite:config     disabled: undefined,
  vite:config     holdUntilCrawlEnd: true,
  vite:config     force: false,
  vite:config     noDiscovery: false,
  vite:config     esbuildOptions: { preserveSymlinks: false, jsx: 'automatic' }
  vite:config   },
  vite:config   resolve: {
  vite:config     externalConditions: [ 'node' ],
  vite:config     extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config     dedupe: [ 'react', 'react-dom' ],
  vite:config     noExternal: [],
  vite:config     external: [],
  vite:config     preserveSymlinks: false,
  vite:config     alias: [
  vite:config       {
  vite:config         find: /^\/?@vite\/env/,
  vite:config         replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config       },
  vite:config       {
  vite:config         find: /^\/?@vite\/client/,
  vite:config         replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config       }
  vite:config     ],
  vite:config     mainFields: [ 'browser', 'module', 'jsnext:main', 'jsnext' ],
  vite:config     conditions: [ 'module', 'browser', 'development|production' ],
  vite:config     builtins: []
  vite:config   },
  vite:config   environments: {
  vite:config     client: {
  vite:config       define: undefined,
  vite:config       resolve: {
  vite:config         externalConditions: [ 'node' ],
  vite:config         extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config         dedupe: [ 'react', 'react-dom' ],
  vite:config         noExternal: [],
  vite:config         external: [],
  vite:config         preserveSymlinks: false,
  vite:config         alias: [
  vite:config           {
  vite:config             find: /^\/?@vite\/env/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config           },
  vite:config           {
  vite:config             find: /^\/?@vite\/client/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config           }
  vite:config         ],
  vite:config         mainFields: [ 'browser', 'module', 'jsnext:main', 'jsnext' ],
  vite:config         conditions: [ 'module', 'browser', 'development|production' ],
  vite:config         builtins: []
  vite:config       },
  vite:config       keepProcessEnv: false,
  vite:config       consumer: 'client',
  vite:config       optimizeDeps: {
  vite:config         include: [
  vite:config           'react',
  vite:config           'react-dom',
  vite:config           'react/jsx-dev-runtime',
  vite:config           'react/jsx-runtime'
  vite:config         ],
  vite:config         exclude: [],
  vite:config         needsInterop: [],
  vite:config         extensions: [],
  vite:config         disabled: undefined,
  vite:config         holdUntilCrawlEnd: true,
  vite:config         force: false,
  vite:config         noDiscovery: false,
  vite:config         esbuildOptions: { preserveSymlinks: false, jsx: 'automatic' }
  vite:config       },
  vite:config       dev: {
  vite:config         warmup: [],
  vite:config         sourcemap: { js: true },
  vite:config         sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config         preTransformRequests: true,
  vite:config         createEnvironment: [Function: defaultCreateClientDevEnvironment],
  vite:config         recoverable: true,
  vite:config         moduleRunnerTransform: false
  vite:config       },
  vite:config       build: {
  vite:config         target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         polyfillModulePreload: true,
  vite:config         modulePreload: { polyfill: true },
  vite:config         outDir: 'dist',
  vite:config         assetsDir: 'assets',
  vite:config         assetsInlineLimit: 4096,
  vite:config         sourcemap: false,
  vite:config         terserOptions: {},
  vite:config         rollupOptions: {
  vite:config           onwarn: [Function: onwarn],
  vite:config           input: [
  vite:config             '/Users/jasonkuhrt/projects/the-guild-org/polen/build/app-template/entry.client.jsx'
  vite:config           ]
  vite:config         },
  vite:config         commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config         dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config         write: true,
  vite:config         emptyOutDir: null,
  vite:config         copyPublicDir: true,
  vite:config         manifest: true,
  vite:config         lib: false,
  vite:config         ssrManifest: false,
  vite:config         ssrEmitAssets: false,
  vite:config         reportCompressedSize: true,
  vite:config         chunkSizeWarningLimit: 500,
  vite:config         watch: null,
  vite:config         cssCodeSplit: true,
  vite:config         minify: false,
  vite:config         ssr: false,
  vite:config         emitAssets: true,
  vite:config         createEnvironment: [Function: createEnvironment],
  vite:config         cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         cssMinify: false
  vite:config       }
  vite:config     },
  vite:config     ssr: {
  vite:config       define: undefined,
  vite:config       resolve: {
  vite:config         externalConditions: [ 'node' ],
  vite:config         extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json' ],
  vite:config         dedupe: [ 'react', 'react-dom' ],
  vite:config         noExternal: [],
  vite:config         external: [],
  vite:config         preserveSymlinks: false,
  vite:config         alias: [
  vite:config           {
  vite:config             find: /^\/?@vite\/env/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/env.mjs'
  vite:config           },
  vite:config           {
  vite:config             find: /^\/?@vite\/client/,
  vite:config             replacement: '/@fs/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.pnpm/vite@6.2.4/node_modules/vite/dist/client/client.mjs'
  vite:config           }
  vite:config         ],
  vite:config         mainFields: [ 'module', 'jsnext:main', 'jsnext' ],
  vite:config         conditions: [ 'module', 'node', 'development|production' ],
  vite:config         builtins: [
  vite:config           '_http_agent',         '_http_client',        '_http_common',
  vite:config           '_http_incoming',      '_http_outgoing',      '_http_server',
  vite:config           '_stream_duplex',      '_stream_passthrough', '_stream_readable',
  vite:config           '_stream_transform',   '_stream_wrap',        '_stream_writable',
  vite:config           '_tls_common',         '_tls_wrap',           'assert',
  vite:config           'assert/strict',       'async_hooks',         'buffer',
  vite:config           'child_process',       'cluster',             'console',
  vite:config           'constants',           'crypto',              'dgram',
  vite:config           'diagnostics_channel', 'dns',                 'dns/promises',
  vite:config           'domain',              'events',              'fs',
  vite:config           'fs/promises',         'http',                'http2',
  vite:config           'https',               'inspector',           'inspector/promises',
  vite:config           'module',              'net',                 'os',
  vite:config           'path',                'path/posix',          'path/win32',
  vite:config           'perf_hooks',          'process',             'punycode',
  vite:config           'querystring',         'readline',            'readline/promises',
  vite:config           'repl',                'stream',              'stream/consumers',
  vite:config           'stream/promises',     'stream/web',          'string_decoder',
  vite:config           'sys',                 'timers',              'timers/promises',
  vite:config           'tls',                 'trace_events',        'tty',
  vite:config           'url',                 'util',                'util/types',
  vite:config           'v8',                  'vm',                  'wasi',
  vite:config           'worker_threads',      'zlib',                /^node:/,
  vite:config           /^npm:/,               /^bun:/
  vite:config         ]
  vite:config       },
  vite:config       keepProcessEnv: true,
  vite:config       consumer: 'server',
  vite:config       optimizeDeps: {
  vite:config         include: [],
  vite:config         exclude: [],
  vite:config         needsInterop: [],
  vite:config         extensions: [],
  vite:config         disabled: undefined,
  vite:config         holdUntilCrawlEnd: true,
  vite:config         force: false,
  vite:config         noDiscovery: true,
  vite:config         esbuildOptions: { preserveSymlinks: false }
  vite:config       },
  vite:config       dev: {
  vite:config         warmup: [],
  vite:config         sourcemap: { js: true },
  vite:config         sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config         preTransformRequests: false,
  vite:config         createEnvironment: [Function: defaultCreateDevEnvironment],
  vite:config         recoverable: false,
  vite:config         moduleRunnerTransform: true
  vite:config       },
  vite:config       build: {
  vite:config         target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         polyfillModulePreload: true,
  vite:config         modulePreload: { polyfill: true },
  vite:config         outDir: 'dist',
  vite:config         assetsDir: 'assets',
  vite:config         assetsInlineLimit: 4096,
  vite:config         sourcemap: false,
  vite:config         terserOptions: {},
  vite:config         rollupOptions: {
  vite:config           onwarn: [Function: onwarn],
  vite:config           input: 'virtual:pollen/server/entry'
  vite:config         },
  vite:config         commonjsOptions: { include: [ /node_modules/ ], extensions: [ '.js', '.cjs' ] },
  vite:config         dynamicImportVarsOptions: { warnOnError: true, exclude: [ /node_modules/ ] },
  vite:config         write: true,
  vite:config         emptyOutDir: false,
  vite:config         copyPublicDir: true,
  vite:config         manifest: false,
  vite:config         lib: false,
  vite:config         ssrManifest: false,
  vite:config         ssrEmitAssets: false,
  vite:config         reportCompressedSize: true,
  vite:config         chunkSizeWarningLimit: 500,
  vite:config         watch: null,
  vite:config         cssCodeSplit: true,
  vite:config         minify: false,
  vite:config         ssr: true,
  vite:config         emitAssets: false,
  vite:config         createEnvironment: [Function: createEnvironment],
  vite:config         cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config         cssMinify: 'esbuild'
  vite:config       }
  vite:config     }
  vite:config   },
  vite:config   configFile: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/vite.config.ts',
  vite:config   configFileDependencies: [
  vite:config     '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/vite.config.ts'
  vite:config   ],
  vite:config   inlineConfig: {
  vite:config     root: undefined,
  vite:config     base: undefined,
  vite:config     mode: undefined,
  vite:config     configFile: undefined,
  vite:config     configLoader: undefined,
  vite:config     logLevel: undefined,
  vite:config     clearScreen: undefined,
  vite:config     build: {},
  vite:config     builder: {}
  vite:config   },
  vite:config   root: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config   base: '/',
  vite:config   decodedBase: '/',
  vite:config   rawBase: '/',
  vite:config   publicDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/public',
  vite:config   cacheDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal/node_modules/.vite',
  vite:config   command: 'build',
  vite:config   mode: 'production',
  vite:config   isWorker: false,
  vite:config   mainConfig: null,
  vite:config   bundleChain: [],
  vite:config   isProduction: true,
  vite:config   css: {
  vite:config     transformer: 'postcss',
  vite:config     preprocessorMaxWorkers: 0,
  vite:config     devSourcemap: false,
  vite:config     lightningcss: undefined
  vite:config   },
  vite:config   json: { namedExports: true, stringify: 'auto' },
  vite:config   server: {
  vite:config     port: 5173,
  vite:config     strictPort: false,
  vite:config     host: undefined,
  vite:config     allowedHosts: [],
  vite:config     https: undefined,
  vite:config     open: false,
  vite:config     proxy: undefined,
  vite:config     cors: {
  vite:config       origin: /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/
  vite:config     },
  vite:config     headers: {},
  vite:config     warmup: { clientFiles: [], ssrFiles: [] },
  vite:config     middlewareMode: false,
  vite:config     fs: {
  vite:config       strict: true,
  vite:config       deny: [ '.env', '.env.*', '*.{crt,pem}', '**/.git/**' ],
  vite:config       allow: [
  vite:config         '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal'
  vite:config       ]
  vite:config     },
  vite:config     preTransformRequests: true,
  vite:config     perEnvironmentStartEndDuringDev: false,
  vite:config     sourcemapIgnoreList: [Function: isInNodeModules$1]
  vite:config   },
  vite:config   preview: {
  vite:config     port: 4173,
  vite:config     strictPort: false,
  vite:config     host: undefined,
  vite:config     allowedHosts: [],
  vite:config     https: undefined,
  vite:config     open: false,
  vite:config     proxy: undefined,
  vite:config     cors: {
  vite:config       origin: /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/
  vite:config     },
  vite:config     headers: {}
  vite:config   },
  vite:config   envDir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config   env: { BASE_URL: '/', MODE: 'production', DEV: false, PROD: true },
  vite:config   assetsInclude: [Function: assetsInclude],
  vite:config   logger: {
  vite:config     hasWarned: false,
  vite:config     info: [Function: info],
  vite:config     warn: [Function: warn],
  vite:config     warnOnce: [Function: warnOnce],
  vite:config     error: [Function: error],
  vite:config     clearScreen: [Function: clearScreen],
  vite:config     hasErrorLogged: [Function: hasErrorLogged]
  vite:config   },
  vite:config   packageCache: Map(1) {
  vite:config     'fnpd_/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal' => {
  vite:config       dir: '/Users/jasonkuhrt/projects/the-guild-org/polen/examples/github-developer-portal',
  vite:config       data: {
  vite:config         name: 'github-developer-portal',
  vite:config         private: true,
  vite:config         version: '0.0.0',
  vite:config         type: 'module',
  vite:config         scripts: {
  vite:config           dev: 'vite',
  vite:config           'build:client': 'vite build',
  vite:config           'build:server': 'vite build --ssr',
  vite:config           build: 'vite build --app',
  vite:config           preview: 'node dist/entry.js'
  vite:config         },
  vite:config         devDependencies: { typescript: '~5.8.2', vite: '^6.2.4' },
  vite:config         dependencies: { pollen: 'link:../..' }
  vite:config       },
  vite:config       hasSideEffects: [Function: hasSideEffects],
  vite:config       setResolvedCache: [Function: setResolvedCache],
  vite:config       getResolvedCache: [Function: getResolvedCache]
  vite:config     },
  vite:config     set: [Function (anonymous)]
  vite:config   },
  vite:config   worker: { format: 'iife', plugins: '() => plugins', rollupOptions: {} },
  vite:config   appType: 'spa',
  vite:config   experimental: { importGlobRestoreExtension: false, hmrPartialAccept: false },
  vite:config   future: undefined,
  vite:config   ssr: {
  vite:config     target: 'node',
  vite:config     optimizeDeps: {
  vite:config       esbuildOptions: { preserveSymlinks: false },
  vite:config       include: [],
  vite:config       exclude: [],
  vite:config       needsInterop: [],
  vite:config       extensions: [],
  vite:config       holdUntilCrawlEnd: true,
  vite:config       force: false,
  vite:config       noDiscovery: true
  vite:config     },
  vite:config     external: [],
  vite:config     noExternal: [],
  vite:config     resolve: {
  vite:config       conditions: [ 'module', 'node', 'development|production' ],
  vite:config       externalConditions: [ 'node' ]
  vite:config     }
  vite:config   },
  vite:config   dev: {
  vite:config     warmup: [],
  vite:config     sourcemap: { js: true },
  vite:config     sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config     preTransformRequests: false,
  vite:config     createEnvironment: [Function: defaultCreateDevEnvironment],
  vite:config     recoverable: false,
  vite:config     moduleRunnerTransform: false
  vite:config   },
  vite:config   webSocketToken: '65Z6qyPqSyqO',
  vite:config   getSortedPlugins: [Function: getSortedPlugins],
  vite:config   getSortedPluginHooks: [Function: getSortedPluginHooks],
  vite:config   createResolver: [Function: createResolver],
  vite:config   fsDenyGlob: [Function: arrayMatcher],
  vite:config   safeModulePaths: Set(0) {},
  vite:config   additionalAllowedHosts: []
  vite:config } +4ms
vite v6.2.4 building for production...
✓ 38 modules transformed.
dist/.vite/manifest.json                 0.27 kB │ gzip:   0.17 kB
dist/assets/entry.client-Dzbc5IV8.jsx    0.42 kB
dist/assets/entry.client-CScTwu1U.js   715.68 kB │ gzip: 135.55 kB
✓ built in 575ms
vite v6.2.4 building SSR bundle for production...
✓ 6 modules transformed.
dist/entry.js  3.31 kB
✓ built in 20ms
```

</details>
