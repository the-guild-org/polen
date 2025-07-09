/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FlexProperties } from '../patterns/flex.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface FlexProps extends FlexProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof FlexProperties > {}


export declare const Flex: FunctionComponent<FlexProps>