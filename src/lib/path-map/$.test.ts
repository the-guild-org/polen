import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { PathMap } from './$.js'

describe('PathMap', () => {
  describe('create', () => {
    it('returns RelativePathMap when no base provided', () => {
      const paths = PathMap.create({
        src: {
          lib: {
            utils: 'utils.ts',
          },
        },
      })

      expect(paths).not.toHaveProperty('rooted')
      expect(paths).not.toHaveProperty('absolute')
      expect(paths).not.toHaveProperty('base')
      expect(paths.src.lib.utils).toBe('utils.ts')
    })

    it('returns PathMap with all variants when base provided', () => {
      const paths = PathMap.create({
        src: {
          lib: {
            utils: 'utils.ts',
          },
        },
      }, '/project')

      expect(paths).toHaveProperty('relative')
      expect(paths).toHaveProperty('rooted')
      expect(paths).toHaveProperty('absolute')
      expect(paths).toHaveProperty('base')
      expect(paths.base).toBe('/project')
    })

    it('processes relative paths correctly', () => {
      const paths = PathMap.create({
        template: {
          server: {
            app: 'app.ts',
            main: 'main.ts',
          },
          client: {
            entry: 'entry.tsx',
          },
          'routes.tsx': 'routes.tsx',
        },
      }, '/base')

      // Relative paths - local to parent
      expect(paths.relative.template.server.app).toBe('app.ts')
      expect(paths.relative.template.server.main).toBe('main.ts')
      expect(paths.relative.template.client.entry).toBe('entry.tsx')
      expect(paths.relative.template['routes.tsx']).toBe('routes.tsx')

      // Directory $ properties - just the segment name
      expect(paths.relative.$).toBe('.')
      expect(paths.relative.template.$).toBe('template')
      expect(paths.relative.template.server.$).toBe('server')
      expect(paths.relative.template.client.$).toBe('client')
    })

    it('processes rooted paths correctly', () => {
      const paths = PathMap.create({
        template: {
          server: {
            app: 'app.ts',
            main: 'main.ts',
          },
          client: {
            entry: 'entry.tsx',
          },
        },
      }, '/base')

      // Rooted paths - from PathMap root
      expect(paths.rooted.template.server.app).toBe('template/server/app.ts')
      expect(paths.rooted.template.server.main).toBe('template/server/main.ts')
      expect(paths.rooted.template.client.entry).toBe('template/client/entry.tsx')

      // Directory $ properties - full path from root
      expect(paths.rooted.$).toBe('.')
      expect(paths.rooted.template.$).toBe('template')
      expect(paths.rooted.template.server.$).toBe('template/server')
      expect(paths.rooted.template.client.$).toBe('template/client')
    })

    it('processes absolute paths correctly', () => {
      const paths = PathMap.create({
        template: {
          server: {
            app: 'app.ts',
            main: 'main.ts',
          },
          client: {
            entry: 'entry.tsx',
          },
        },
      }, '/project')

      // Absolute paths
      expect(paths.absolute.template.server.app).toBe('/project/template/server/app.ts')
      expect(paths.absolute.template.server.main).toBe('/project/template/server/main.ts')
      expect(paths.absolute.template.client.entry).toBe('/project/template/client/entry.tsx')

      // Directory $ properties
      expect(paths.absolute.$).toBe('/project')
      expect(paths.absolute.template.$).toBe('/project/template')
      expect(paths.absolute.template.server.$).toBe('/project/template/server')
      expect(paths.absolute.template.client.$).toBe('/project/template/client')
    })

    it('handles deeply nested structures', () => {
      const paths = PathMap.create({
        a: {
          b: {
            c: {
              d: {
                e: 'file.ts',
              },
            },
          },
        },
      }, '/root')

      expect(paths.relative.a.b.c.d.e).toBe('file.ts')
      expect(paths.rooted.a.b.c.d.e).toBe('a/b/c/d/file.ts')
      expect(paths.absolute.a.b.c.d.e).toBe('/root/a/b/c/d/file.ts')

      expect(paths.relative.a.b.c.d.$).toBe('d')
      expect(paths.rooted.a.b.c.d.$).toBe('a/b/c/d')
      expect(paths.absolute.a.b.c.d.$).toBe('/root/a/b/c/d')
    })

    it('handles quoted property names', () => {
      const paths = PathMap.create({
        'src-files': {
          'main.config.ts': 'main.config.ts',
          '.env': '.env',
        },
      }, '/app')

      expect(paths.relative['src-files']['main.config.ts']).toBe('main.config.ts')
      expect(paths.relative['src-files']['.env']).toBe('.env')
      expect(paths.rooted['src-files']['main.config.ts']).toBe('src-files/main.config.ts')
      expect(paths.absolute['src-files']['.env']).toBe('/app/src-files/.env')
    })
  })

  describe('rebase', () => {
    it('creates new PathMap with different base', () => {
      const original = PathMap.create({
        src: {
          lib: 'lib.ts',
        },
      }, '/original')

      const rebased = PathMap.rebase(original, '/new')

      expect(rebased.base).toBe('/new')
      expect(rebased.absolute.src.lib).toBe('/new/src/lib.ts')
      // Relative and rooted should remain the same
      expect(rebased.relative.src.lib).toBe('lib.ts')
      expect(rebased.rooted.src.lib).toBe('src/lib.ts')
    })

    it('can rebase from RelativePathMap', () => {
      const relative = PathMap.create({
        src: {
          lib: 'lib.ts',
        },
      })

      const based = PathMap.rebase(relative, '/base')

      expect(based.base).toBe('/base')
      expect(based.absolute.src.lib).toBe('/base/src/lib.ts')
      expect(based.relative.src.lib).toBe('lib.ts')
      expect(based.rooted.src.lib).toBe('src/lib.ts')
    })

    it('supports chained rebasing', () => {
      const p1 = PathMap.create({ src: { file: 'file.ts' } }, '/base1')
      const p2 = PathMap.rebase(p1, '/base2')
      const p3 = PathMap.rebase(p2, '/base3')

      expect(p1.base).toBe('/base1')
      expect(p2.base).toBe('/base2')
      expect(p3.base).toBe('/base3')

      expect(p1.absolute.src.file).toBe('/base1/src/file.ts')
      expect(p2.absolute.src.file).toBe('/base2/src/file.ts')
      expect(p3.absolute.src.file).toBe('/base3/src/file.ts')
    })
  })

  describe('property tests', () => {
    // Arbitrary for valid path segments
    const pathSegment = fc.stringMatching(/^[a-zA-Z0-9_-]+$/)

    // Arbitrary for file names
    const fileName = fc.stringMatching(/^[a-zA-Z0-9_-]+\.(ts|js|tsx|jsx)$/)

    // Arbitrary for path input structures
    const pathInput = fc.letrec<{ pathInput: PathMap.PathInput }>(tie => ({
      pathInput: fc.dictionary(
        pathSegment,
        fc.oneof(
          fileName,
          tie('pathInput'),
        ),
        { minKeys: 1, maxKeys: 3 },
      ),
    })).pathInput

    it('relative paths are always substrings of rooted paths', () => {
      fc.assert(
        fc.property(pathInput, fc.string({ minLength: 1 }).filter(s => s.startsWith('/')), (input, base) => {
          const paths = PathMap.create(input, base)

          // For every file path, relative should be at the end of rooted
          function check(rel: any, rooted: any) {
            for (const [key, value] of Object.entries(rel)) {
              if (key === '$') continue

              if (typeof value === 'string' && typeof rooted[key] === 'string') {
                expect(rooted[key]).toContain(value)
                expect(rooted[key].endsWith(value)).toBe(true)
              } else if (typeof value === 'object') {
                check(value, rooted[key])
              }
            }
          }

          check(paths.relative, paths.rooted)
        }),
      )
    })

    it('absolute paths always start with base', () => {
      fc.assert(
        fc.property(pathInput, fc.string({ minLength: 1 }).filter(s => s.startsWith('/')), (input, base) => {
          const paths = PathMap.create(input, base)

          // Base is normalized (trimmed, multiple slashes collapsed, trailing removed)
          const collapsedBase = base.trim().replace(/\/+/g, '/')
          const normalizedBase = collapsedBase === '/' ? '/' : collapsedBase.replace(/\/$/, '')

          function checkAbsolute(obj: any) {
            for (const [key, value] of Object.entries(obj)) {
              if (typeof value === 'string') {
                expect(value.startsWith(normalizedBase)).toBe(true)
              } else if (typeof value === 'object') {
                checkAbsolute(value)
              }
            }
          }

          checkAbsolute(paths.absolute)
        }),
      )
    })

    it('rebase preserves structure', () => {
      fc.assert(
        fc.property(
          pathInput,
          fc.string({ minLength: 1 }).filter(s => s.startsWith('/')),
          fc.string({ minLength: 1 }).filter(s => s.startsWith('/')),
          (input, base1, base2) => {
            const p1 = PathMap.create(input, base1)
            const p2 = PathMap.rebase(p1, base2)

            // Structure should be identical
            expect(JSON.stringify(p1.relative)).toBe(JSON.stringify(p2.relative))
            expect(JSON.stringify(p1.rooted)).toBe(JSON.stringify(p2.rooted))

            // Only absolute paths and base should change
            // Use the normalized base from the PathMap itself
            function checkBase(obj: any) {
              for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                  expect(value.startsWith(p2.base)).toBe(true)
                } else if (typeof value === 'object') {
                  checkBase(value)
                }
              }
            }

            checkBase(p2.absolute)
          },
        ),
      )
    })

    it('$ properties are consistent across variants', () => {
      fc.assert(
        fc.property(pathInput, fc.string({ minLength: 1 }).filter(s => s.startsWith('/')), (input, base) => {
          const paths = PathMap.create(input, base)

          function checkDirs(rel: any, rooted: any, abs: any, currentPath: string[] = []) {
            if (rel.$ && rooted.$ && abs.$) {
              // Relative $ should be just the last segment or '.'
              if (currentPath.length === 0) {
                expect(rel.$).toBe('.')
                expect(rooted.$).toBe('.')
                // Base is normalized in create() (trimmed, collapsed, trailing removed)
                const collapsedBase = base.trim().replace(/\/+/g, '/')
                const normalizedBase = collapsedBase === '/' ? '/' : collapsedBase.replace(/\/$/, '')
                expect(abs.$).toBe(normalizedBase)
              } else {
                expect(rel.$).toBe(currentPath[currentPath.length - 1])
                expect(rooted.$).toBe(currentPath.join('/'))
                // Handle base that might be '/' or have trailing slash
                // Note: create() normalizes the base (trim + collapse + remove trailing)
                const collapsedBase = base.trim().replace(/\/+/g, '/')
                const normalizedBase = collapsedBase === '/' ? '/' : collapsedBase.replace(/\/$/, '')
                const expectedAbs = normalizedBase === '/'
                  ? `/${currentPath.join('/')}`
                  : `${normalizedBase}/${currentPath.join('/')}`
                expect(abs.$).toBe(expectedAbs)
              }
            }

            for (const key of Object.keys(rel)) {
              if (key === '$' || typeof rel[key] === 'string') continue
              if (rel[key] && rooted[key] && abs[key]) {
                checkDirs(rel[key], rooted[key], abs[key], [...currentPath, key])
              }
            }
          }

          checkDirs(paths.relative, paths.rooted, paths.absolute)
        }),
      )
    })
  })

  describe('type safety', () => {
    it('maintains type information through operations', () => {
      const paths = PathMap.create({
        src: {
          lib: {
            utils: 'utils.ts',
            helpers: 'helpers.ts',
          },
          components: {
            Button: 'Button.tsx',
          },
        },
      }, '/project')

      // TypeScript should know about these paths
      const _utils: string = paths.relative.src.lib.utils
      const _button: string = paths.absolute.src.components.Button
      const _libDir: string = paths.rooted.src.lib.$

      // @ts-expect-error - should not exist
      paths.relative.src.lib.unknown

      // @ts-expect-error - should not exist
      paths.absolute.notThere
    })
  })
})
