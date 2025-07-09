/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { HstackProperties } from '../patterns/hstack.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface HstackProps extends HstackProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof HstackProperties > {}


export declare const HStack: FunctionComponent<HstackProps>