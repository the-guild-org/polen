/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { DividerProperties } from '../patterns/divider.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface DividerProps extends DividerProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof DividerProperties > {}


export declare const Divider: FunctionComponent<DividerProps>