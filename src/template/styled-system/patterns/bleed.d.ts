/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface BleedProperties {
   inline?: SystemProperties["marginInline"]
	block?: SystemProperties["marginBlock"]
}

interface BleedStyles extends BleedProperties, DistributiveOmit<SystemStyleObject, keyof BleedProperties > {}

interface BleedPatternFn {
  (styles?: BleedStyles): string
  raw: (styles?: BleedStyles) => SystemStyleObject
}


export declare const bleed: BleedPatternFn;
