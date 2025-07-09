/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface ContainerProperties {
   
}

interface ContainerStyles extends ContainerProperties, DistributiveOmit<SystemStyleObject, keyof ContainerProperties > {}

interface ContainerPatternFn {
  (styles?: ContainerStyles): string
  raw: (styles?: ContainerStyles) => SystemStyleObject
}


export declare const container: ContainerPatternFn;
