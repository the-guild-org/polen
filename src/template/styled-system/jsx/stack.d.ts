/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { StackProperties } from '../patterns/stack.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface StackProps extends StackProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof StackProperties > {}


export declare const Stack: FunctionComponent<StackProps>