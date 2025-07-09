/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { AspectRatioProperties } from '../patterns/aspect-ratio.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface AspectRatioProps extends AspectRatioProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof AspectRatioProperties | 'aspectRatio'> {}


export declare const AspectRatio: FunctionComponent<AspectRatioProps>