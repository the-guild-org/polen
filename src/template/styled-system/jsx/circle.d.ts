/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CircleProperties } from '../patterns/circle.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface CircleProps extends CircleProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof CircleProperties > {}


export declare const Circle: FunctionComponent<CircleProps>