/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface CenterProperties {
   inline?: ConditionalValue<boolean>
}

interface CenterStyles extends CenterProperties, DistributiveOmit<SystemStyleObject, keyof CenterProperties > {}

interface CenterPatternFn {
  (styles?: CenterStyles): string
  raw: (styles?: CenterStyles) => SystemStyleObject
}


export declare const center: CenterPatternFn;
