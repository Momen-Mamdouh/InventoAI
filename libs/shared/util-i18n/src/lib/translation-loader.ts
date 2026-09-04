import { InjectionToken } from '@angular/core';
import type { Locale } from './locale';

/** A translation JSON tree: leaves are strings, branches nest further keys. */
export type TranslationValue = string | { [key: string]: TranslationValue };
export type TranslationDictionary = Record<string, TranslationValue>;

export type TranslationLoader = (locale: Locale) => TranslationDictionary;

export const TRANSLATION_LOADER = new InjectionToken<TranslationLoader>('TRANSLATION_LOADER');


// Mo'men Comment:
// This file to have: Angular's Dependency Injection system -> 
// As in angular we can inject only classes or tokens, not plain functions, directly  ->
// unless we wrap the function in an InjectionToken.
// 
// So -> TranslationLoader ->  is a fn type alias: any function -> 
// that takes a Locale and returns a flat dictionary (Record<string, string>) of translation key ->
// translated string (e.g. { 'home.title': 'Welcome' }).
// 
// So -> TRANSLATION_LOADER -> is the actual injectable token, typed with a generic (InjectionToken<TranslationLoader>) 
// when it's injected elsewhere, TypeScript knows it resolves to a function, with full autocomplete and type checking.
// 
// So -> 'TRANSLATION_LOADER' -> a string passed to the constructor as just a debug label ->
//  it shows up in Angular DevTools / error messages ->
//  it has no functional effect on injection resolution
// 
// This pattern is the standard way to make an app's translation-loading strategy pluggable.
// to be pluggable in app.config.ts -> as -> { provide: TRANSLATION_LOADER, useValue: (locale: Locale) => (locale === 'ar' ? ar : en),},
