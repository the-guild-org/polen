/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridProperties } from '../patterns/grid.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface GridProps extends GridProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof GridProperties > {}


export declare const Grid: FunctionComponent<GridProps>