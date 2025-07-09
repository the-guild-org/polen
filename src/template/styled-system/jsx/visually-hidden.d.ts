/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { VisuallyHiddenProperties } from '../patterns/visually-hidden.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface VisuallyHiddenProps extends VisuallyHiddenProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof VisuallyHiddenProperties > {}


export declare const VisuallyHidden: FunctionComponent<VisuallyHiddenProps>