/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { WrapProperties } from '../patterns/wrap.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface WrapProps extends WrapProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof WrapProperties > {}


export declare const Wrap: FunctionComponent<WrapProps>