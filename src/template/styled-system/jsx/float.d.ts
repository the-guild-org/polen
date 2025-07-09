/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FloatProperties } from '../patterns/float.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface FloatProps extends FloatProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof FloatProperties > {}


export declare const Float: FunctionComponent<FloatProps>