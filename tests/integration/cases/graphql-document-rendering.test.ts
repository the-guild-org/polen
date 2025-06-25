/**
 * Integration tests for GraphQL document rendering features
 */

import { Api } from '#api/index'
import type { FsLayout } from '@wollybeard/kit'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.ts'

test('GraphQL documents render with syntax highlighting', async ({ page, vite, project }) => {
  const fixture: FsLayout.Tree = {
    'pages/test.mdx': [
      'import { GraphQLDocumentWithSchema } from \'polen/components\'',
      '',
      '# Test Page',
      '',
      '<GraphQLDocumentWithSchema>',
      'query GetOrganization {',
      '  organization(reference: { slug: "example" }) {',
      '    id',
      '    name',
      '    slug',
      '    createdAt',
      '  }',
      '}',
      '</GraphQLDocumentWithSchema>',
    ].join('\n')
  }

  await project.layout.set(fixture)
  const viteConfig = await Api.ConfigResolver.fromMemory({ root: project.layout.cwd })
  const viteDevServer = await vite.startDevelopmentServer(viteConfig)

  await page.goto(viteDevServer.url('/test').href)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Allow React hydration

  // Check that GraphQL document is rendered
  const graphqlDocument = page.locator('[data-testid="graphql-document"]')
  await expect(graphqlDocument).toBeVisible()

  // Verify syntax highlighting is applied
  const codeBlock = graphqlDocument.locator('pre.shiki, pre code')
  await expect(codeBlock).toBeVisible()

  // Verify the GraphQL code content is present
  const codeContent = await codeBlock.textContent()
  expect(codeContent).toContain('query GetOrganization')
  expect(codeContent).toContain('organization')
})

test('GraphQL documents handle schema-less rendering gracefully', async ({ page, vite, project }) => {
  const fixture: FsLayout.Tree = {
    'pages/test.mdx': [
      'import { GraphQLDocumentWithSchema } from \'polen/components\'',
      '',
      '# Test Page Without Schema',
      '',
      '<GraphQLDocumentWithSchema>',
      'query TestQuery {',
      '  user {',
      '    id',
      '    name',
      '  }',
      '}',
      '</GraphQLDocumentWithSchema>',
    ].join('\n')
  }

  await project.layout.set(fixture)
  const viteConfig = await Api.ConfigResolver.fromMemory({ root: project.layout.cwd })
  const viteDevServer = await vite.startDevelopmentServer(viteConfig)

  await page.goto(viteDevServer.url('/test').href)
  await page.waitForLoadState('networkidle')

  // Should still render without errors
  const graphqlDocument = page.locator('[data-testid="graphql-document"]')
  await expect(graphqlDocument).toBeVisible()

  // Should still have syntax highlighting
  const codeBlock = graphqlDocument.locator('pre.shiki, pre code')
  await expect(codeBlock).toBeVisible()

  // Content should be present
  const codeContent = await codeBlock.textContent()
  expect(codeContent).toContain('query TestQuery')
})

test('Multiple GraphQL documents on same page work correctly', async ({ page, vite, project }) => {
  const fixture: FsLayout.Tree = {
    'pages/test.mdx': [
      'import { GraphQLDocumentWithSchema } from \'polen/components\'',
      '',
      '# Multiple GraphQL Documents',
      '',
      '## Query Example',
      '',
      '<GraphQLDocumentWithSchema>',
      'query GetUser {',
      '  user(id: "123") {',
      '    id',
      '    name',
      '  }',
      '}',
      '</GraphQLDocumentWithSchema>',
      '',
      '## Mutation Example',
      '',
      '<GraphQLDocumentWithSchema>',
      'mutation CreateUser {',
      '  createUser(input: { name: "John" }) {',
      '    id',
      '    name',
      '  }',
      '}',
      '</GraphQLDocumentWithSchema>',
    ].join('\n')
  }

  await project.layout.set(fixture)
  const viteConfig = await Api.ConfigResolver.fromMemory({ root: project.layout.cwd })
  const viteDevServer = await vite.startDevelopmentServer(viteConfig)

  await page.goto(viteDevServer.url('/test').href)
  await page.waitForLoadState('networkidle')

  // Count GraphQL documents
  const graphqlDocuments = page.locator('[data-testid="graphql-document"]')
  const count = await graphqlDocuments.count()
  expect(count).toBe(2)

  // Verify both documents render correctly
  const firstDoc = graphqlDocuments.first()
  const secondDoc = graphqlDocuments.nth(1)

  await expect(firstDoc).toBeVisible()
  await expect(secondDoc).toBeVisible()

  // Check content of each document
  const firstContent = await firstDoc.textContent()
  const secondContent = await secondDoc.textContent()

  expect(firstContent).toContain('query GetUser')
  expect(secondContent).toContain('mutation CreateUser')
})