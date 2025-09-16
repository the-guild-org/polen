import { Effect, Layer } from 'effect'
import { describe, test, type TestContext } from 'vitest'

/**
 * Enhanced test utilities for parameterized testing with Vitest.
 *
 * Provides a declarative API for table-driven tests with built-in support for
 * todo and skip cases, reducing boilerplate and improving test maintainability.
 *
 * @example Basic usage with formatting best practices
 * ```typescript
 * interface MathCase {
 *   a: number
 *   b: number
 *   expected: number
 * }
 *
 * // dprint-ignore
 * const cases: Test.Case<MathCase>[] = [
 *   { name: '2 + 2 = 4',         a: 2, b: 2, expected: 4 },
 *   { name: '3 + 5 = 8',         a: 3, b: 5, expected: 8 },
 *   { name: 'negative numbers',  todo: 'Not implemented yet' },
 * ]
 *
 * Test.each(cases, (case_) => {
 *   const { a, b, expected } = case_
 *   expect(add(a, b)).toBe(expected)
 * })
 * ```
 *
 * @example Column formatting for complex cases
 * ```typescript
 * interface ComplexCase {
 *   input: string
 *   transform: 'upper' | 'lower' | 'capitalize'
 *   expected: string
 *   description?: string
 * }
 *
 * // dprint-ignore - Preserves column alignment for readability
 * const cases: Test.Case<ComplexCase>[] = [
 *   { name: 'uppercase transform',
 *     input: 'hello', transform: 'upper', expected: 'HELLO' },
 *   { name: 'lowercase transform with long description',
 *     input: 'WORLD', transform: 'lower', expected: 'world',
 *     description: 'This is a very long description that would break alignment' },
 *   { name: 'capitalize first letter',
 *     input: 'test', transform: 'capitalize', expected: 'Test' },
 * ]
 * ```
 *
 * @example With skip cases
 * ```typescript
 * const cases: Test.Case<MyCase>[] = [
 *   { name: 'normal case', input: 'foo', expected: 'bar' },
 *   { name: 'edge case', input: '', expected: '', skip: 'Flaky on CI' },
 *   { name: 'future feature', todo: true },
 * ]
 * ```
 *
 * @example With advanced features
 * ```typescript
 * const cases: Test.Case<TestData>[] = [
 *   { name: 'basic test', data: 'foo', expected: 'bar' },
 *   { name: 'windows only', data: 'baz', expected: 'qux',
 *     skipIf: () => process.platform !== 'win32' },
 *   { name: 'focus on this', data: 'test', expected: 'result', only: true },
 *   { name: 'integration test', data: 'api', expected: 'response',
 *     tags: ['integration', 'api'] },
 * ]
 * ```
 */
export namespace Test {
  /**
   * Represents a test case that will be executed.
   * Can be temporarily skipped with an optional reason.
   */
  export interface CaseFilled {
    /** Descriptive name for the test case */
    name: string
    /** Skip this test case. If string, provides skip reason */
    skip?: boolean | string
    /** Conditionally skip this test case based on runtime condition */
    skipIf?: () => boolean
    /** Run only this test case (and other test cases marked with only) */
    only?: boolean
    /** Tags for categorizing and filtering test cases */
    tags?: string[]
  }

  /**
   * Represents a test case that is not yet implemented.
   * Will be marked as todo in the test output.
   */
  export interface CaseTodo {
    /** Descriptive name for the test case */
    name: string
    /** Mark as todo. If string, provides todo reason */
    todo: boolean | string
  }

  /**
   * A test case that can be either executable, skipped, or marked as todo.
   *
   * @typeParam $Input - Additional properties required for the test case.
   *                     When no additional properties are needed, defaults to empty object.
   *
   * @example With input properties
   * ```typescript
   * interface StringCase {
   *   input: string
   *   expected: string
   * }
   *
   * const cases: Test.Case<StringCase>[] = [
   *   { name: 'uppercase', input: 'hello', expected: 'HELLO' },
   *   { name: 'empty string', input: '', expected: '' },
   *   { name: 'unicode support', todo: 'Implement unicode handling' },
   * ]
   * ```
   */
  export type Case<$Input extends object = object> =
    | (object extends $Input ? CaseFilled : (CaseFilled & $Input))
    | CaseTodo

