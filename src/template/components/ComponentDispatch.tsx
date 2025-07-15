import React from 'react'

/**
 * A generic component dispatcher that dynamically renders components from a namespace.
 *
 * Useful for cases where you need to select and render a component at runtime based on
 * a string key, while maintaining some level of type safety through generics.
 *
 * @template TComponents - The object/namespace containing the components
 * @template TName - The key type for component selection (constrained to keyof TComponents)
 *
 * @param components - The namespace/object containing the components to choose from
 * @param name - The key to select which component to render
 * @param props - The props to pass to the selected component
 *
 * @example
 * ```tsx
 * import * as MyComponents from './MyComponents'
 *
 * const componentName = getComponentName(data)
 * return (
 *   <ComponentDispatch
 *     components={MyComponents}
 *     name={componentName}
 *     props={{ data }}
 *   />
 * )
 * ```
 */
export const ComponentDispatch = <
  TComponents extends Record<string, React.ComponentType<any>>,
  TName extends keyof TComponents,
>(
  { components, name, props }: {
    components: TComponents
    name: TName
    props: object
  },
) => {
  const Component = components[name]
  return React.createElement(Component as any, props)
}
