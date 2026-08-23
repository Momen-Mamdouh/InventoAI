import { type Signal, InjectionToken } from '@angular/core';
import { type HlmStyle } from './spartan-styles';

export const HLM_STYLE_TOKEN = new InjectionToken<Signal<HlmStyle | undefined>>('HLM_STYLE_TOKEN');
