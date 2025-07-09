/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface HstackProperties {
   justify?: SystemProperties["justifyContent"]
	gap?: SystemProperties["gap"]
}

interface HstackStyles extends HstackProperties, DistributiveOmit<SystemStyleObject, keyof HstackProperties > {}

interface HstackPatternFn {
  (styles?: HstackStyles): string
  raw: (styles?: HstackStyles) => SystemStyleObject
}


export declare const hstack: HstackPatternFn;
