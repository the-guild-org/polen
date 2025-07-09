/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.ts';
import type { Properties } from '../types/csstype.d.ts';
import type { SystemProperties } from '../types/style-props.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';
import type { Tokens } from '../tokens/index.d.ts';

export interface GridItemProperties {
   colSpan?: ConditionalValue<number>
	rowSpan?: ConditionalValue<number>
	colStart?: ConditionalValue<number>
	rowStart?: ConditionalValue<number>
	colEnd?: ConditionalValue<number>
	rowEnd?: ConditionalValue<number>
}

interface GridItemStyles extends GridItemProperties, DistributiveOmit<SystemStyleObject, keyof GridItemProperties > {}

interface GridItemPatternFn {
  (styles?: GridItemStyles): string
  raw: (styles?: GridItemStyles) => SystemStyleObject
}


export declare const gridItem: GridItemPatternFn;
