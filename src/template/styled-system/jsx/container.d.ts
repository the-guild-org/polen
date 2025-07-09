/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { ContainerProperties } from '../patterns/container.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface ContainerProps extends ContainerProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof ContainerProperties > {}


export declare const Container: FunctionComponent<ContainerProps>