  /**
   * Executes a parameterized test for each case in the provided array.
   *
   * Automatically handles todo, skip, skipIf, and only cases, reducing boilerplate
   * compared to using `test.for` directly.
   *
   * @example Basic test with default name
   * ```typescript
   * Test.each(cases, (case_) => {
   *   // No type assertion needed - properties are automatically typed
   *   const { input, expected } = case_
   *   expect(transform(input)).toBe(expected)
   * })
   * ```
   *
   * @example With custom name template
   * ```typescript
   * Test.each('transform $input to $expected', cases, (case_) => {
   *   const { input, expected } = case_
   *   expect(transform(input)).toBe(expected)
   * })
   * ```
   *
   * @example Name template syntax
   * ```typescript
   * // Access nested properties with dot notation
   * Test.each('$user.name is $age years old', cases, (case_) => {
   *   const { user, age } = case_
   *   expect(getAge(user)).toBe(age)
   * })
   *
   * // Use any case property in the template
   * Test.each('$method: $input → $output', cases, (case_) => {
   *   const { method, input, output } = case_
   *   expect(process(method, input)).toBe(output)
   * })
   * ```
   *
   * @remarks
   * - Default uses the `name` property from each case
   * - Custom templates use `$property` syntax for interpolation
   * - Todo cases are automatically skipped with their todo message
   * - Skip cases are skipped with their skip reason
   * - SkipIf conditionally skips based on runtime evaluation
   * - Only cases use test.only to focus on specific tests
   * - Tags can be used for categorization (future filtering support)
   * - The runner function is only called for executable cases (not todo/skip)
   * - Case properties are automatically typed in the runner function
   */
  export function each<caseInput extends object>(
    cases: Case<caseInput>[],
    runner: (caseInput: CaseFilled & caseInput, context: TestContext) => void | Promise<void>,
  ): void
  export function each<caseInput extends object>(
    nameTemplate: string,
    cases: Case<caseInput>[],
    runner: (caseInput: CaseFilled & caseInput, context: TestContext) => void | Promise<void>,
  ): void
  export function each<caseInput extends object>(
    arg1: string | Case<caseInput>[],
    arg2: Case<caseInput>[] | ((caseInput: CaseFilled & caseInput, context: TestContext) => void | Promise<void>),
    arg3?: (caseInput: CaseFilled & caseInput, context: TestContext) => void | Promise<void>,
  ) {
    const nameTemplate = typeof arg1 === 'string' ? arg1 : '$name'
    const cases = typeof arg1 === 'string' ? arg2 as Case<caseInput>[] : arg1
    const runner = typeof arg1 === 'string' ? arg3! : arg2 as (caseInput: CaseFilled & caseInput, context: TestContext) => void | Promise<void>

    // Check if any cases have 'only' set
    const hasOnly = cases.some(c => 'only' in c && c.only === true)
    const testFn = hasOnly ? test.only : test

    testFn.for<Case<caseInput>>(cases)(nameTemplate, async (caseInput, context) => {
      if ('todo' in caseInput) {
        const { todo } = caseInput
        context.skip(typeof todo === 'string' ? todo : undefined)
        return
      }

      const filledCase = caseInput as CaseFilled

      // Handle skip
      if (filledCase.skip) {
        context.skip(typeof filledCase.skip === 'string' ? filledCase.skip : undefined)
        return
      }

      // Handle skipIf
      if (filledCase.skipIf?.()) {
        context.skip('Skipped by condition')
        return
      }

      // If we're using test.only, skip cases that don't have only: true
      if (hasOnly && !filledCase.only) {
        context.skip('Skipped - focusing on only tests')
        return
      }

      await runner(caseInput as CaseFilled & caseInput, context)
    })
  }

