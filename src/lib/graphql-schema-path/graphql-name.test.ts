import { expect, test } from 'vitest'
import { GraphQLName } from './graphql-name.js'

test.for([
  'User',
  'posts',
  'createUser',
  '__typename',
  '_id',
  'field123',
  'Field_With_Underscores',
])('accepts valid name "%s"', (name) => {
  expect(() => GraphQLName.make(name)).not.toThrow()
})

test.for([
  '123field', // starts with number
  'field-name', // contains hyphen
  'field.name', // contains dot
  'field name', // contains space
  'field@name', // contains special character
  '', // empty string
])('rejects invalid name "%s"', (name) => {
  expect(() => GraphQLName.make(name)).toThrow()
})
