/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { CqProperties } from '../patterns/cq.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface CqProps extends CqProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof CqProperties > {}


export declare const Cq: FunctionComponent<CqProps>