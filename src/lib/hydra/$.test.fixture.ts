import { Hydratable } from '#lib/hydra/hydratable'
import { S } from '#lib/kit-temp/effect'

// const $Union = <members extends S.TaggedStruct<any, any>[]>(...members: members) => S.Union(...members)
export const $Fields = <fields extends S.Struct.Fields>(fields: fields) => S.TaggedStruct('A', { ...fields })
export const $Field = <field extends S.Schema.All>(field: field) => $Fields({ x: field })
export const $Empty = $Fields({})

/**
 * Plain Data
 */
export namespace D {
  export const A = S.TaggedStruct('A', { x: S.Number })
  export const B = S.TaggedStruct('B', { x: S.Number, y: S.String })
}
export namespace H {
  export const A = Hydratable(D.A)
  export const B = Hydratable(D.B)
}