  /**
   * Creates a test suite that combines describe and Test.each for cleaner table-driven tests.
   *
   * This reduces boilerplate by automatically wrapping Test.each in a describe block,
   * eliminating the need for separate interface declarations and nested structures.
   *
   * @example Basic usage
   * ```typescript
   * Test.suite<{ input: string; expected: string }>('string transformations', [
   *   { name: 'uppercase', input: 'hello', expected: 'HELLO' },
   *   { name: 'lowercase', input: 'WORLD', expected: 'world' },
   * ], ({ input, expected }) => {
   *   expect(transform(input)).toBe(expected)
   * })
   * ```
   *
   * @example With custom name template
   * ```typescript
   * interface MathCase {
   *   a: number
   *   b: number
   *   expected: number
   * }
   *
   * Test.suite<MathCase>('math operations', '$a + $b = $expected', [
   *   { name: 'addition', a: 2, b: 3, expected: 5 },
   *   { name: 'subtraction', a: 5, b: 3, expected: 2 },
   * ], ({ a, b, expected }) => {
   *   expect(calculate(a, b)).toBe(expected)
   * })
   * ```
   *
   * @example With nested expected property pattern (recommended for complex cases)
   * ```typescript
   * interface ComplexCase {
   *   input: string
   *   transform: 'upper' | 'lower'
   *   locale: string
   *   options: { trim: boolean; normalize: boolean }
   *   expected: {
   *     result: string
   *     length: number
   *     metadata: { processed: boolean; warnings?: string[] }
   *   }
   * }
   *
   * // Using expected property pattern keeps expectations together on one line
   * Test.suite<ComplexCase>('complex transformations', [
   *   { name: 'uppercase with trimming',
   *     input: '  hello  ',
   *     transform: 'upper',
   *     locale: 'en-US',
   *     options: { trim: true, normalize: false },
   *     expected: { result: 'HELLO', length: 5, metadata: { processed: true } } },
   *   { name: 'lowercase normalized',
   *     input: 'WORLD',
   *     transform: 'lower',
   *     locale: 'de-DE',
   *     options: { trim: false, normalize: true },
   *     expected: { result: 'world', length: 5, metadata: { processed: true, warnings: ['normalized'] } } },
   * ], ({ input, transform, locale, options, expected }) => {
   *   const result = complexTransform(input, transform, locale, options)
   *   expect(result.value).toBe(expected.result)
   *   expect(result.length).toBe(expected.length)
   *   expect(result.metadata).toEqual(expected.metadata)
   * })
   * ```
   *
   * @example Inline case typing with column alignment
   * ```typescript
   * Test.suite<{
   *   input: string
   *   expected: number
   * }>(
   *   'string length',
   *   // dprint-ignore
   *   [
   *     { name: 'short string',    input: 'hi',     expected: 2 },
   *     { name: 'medium string',   input: 'hello',  expected: 5 },
   *     { name: 'long string',     input: 'world!', expected: 6 },
   *   ],
   *   ({ input, expected }) => {
   *     expect(input.length).toBe(expected)
   *   }
   * )
   * ```
   *
   * @example With todo and skip cases
   * ```typescript
   * Test.suite<{ feature: string }>('feature tests', [
   *   { name: 'implemented feature', feature: 'login' },
   *   { name: 'upcoming feature', todo: 'Not implemented yet' },
   *   { name: 'flaky test', feature: 'api', skip: 'Flaky on CI' },
   * ], ({ feature }) => {
   *   expect(isFeatureEnabled(feature)).toBe(true)
   * })
   * ```
   *
   * @remarks
   * - Type parameter is mandatory to encourage explicit typing
   * - Supports all Test.each features (todo, skip, only, etc.)
   * - Automatically handles describe block creation
   * - Name template is optional - defaults to using the 'name' property
   * - Best practice: Use an `expected` property to group all expected values together,
   *   especially when test cases have many fields and span multiple lines. This keeps
   *   the expected outcomes clearly visible on a single line per case.
   * - For simple types, prefer inline typing with column alignment over separate interface
   *   declarations for better readability.
   * - Place `// dprint-ignore` comment directly before the array literal only, not before
   *   the entire Test.suite call. This preserves column alignment for test cases while
   *   allowing normal formatting for the rest of the code.
   */
   interface SuiteBase {
     <$Case extends object>(
       description: string,
       cases: Case<$Case>[],
       runner: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>
     ): void
     <$Case extends object>(
       description: string,
       nameTemplate: string,
       cases: Case<$Case>[],
       runner: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>
     ): void
   }

  interface Suite extends SuiteBase {
    only: SuiteBase
  }

