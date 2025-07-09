/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface DividerProperties {
   orientation?: ConditionalValue<"horizontal" | "vertical">
	thickness?: ConditionalValue<Tokens["sizes"] | Properties["borderWidth"]>
	color?: ConditionalValue<Tokens["colors"] | Properties["borderColor"]>
}

interface DividerStyles extends DividerProperties, DistributiveOmit<SystemStyleObject, keyof DividerProperties > {}

interface DividerPatternFn {
  (styles?: DividerStyles): string
  raw: (styles?: DividerStyles) => SystemStyleObject
}


export declare const divider: DividerPatternFn;
