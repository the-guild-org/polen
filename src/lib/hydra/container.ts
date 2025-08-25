import { Uhl } from '#lib/hydra/uhl/$'
import { zd } from '#lib/kit-temp/other'
import { Obj } from '@wollybeard/kit'
import type * as SAst from 'effect/SchemaAST'
import { Hydratable } from './hydratable/$.js'
import { Value } from './value/$.js'

export const deeplyVisitHydratables = (
  container: Container,
  hydratableContext: Hydratable.Context,
  visitor: (hydratable: Value.Hydratable, uhl: Uhl.Uhl) => void,
) => {
  _deeplyVisitHydratables(container, hydratableContext, visitor, {
    uhl: Uhl.makeRoot(),
    seen: new WeakSet(),
  })
}

const _deeplyVisitHydratables = (
  container: Container,
  hydratableContext: Hydratable.Context,
  visitor: (hydratable: Value.Hydratable, uhl: Uhl.Uhl) => void,
  recursionContext: { uhl: Uhl.Uhl; seen: WeakSet<object> },
) => {
  const schema = recursionContext.uhl._tag === 'UhlRoot'
    ? hydratableContext.originalSchema
    : getNonRootContainerSchema(container, hydratableContext)

  const ast = schema.ast

  _deeplyVisitHydratablesTraverseRegisteredSchema(
    container,
    hydratableContext,
    visitor,
    recursionContext,
    ast,
  )
}

const _deeplyVisitHydratablesTraverseRegisteredSchema = (
  value: Container,
  hydratableContext: Hydratable.Context,
  visitor: (hydratable: Value.Hydratable, uhl: Uhl.Uhl) => void,
  recursionContext: { uhl: Uhl.Uhl; seen: WeakSet<object> },
  ast: SAst.AST,
) => {
  // TODO: once confident, remove this in favour of opt-in above defaulitng to skip
  if (
    ast._tag === 'Literal'
    || ast._tag === 'NumberKeyword'
    || ast._tag === 'StringKeyword'
    || ast._tag === 'BigIntKeyword'
  ) {
    return
  }

  // zd(ast, Hydratable.getConfigMaybe(ast))
  // zd(ast, Hydratable.getConfigMaybeFromAstNode(ast))

  const hydratableSchemaConfig = Hydratable.getConfigMaybeFromAstNode(ast)
  if (hydratableSchemaConfig) {
    visitor(value as any, recursionContext.uhl)
    return
  }

  if (ast._tag === 'TypeLiteral') {
    ast.propertySignatures.forEach(ps => {
      const value_as_any = value as any

      const value_at_key = value_as_any[ps.name]
      if (!value_at_key) {
        throw new Error(`No value found at non-optional property: ${ps.name.toString()}`)
      }

      // const hydratableSchemaConfig = Hydratable.getConfigMaybeFromAnnotations(ps.annotations)
      // // console.log({ hydratableSchemaConfig })
      // if (hydratableSchemaConfig) {
      //   visitor(value as any, recursionContext.uhl)
      //   return
      // }

      _deeplyVisitHydratablesTraverseRegisteredSchema(
        value_at_key,
        hydratableContext,
        visitor,
        recursionContext,
        ps.type,
      )
    })
    return
  }

  if (ast._tag === 'TupleType') {
    const value_as_values = value as any[]
    value_as_values.forEach(value => {
      _deeplyVisitHydratablesTraverseRegisteredSchema(
        value,
        hydratableContext,
        visitor,
        recursionContext,
        ast.rest[0]!.type,
      )
    })
    return
  }

  console.log(ast, value)
  throw new Error(`FIXME: Currently unsupported AST type: "${ast._tag}" for deeplyMapHydratables`)
}

// const _deeplyVisitHydratablesDispatch = (
//   container: Container,
//   hydratableContext: Hydratable.Context,
//   visitor: (hydratable: Value.Hydratable, uhl: Uhl.Uhl) => void,
//   recursionContext: { uhl: Uhl.Uhl; seen: WeakSet<object> },
// )

const getNonRootContainerSchema = (
  container: Container,
  hydratableContext: Hydratable.Context,
) => {
  const tag = (container as any)?._tag
  if (!tag) {
    throw new Error(
      `container has no tag value or property. Keys: ${Object.keys(container).join(', ')}`,
    )
  }

  const schema = hydratableContext.astIndex?.get(tag)
  if (!schema) throw new Error(`No schema found for tag: ${tag}`)

  return schema
}

/**
 * A value that may contain properties that are hydrtable, or containers in turn.
 * It may itself also be a hydrtable.
 *
 * Examples:
 *
 * { x: someHydratable }
 * { xs: [someHydratable] }
 * { nested: { xs: [someHydratable] } }
 * { _tag: 'IAmhydratbletoo', nested: { x: someHydratable } }
 */
export type Container = object

export const mapContainerHydratables = (
  container: Container,
  context: Hydratable.Context,
  mapper: (hydratable: Value.Hydratable) => unknown,
) => {
  _mapContainerChildHydratables(container, context, mapper, new WeakSet())
}

const _mapContainerChildHydratables = (
  container: Container,
  context: Hydratable.Context,
  mapper: (hydratable: Value.Hydratable) => unknown,
  visited: WeakSet<object>,
) => {
  const containerCopy = { ...container }

  for (const [key, val] of Object.entries(containerCopy)) {
    if (Obj.is(val)) {
      // catch and skip circular references
      if (visited.has(val)) {
        continue
      }

      visited.add(val)

      const isHydratable = false // todo

      if (isHydratable) {
        ;(containerCopy as any)[key] = mapper(val as any)
      }

      if (Array.isArray(val)) {
        for (const item of val) {
          if (Obj.is(item)) {
            _mapContainerChildHydratables(item, context, mapper, visited)
          }
        }
      }

      _mapContainerChildHydratables(val, context, mapper, visited)
    }
  }
}
