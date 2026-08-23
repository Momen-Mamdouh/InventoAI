// This library is a deliberate exception to the "one component per library" rule (T089): the six
// home-page sections below (`capabilities`, `cta`, `hero`, `pipeline`, `stats`, `typing-text`) are
// only ever composed together as one home-page kit, `hero` and `pipeline` both depend on
// `PageHeader`, and `hero` composes `typing-text` directly. Splitting them into six separate
// projects would not stop any of them from changing together. See data-model.md's
// `shared-ui-home-components` entry.
export * from './lib/capabilities/capabilities';
export * from './lib/cta/cta';
export * from './lib/hero/hero';
export * from './lib/pipeline/pipeline';
export * from './lib/stats/stats';
export * from './lib/typing-text/typing-text';
