/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { VstackProperties } from '../patterns/vstack.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface VstackProps extends VstackProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof VstackProperties > {}


export declare const VStack: FunctionComponent<VstackProps>