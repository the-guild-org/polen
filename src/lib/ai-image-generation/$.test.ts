import { Effect } from 'effect'
import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { AiImageGeneration } from './$.js'

describe('AI Image Generation', () => {
  describe('analyzeSchema', () => {
    test('extracts context from e-commerce schema', () => {
      const schema = buildSchema(`
        type Product {
          id: ID!
          name: String!
          price: Float!
        }
        
        type Cart {
          id: ID!
          items: [Product!]!
        }
        
        type Query {
          products: [Product!]!
          cart(id: ID!): Cart
        }
        
        type Mutation {
          addToCart(productId: ID!): Cart!
        }
      `)

      const context = AiImageGeneration.analyzeSchema(schema)

      expect(context.domain).toBe('e-commerce')
      expect(context.suggestedTheme).toBe('digital marketplace')
      expect(context.mainTypes).toContain('Product')
      expect(context.mainTypes).toContain('Cart')
      expect(context.queryNames).toContain('products')
      expect(context.mutationNames).toContain('addToCart')
    })

    test('extracts context from social media schema', () => {
      const schema = buildSchema(`
        type User {
          id: ID!
          name: String!
        }
        
        type Post {
          id: ID!
          author: User!
          content: String!
        }
        
        type Comment {
          id: ID!
          post: Post!
          author: User!
          text: String!
        }
        
        type Query {
          users: [User!]!
          posts: [Post!]!
        }
      `)

      const context = AiImageGeneration.analyzeSchema(schema)

      expect(context.domain).toBe('social')
      expect(context.suggestedTheme).toBe('connected network')
      expect(context.mainTypes).toContain('User')
      expect(context.mainTypes).toContain('Post')
      expect(context.mainTypes).toContain('Comment')
    })

    test('extracts context from analytics schema', () => {
      const schema = buildSchema(`
        type Metric {
          id: ID!
          name: String!
          value: Float!
        }
        
        type Report {
          id: ID!
          metrics: [Metric!]!
        }
        
        type Dashboard {
          id: ID!
          reports: [Report!]!
        }
        
        type Query {
          dashboard: Dashboard!
          metrics: [Metric!]!
        }
      `)

      const context = AiImageGeneration.analyzeSchema(schema)

      expect(context.domain).toBe('analytics')
      expect(context.suggestedTheme).toBe('data visualization')
      expect(context.mainTypes).toContain('Metric')
      expect(context.mainTypes).toContain('Report')
      expect(context.mainTypes).toContain('Dashboard')
    })

    test('handles generic schema without specific domain', () => {
      const schema = buildSchema(`
        type Item {
          id: ID!
          name: String!
        }
        
        type Query {
          items: [Item!]!
        }
      `)

      const context = AiImageGeneration.analyzeSchema(schema)

      expect(context.domain).toBeUndefined()
      expect(context.suggestedTheme).toBeUndefined()
      expect(context.mainTypes).toContain('Item')
    })
  })

  describe('buildPrompt', () => {
    test('uses custom prompt when provided', () => {
      const context: AiImageGeneration.SchemaContext = {
        mainTypes: [],
        queryNames: [],
        mutationNames: [],
        subscriptionNames: [],
      }

      const prompt = AiImageGeneration.buildPrompt(
        context,
        'modern',
        'Beautiful landscape with mountains',
      )

      expect(prompt).toContain('Beautiful landscape with mountains')
      expect(prompt).toContain('modern clean design')
    })

    test('generates e-commerce themed prompt', () => {
      const context: AiImageGeneration.SchemaContext = {
        mainTypes: ['Product', 'Cart'],
        queryNames: ['products'],
        mutationNames: ['addToCart'],
        subscriptionNames: [],
        domain: 'e-commerce',
        suggestedTheme: 'digital marketplace',
      }

      const prompt = AiImageGeneration.buildPrompt(context, 'vibrant')

      expect(prompt).toContain('digital marketplace')
      expect(prompt).toContain('all about transactions, style, markets, trade, living')
      expect(prompt).toContain('vibrant colors')
      expect(prompt).toContain('no text')
    })

    test('generates social themed prompt', () => {
      const context: AiImageGeneration.SchemaContext = {
        mainTypes: ['User', 'Post'],
        queryNames: ['users'],
        mutationNames: [],
        subscriptionNames: [],
        domain: 'social',
        suggestedTheme: 'connected network',
      }

      const prompt = AiImageGeneration.buildPrompt(context, 'futuristic')

      expect(prompt).toContain('connected network')
      expect(prompt).toContain('all about community, connections, sharing, communication, networks')
      expect(prompt).toContain('futuristic sci-fi')
      expect(prompt).toContain('no text')
    })

    test('generates analytics themed prompt', () => {
      const context: AiImageGeneration.SchemaContext = {
        mainTypes: ['Metric', 'Dashboard'],
        queryNames: ['metrics'],
        mutationNames: [],
        subscriptionNames: [],
        domain: 'analytics',
        suggestedTheme: 'data visualization',
      }

      const prompt = AiImageGeneration.buildPrompt(context, 'technical')

      expect(prompt).toContain('data visualization')
      expect(prompt).toContain('all about data, insights, metrics, visualization, trends')
      expect(prompt).toContain('technical blueprint')
      expect(prompt).toContain('no text')
    })

    test.for([
      { style: 'modern' as const, expected: 'modern clean design' },
      { style: 'minimalist' as const, expected: 'minimalist flat design' },
      { style: 'abstract' as const, expected: 'abstract artistic' },
      { style: 'geometric' as const, expected: 'geometric patterns' },
      { style: 'gradient' as const, expected: 'gradient mesh' },
    ])('includes style description for "$style"', ({ style, expected }) => {
      const context: AiImageGeneration.SchemaContext = {
        mainTypes: [],
        queryNames: [],
        mutationNames: [],
        subscriptionNames: [],
      }

      const prompt = AiImageGeneration.buildPrompt(context, style)
      expect(prompt).toContain(expected)
    })
  })

  describe('Pollinations Provider', () => {
    test('generates correct URL format', async () => {
      const { generateImage } = await import('./providers/pollinations.js')

      const result = await generateImage({
        prompt: 'Abstract API visualization',
        width: 1200,
        height: 400,
        nologo: true,
      })

      expect(result.url).toContain('https://image.pollinations.ai/prompt/')
      expect(result.url).toContain('Abstract%20API%20visualization')
      expect(result.url).toContain('width=1200')
      expect(result.url).toContain('height=400')
      expect(result.url).toContain('nologo=true')
      expect(result.cached).toBe(false)
    })

    test('includes seed when provided', async () => {
      const { generateImage } = await import('./providers/pollinations.js')

      const result = await generateImage({
        prompt: 'Test prompt',
        seed: 12345,
      })

      expect(result.url).toContain('seed=12345')
    })
  })

  describe('AiImageConfig Schema', () => {
    test('validates correct configuration', () => {
      const config = {
        enabled: true,
        style: 'modern' as const,
        width: 1200,
        height: 400,
        seed: 12345,
        nologo: true,
        cache: true,
      }

      const result = Effect.runSync(AiImageGeneration.decode(config))
      expect(result).toEqual(config)
    })

    test('accepts optional fields', () => {
      const config = {
        enabled: true,
      }

      const result = Effect.runSync(AiImageGeneration.decode(config))
      expect(result).toEqual(config)
    })

    test('validates seed field', () => {
      const config = {
        enabled: true,
        seed: 42,
      }

      const result = Effect.runSync(AiImageGeneration.decode(config))
      expect(result.seed).toBe(42)
    })

    test('validates nologo field', () => {
      const config = {
        enabled: true,
        nologo: false,
      }

      const result = Effect.runSync(AiImageGeneration.decode(config))
      expect(result.nologo).toBe(false)
    })

    test('validates art style values', () => {
      const validStyles = [
        'modern',
        'minimalist',
        'abstract',
        'technical',
        'vibrant',
        'professional',
        'futuristic',
        'gradient',
        'geometric',
        'illustration',
      ]

      for (const style of validStyles) {
        const config = {
          enabled: true,
          style: style as AiImageGeneration.ArtStyle,
        }

        const result = Effect.runSync(AiImageGeneration.decode(config))
        expect(result.style).toBe(style)
      }
    })
  })

  describe('Service caching', () => {
    test('generates cache key from prompt', () => {
      const service = new AiImageGeneration.AiImageGenerationService()

      // Access private method through type assertion for testing
      const getCacheKey = (service as any).getCacheKey.bind(service)

      const key1 = getCacheKey('test prompt')
      const key2 = getCacheKey('different prompt')

      // Same prompt should generate same key
      expect(getCacheKey('test prompt')).toBe(key1)

      // Different prompts should generate different keys
      expect(key1).not.toBe(key2)

      // All keys should have pollinations prefix
      expect(key1).toContain('hero-pollinations-')
      expect(key2).toContain('hero-pollinations-')
    })
  })
})
