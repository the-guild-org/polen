/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { SquareProperties } from '../patterns/square.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface SquareProps extends SquareProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof SquareProperties > {}


export declare const Square: FunctionComponent<SquareProps>