  // export function suite<$Case extends object>(
  //   description: string,
  //   cases: Case<$Case>[],
  //   runner: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>
  // ): void
  // export function suite<$Case extends object>(
  //   description: string,
  //   nameTemplate: string,
  //   cases: Case<$Case>[],
  //   runner: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>
  // ): void
  export const suite: Suite = <$Case extends object>(
    description: string,
    arg2: string | Case<$Case>[],
    arg3: Case<$Case>[] | ((caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>),
    arg4?: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>,
  ) => {
    describe(description, () => {
      if (typeof arg2 === 'string') {
        // Called with custom name template
        each(arg2, arg3 as Case<$Case>[], arg4!)
      } else {
        // Called without custom name template
        each(arg2, arg3 as (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>)
      }
    })
  }

  suite.only = <$Case extends object>(
    description: string,
    arg2: string | Case<$Case>[],
    arg3: Case<$Case>[] | ((caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>),
    arg4?: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>,
  ) => {
    describe.only(description, () => {
      if (typeof arg2 === 'string') {
        // Called with custom name template
        each(arg2, arg3 as Case<$Case>[], arg4!)
      } else {
        // Called without custom name template
        each(arg2, arg3 as (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>)
      }
    })
  }

  //
  // Effect Test Suite Support
  //

  /**
   * Test function that returns an Effect for use with Effect-based test suites.
   *
   * The function receives a test case (merged with CaseFilled properties) and must return
   * an Effect that performs the test logic. The Effect will be automatically executed
   * with appropriate layers and error handling.
   *
   * @template $Case - The test case type containing input data and expected results
   * @template $Error - The error type the Effect can fail with (typically never or Error)
   * @template $Requirements - The context requirements that must be satisfied by layers
   *
   * @param testCase - Test case data merged with Test.CaseFilled properties (name, skip, etc.)
   * @returns Effect that performs the test, typically yielding void on success
   */
  export type EffectTestFn<$Case, $Error, $Requirements> = (
    testCase: CaseFilled & $Case
  ) => Effect.Effect<void, $Error, $Requirements>

  /**
   * Creates Effect-based test suites with automatic layer provision and Effect execution.
   *
   * This curried function enables front-loading layers while constraining test functions
   * to return Effects. Each test case is automatically wrapped in vitest's test framework
   * with proper error handling, skip/todo support, and Effect execution.
   *
   * **Key Features:**
   * - Type-safe test functions that must return Effects
   * - Automatic layer provision via `Effect.provide`
   * - Full support for todo, skip, skipIf, and only test cases
   * - Perfect type inference for test case properties
   * - Natural parameter destructuring in test functions
   *
   * @example Basic usage with single layer
   * ```typescript
   * interface LoadCase {
   *   config: Config
   *   expected: { result: string | null }
   * }
   *
   * const testWithSchema = Test.suiteWithLayers(TestLayers.schema)
   *
   * testWithSchema<LoadCase>('Schema operations', [
   *   { name: 'no config', config: {}, expected: { result: null } },
   *   { name: 'with config', config: { enabled: true }, expected: { result: 'loaded' } },
   * ], ({ config, expected }) => Effect.gen(function* () {
   *   const result = yield* Schema.loadOrNull(config)  // Schema service available
   *   expect(result).toEqual(expected.result)
   * }))
   * ```
   *
   * @example Multiple layers with complex requirements
   * ```typescript
   * const testIntegration = Test.suiteWithLayers(
   *   Layer.merge(TestLayers.database, TestLayers.fileSystem, TestLayers.httpClient)
   * )
   *
   * testIntegration<ApiTestCase>('API integration', cases,
   *   ({ endpoint, payload, expected }) => Effect.gen(function* () {
   *     // All services from merged layers are available
   *     const data = yield* Database.findById(payload.id)
   *     const file = yield* FileSystem.readFile(data.configPath)
   *     const response = yield* HttpClient.post(endpoint, { ...payload, config: file })
   *     expect(response.status).toBe(expected.status)
   *   })
   * )
   * ```
   *
   * @example With test case modifiers
   * ```typescript
   * testWithLayers<TestCase>('feature tests', [
   *   { name: 'working case', input: 'valid', expected: 'output' },
   *   { name: 'todo case', todo: 'Need to implement validation' },
   *   { name: 'skipped case', input: 'flaky', expected: 'result', skip: 'Flaky on CI' },
   *   { name: 'focused case', input: 'debug', expected: 'test', only: true },
   * ], ({ input, expected }) => Effect.gen(function* () {
   *   const result = yield* processInput(input)
   *   expect(result).toBe(expected)
   * }))
   * ```
   *
   * @example Error handling in Effects
   * ```typescript
   * testWithLayers<ErrorCase>('error scenarios', cases,
   *   ({ input, shouldFail }) => Effect.gen(function* () {
   *     if (shouldFail) {
   *       // Effect failures are properly caught and reported
   *       yield* Effect.fail(new Error('Expected failure'))
   *     } else {
   *       const result = yield* processInput(input)
   *       expect(result).toBeDefined()
   *     }
   *   })
   * )
   * ```
   *
   * @example Typed error handling with withErrors
   * ```typescript
   * class ValidationError extends Error {
   *   constructor(message: string) { super(message) }
   * }
   *
   * // Use .withErrors<T>() for precise error type constraints
   * testWithLayers.withErrors<ValidationError>()<UserCase>('validation tests', cases,
   *   ({ user, shouldValidate }) => Effect.gen(function* () {
   *     if (!shouldValidate) {
   *       // Type-safe - can only fail with ValidationError
   *       yield* Effect.fail(new ValidationError('Invalid user'))
   *     }
   *     const result = yield* validateUser(user)
   *     expect(result.isValid).toBe(true)
   *   })
   * )
   * ```
   *
   * @template $Requirements - Context requirements that the layers parameter must satisfy
   * @param layers - Layer providing services/context required by test Effects
   * @returns Curried function that accepts test suite parameters and creates the suite
   *
   * @remarks
   * **Two API variants available:**
   * - **Simple**: `testWithLayers<$Case>(description, cases, testFn)` - error types inferred as `any`
   * - **Typed**: `testWithLayers.withErrors<$Error>()<$Case>(description, cases, testFn)` - precise error types
   *
   * **Type signatures:**
   * - Main function: Only `$Case` type parameter required
   * - WithErrors function: `$Error` type parameter for error constraint, then `$Case` parameter
   * - Test functions return `Effect<void, $Error, $Requirements>`
   *
   * **Implementation details:**
   * - All test case properties available with proper type inference
   * - Effects executed with `Effect.runPromise` for vitest compatibility
   * - Layer provision automatic via `Effect.provide(effect, layers)`
   * - Full support for Test.Case features (skip, todo, only, skipIf, tags)
   * - Both APIs share the same underlying implementation for consistency
   */
  export function suiteWithLayers<$Requirements>(
    layers: Layer.Layer<$Requirements>
  ) {
    const createSuite = <$Case extends object, $Error = any>(
      description: string,
      cases: Case<$Case>[],
      testFn: (testCase: CaseFilled & $Case) => Effect.Effect<void, $Error, $Requirements>
    ): void => {
      describe(description, () => {
        // Check if any cases have 'only' set
        const hasOnly = cases.some(c => 'only' in c && c.only === true)
        const viTestFn = hasOnly ? test.only : test

        viTestFn.for<Case<$Case>>(cases)('$name', async (caseInput, context) => {
          if ('todo' in caseInput) {
            const { todo } = caseInput
            context.skip(typeof todo === 'string' ? todo : undefined)
            return
          }

          const filledCase = caseInput as CaseFilled & $Case

          // Handle skip
          if (filledCase.skip) {
            context.skip(typeof filledCase.skip === 'string' ? filledCase.skip : undefined)
            return
          }

          // Handle skipIf
          if (filledCase.skipIf?.()) {
            context.skip('Skipped by condition')
            return
          }

          // If we're using test.only, skip cases that don't have only: true
          if (hasOnly && !filledCase.only) {
            context.skip('Skipped - focusing on only tests')
            return
          }

          // Execute the Effect-based test
          const effect = testFn(filledCase)
          const effectWithLayers = Effect.provide(effect, layers)
          await Effect.runPromise(effectWithLayers)
        })
      })
    }

    // Main API - simple version with inferred error types
    const suite = <$Case extends object>(
      description: string,
      cases: Case<$Case>[],
      testFn: (testCase: CaseFilled & $Case) => Effect.Effect<void, any, $Requirements>
    ): void => {
      return createSuite<$Case, any>(description, cases, testFn)
    }

    // Extended API - typed error version
    suite.withErrors = <$Error>() => <$Case extends object>(
      description: string,
      cases: Case<$Case>[],
      testFn: (testCase: CaseFilled & $Case) => Effect.Effect<void, $Error, $Requirements>
    ): void => {
      return createSuite<$Case, $Error>(description, cases, testFn)
    }

    return suite
  }
}
