/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { LinkOverlayProperties } from '../patterns/link-overlay.d.ts';
import type { HTMLStyledProps } from '../types/jsx.d.ts';
import type { DistributiveOmit } from '../types/system-types.d.ts';

export interface LinkOverlayProps extends LinkOverlayProperties, DistributiveOmit<HTMLStyledProps<'a'>, keyof LinkOverlayProperties > {}


export declare const LinkOverlay: FunctionComponent<LinkOverlayProps>