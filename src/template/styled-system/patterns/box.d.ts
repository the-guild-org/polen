/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface BoxProperties {
   
}

interface BoxStyles extends BoxProperties, DistributiveOmit<SystemStyleObject, keyof BoxProperties > {}

interface BoxPatternFn {
  (styles?: BoxStyles): string
  raw: (styles?: BoxStyles) => SystemStyleObject
}


export declare const box: BoxPatternFn;
