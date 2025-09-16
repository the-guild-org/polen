import type { S } from '#lib/kit-temp'
import type { ModuleIndex } from './$types.js'

import * as Argument from './argument.js'
import * as Field from './field.js'
import * as ResolvedType from './resolved-type.js'
import * as Root from './root.js'
import * as Type from './type.js'

export type $Any = S.Schema.Type<ModuleIndex[keyof ModuleIndex]['Schema']>

export const All = [Argument, Field, ResolvedType, Root, Type]
