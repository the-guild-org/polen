/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { BoxProperties } from '../patterns/box.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface BoxProps extends BoxProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof BoxProperties > {}


export declare const Box: FunctionComponent<BoxProps>