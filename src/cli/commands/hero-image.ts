import { Api } from '#api/$'
import { AiImageGeneration } from '#lib/ai-image-generation/$'
import { Catalog } from '#lib/catalog/$'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { FileSystem } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import { Command, Options } from '@effect/cli'
import { Console, Effect, Option } from 'effect'
import * as Path from 'node:path'
import { projectParameter } from '../_/parameters.js'

/**
 * Backup existing hero image to hero-previous-{number}.{ext}
 */
const backupExistingHeroImage = (dir: string) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const publicDir = Path.join(dir, 'public')
    const heroExtensions = ['svg', 'png', 'jpg', 'jpeg', 'webp']
    
    // Find existing hero image
    let existingHeroPath: string | null = null
    let existingExt: string | null = null
    
    for (const ext of heroExtensions) {
      const heroPath = Path.join(publicDir, `hero.${ext}`)
      const exists = yield* fs.exists(heroPath)
      if (exists) {
        existingHeroPath = heroPath
        existingExt = ext
        break
      }
    }
    
    if (!existingHeroPath || !existingExt) {
      // No existing hero image to backup
      return
    }
    
    // Find next available backup number
    let backupNumber = 1
    while (true) {
      const backupPath = Path.join(publicDir, `hero-previous-${backupNumber}.${existingExt}`)
      const backupExists = yield* fs.exists(backupPath)
      if (backupExists) {
        // Backup file exists, try next number
        backupNumber++
      } else {
        // This backup slot is available
        yield* fs.rename(existingHeroPath, backupPath)
        yield* Console.log(`📦 Backed up existing hero.${existingExt} to hero-previous-${backupNumber}.${existingExt}`)
        break
      }
    }
  })

