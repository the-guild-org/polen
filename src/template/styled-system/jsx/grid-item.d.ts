/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { GridItemProperties } from '../patterns/grid-item.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface GridItemProps extends GridItemProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof GridItemProperties > {}


export declare const GridItem: FunctionComponent<GridItemProps>