/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface FlexProperties {
   align?: SystemProperties["alignItems"]
	justify?: SystemProperties["justifyContent"]
	direction?: SystemProperties["flexDirection"]
	wrap?: SystemProperties["flexWrap"]
	basis?: SystemProperties["flexBasis"]
	grow?: SystemProperties["flexGrow"]
	shrink?: SystemProperties["flexShrink"]
}

interface FlexStyles extends FlexProperties, DistributiveOmit<SystemStyleObject, keyof FlexProperties > {}

interface FlexPatternFn {
  (styles?: FlexStyles): string
  raw: (styles?: FlexStyles) => SystemStyleObject
}


export declare const flex: FlexPatternFn;