export const heroImage = Command.make(
  'hero-image',
  { 
    project: projectParameter,
    overwrite: Options.boolean('overwrite').pipe(
      Options.withDescription('Skip backup and overwrite existing hero image'),
      Options.withDefault(false),
    ),
  },
  ({ project, overwrite }) =>
    Effect.gen(function*() {
      // Get project directory
      const dir = ensureOptionalAbsoluteWithCwd(Option.getOrUndefined(project))
      
      // Load config
      const configInput = yield* Api.Config.load({ dir })
      const config = yield* Api.Config.normalizeInput(configInput, dir)
      
      // Check if home hero is configured
      if (!config.home || config.home.enabled === false) {
        yield* Console.log('❌ Home page not enabled in polen.config.ts')
        return
      }
      
      const heroConfig = config.home.hero
      if (!heroConfig || !heroConfig.enabled) {
        yield* Console.log('❌ Hero section not enabled in polen.config.ts')
        return
      }
      
      // Extract AI config and layout from the raw input (since it's not in normalized config)
      const rawHero = (configInput as any)?.home?.hero
      const rawHeroImage = rawHero?.heroImage
      const layout = rawHero?.layout || heroConfig.layout || 'asymmetric'
      // Check for custom prompt in hero.prompt or heroImage.ai.prompt
      const customPrompt = rawHero?.prompt || rawHeroImage?.ai?.prompt
      if (customPrompt) {
        yield* Console.log(`📝 Using custom prompt from config`)
      }
      let aiConfig: any = {}
      
      if (rawHeroImage && typeof rawHeroImage === 'object' && rawHeroImage.ai) {
        aiConfig = rawHeroImage.ai
        if (!aiConfig.enabled) {
          yield* Console.log('❌ AI hero image generation not enabled')
          yield* Console.log('💡 Set ai.enabled: true in your hero image config')
          return
        }
        yield* Console.log('✨ Generating hero image with Pollinations.ai...')
      } else {
        // Use defaults if no AI config
        yield* Console.log('✨ Generating hero image with Pollinations.ai (default settings)...')
        yield* Console.log('💡 To customize, add this to your polen.config.ts:')
        yield* Console.log(`
  home: {
    hero: {
      layout: 'asymmetric',  // or 'cinematic', 'auto'
      heroImage: {
        ai: {
          enabled: true,
          style: 'modern',  // or: minimalist, abstract, vibrant, etc.
          seed: 12345,     // for reproducible generation
          nologo: true,    // hide Pollinations logo
        }
      }
    }
  }`)
        aiConfig = {
          enabled: true,
          style: 'modern',
          nologo: true,
        }
      }
      
      // Load and analyze schema if available
      let schema = undefined
      const schemaResult = yield* Api.Schema.loadOrNull(config)
      if (schemaResult?.data) {
        try {
          const latestSchema = Catalog.getLatestSchema(schemaResult.data)
          if (latestSchema?.definition) {
            schema = latestSchema.definition
            const context = AiImageGeneration.analyzeSchema(schema)
            const domain = context.domain || 'general'
            const mainTypes = context.mainTypes.slice(0, 3).join(', ')
            yield* Console.log(`📊 Schema analysis: ${domain} API`)
            if (mainTypes) {
              yield* Console.log(`   Types detected: ${mainTypes}`)
            }
          }
        } catch (error) {
          // Schema processing failed, continue without it
          yield* Console.log('⚠️  Schema processing failed, generating generic image')
        }
      }
      
      // Determine dimensions based on layout
      let width = 1200
      let height = 400
      
      if (layout === 'asymmetric') {
        // Square/portrait aspect ratio for side-by-side layout
        width = 800
        height = 800
        yield* Console.log(`📐 Layout: asymmetric (square aspect ratio)`)
      } else if (layout === 'cinematic') {
        // Wide aspect ratio for full-width banner
        width = 1600
        height = 400
        yield* Console.log(`📐 Layout: cinematic (wide aspect ratio)`)
      } else {
        // Auto: same as asymmetric now since asymmetric is the default
        width = 800
        height = 800
        yield* Console.log(`📐 Layout: auto (using asymmetric aspect ratio)`)
      }
      
      // Generate image - default to 'illustration' style for asymmetric layout
      const defaultStyle = layout === 'asymmetric' ? 'illustration' : 'modern'
      const style = aiConfig.style || defaultStyle
      yield* Console.log(`🎨 Style: ${style}`)
      if (layout === 'asymmetric' && !aiConfig.style) {
        yield* Console.log(`   (Using illustration style for better placement next to text)`)
      }
      yield* Console.log('🤖 Using Pollinations.ai (free, no API key required)')
      
      const service = new AiImageGeneration.AiImageGenerationService()
      const generationConfig = {
        config: {
          enabled: true,
          style,
          prompt: customPrompt,
          width: aiConfig.width || width,
          height: aiConfig.height || height,
          seed: aiConfig.seed,
          nologo: aiConfig.nologo !== false,
          cache: false, // Disable cache to get fresh images
        },
        schema,
        projectName: config.name,
        layout,
      }
      
      // Get topics from config if available
      const topics = (configInput as any)?.home?.topics
      
      // Build the prompt that will be used
      const schemaContext = schema 
        ? { ...AiImageGeneration.analyzeSchema(schema), topics }
        : {
            mainTypes: [],
            queryNames: [],
            mutationNames: [],
            subscriptionNames: [],
            suggestedTheme: 'modern API',
            topics
          }
      
      const finalPrompt = customPrompt || AiImageGeneration.buildPrompt(
        schemaContext,
        style,
        undefined,
        layout
      )
      
      yield* Console.log(`📝 Prompt: ${finalPrompt.substring(0, 150)}...`)
      
      // Let errors bubble up naturally
      const image = yield* Effect.promise(() => service.generate(generationConfig))
      
      if (!image) {
        yield* Console.log('❌ Failed to generate image')
        return
      }
      
      // Download image
      yield* Console.log('📥 Downloading generated image...')
      yield* Console.log(`   Pollinations URL: ${image.url}`)
      
      // Wait a moment for Pollinations to generate the image on-demand
      yield* Effect.sleep('2 seconds')
      
      const response = yield* Effect.promise(() => fetch(image.url))
      
      if (!response.ok) {
        yield* Console.log(`❌ Failed to download image: ${response.statusText}`)
        return
      }
      
      const buffer = yield* Effect.promise(() => response.arrayBuffer())
      
      // Backup existing hero image unless --overwrite is specified
      if (!overwrite) {
        yield* backupExistingHeroImage(dir)
      }
      
      // Save to public directory
      const fs = yield* FileSystem.FileSystem
      const outputPath = Path.join(dir, 'public', 'hero.png')
      const publicDir = Path.join(dir, 'public')
      
      // Ensure public directory exists
      yield* fs.makeDirectory(publicDir, { recursive: true }).pipe(
        Effect.catchIf(
          error => error._tag === 'SystemError' && error.reason === 'AlreadyExists',
          () => Effect.succeed(undefined)
        )
      )
      
      // Write the image file
      yield* fs.writeFile(outputPath, new Uint8Array(buffer))
      
      yield* Console.log(`✅ Saved to: public/hero.png`)
      yield* Console.log(`\n📝 Polen will automatically use this Pollinations-generated image.`)
      yield* Console.log(`   To regenerate with different settings, run this command again.`)
      yield* Console.log(`   To use a custom image instead, update your config:`)
      yield* Console.log(`
  home: {
    hero: {
      heroImage: '/custom-hero.png'
    }
  }`)
    }).pipe(Effect.provide(NodeFileSystem.layer))
).pipe(
  Command.withDescription('Generate AI hero image using Pollinations.ai')
)