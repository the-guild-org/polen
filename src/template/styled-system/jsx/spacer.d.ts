/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SpacerProperties } from '../patterns/spacer.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface SpacerProps extends SpacerProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof SpacerProperties > {}


export declare const Spacer: FunctionComponent<SpacerProps>