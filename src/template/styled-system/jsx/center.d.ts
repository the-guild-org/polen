/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CenterProperties } from '../patterns/center.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface CenterProps extends CenterProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof CenterProperties > {}


export declare const Center: FunctionComponent<CenterProps>