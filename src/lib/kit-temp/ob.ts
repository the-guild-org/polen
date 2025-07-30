import type * as TF from 'type-fest'

export type PickWhereValueExtends<$Obj extends object, $Constraint> = {
  [k in keyof $Obj as $Obj[k] extends $Constraint ? k : never]: $Obj[k]
}

export type Values<$Obj extends object> = $Obj[keyof $Obj]

export type IsEmpty<$Obj extends object> = keyof $Obj extends never ? true : false

export type KeysArray<$Obj extends object> = Array<keyof $Obj>

export type KeysReadonlyArray<$Obj extends object> = ReadonlyArray<keyof $Obj>

export type OnlyKeysInArray<$Obj extends object, $KeysArray extends readonly string[]> = {
  [k in keyof $Obj as k extends $KeysArray[number] ? k : never]: $Obj[k]
}

export type Writeable<$Obj extends object> = TF.Writable<$Obj>
