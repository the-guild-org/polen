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

    testFn.for<Case<caseInput>>(cases)(nameTemplate, (caseInput, context) => {
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

      runner(caseInput as CaseFilled & caseInput, context)
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
   * // dprint-ignore
   * Test.suite<{
   *   input: string
   *   expected: number
   * }>('string length', [
   *   { name: 'short string',    input: 'hi',     expected: 2 },
   *   { name: 'medium string',   input: 'hello',  expected: 5 },
   *   { name: 'long string',     input: 'world!', expected: 6 },
   * ], ({ input, expected }) => {
   *   expect(input.length).toBe(expected)
   * })
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
   * - For simple types, prefer inline typing with `// dprint-ignore` and column alignment
   *   over separate interface declarations for better readability.
   */
  export function suite<$Case extends object>(
    description: string,
    cases: Case<$Case>[],
    runner: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>
  ): void
  export function suite<$Case extends object>(
    description: string,
    nameTemplate: string,
    cases: Case<$Case>[],
    runner: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>
  ): void
  export function suite<$Case extends object>(
    description: string,
    arg2: string | Case<$Case>[],
    arg3: Case<$Case>[] | ((caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>),
    arg4?: (caseInput: CaseFilled & $Case, context: TestContext) => void | Promise<void>,
  ) {
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
}
