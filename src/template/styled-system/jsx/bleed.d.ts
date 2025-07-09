/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { BleedProperties } from '../patterns/bleed.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface BleedProps extends BleedProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof BleedProperties > {}


export declare const Bleed: FunctionComponent<BleedProps>