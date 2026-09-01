# Feature Specification: Nx Workspace Restructure — Thin Apps, Domain Libraries

**Feature Branch**: `refactor/nx-workspace-structure-to-right-one`
**Created**: 2026-08-23
**Status**: Draft
**Input**: `plans/12-nx-workspace-structure-refactor-plan.md` — "Nx workspace structure refactor: thin apps, domain libs"

## Overview

The workspace presents itself as an Nx monorepo — three applications, a `libs/` tree, `type:` and
`scope:` tags on every project — but 71% of its source lives inside the three applications
(26,799 of 37,636 lines of TypeScript). Nx's
cache, its `affected` calculation, and its boundary rules all operate at _project_ granularity, so
with almost every line of code sitting in three giant projects there is nothing for them to act on.

One project makes this worse than it needs to be: the `site-builder` application has no project
folder of its own. Its Nx project root is the repository root, which makes every file in the
workspace one of its cache inputs and makes it "affected" by every change anywhere.

The consequence is a workspace that has silently accepted duplication as the norm: three divergent
copies of the authentication stack, fifteen copies of five authentication pages, three different
navigation bars, roughly 90 KB of forked component code, and an `affected` command that always
answers "everything."

This feature converts the applications into deployment shells and promotes every feature, data
access layer, and shared UI component into its own tagged Nx library with an enforced import
boundary. After it lands, cache and `affected` work per feature instead of per application, and
duplication becomes a lint failure rather than a habit.

## Clarifications

### Session 2026-08-23

- Q: Do you approve adding the `@nx/eslint-plugin` dependency for boundary enforcement? → A: Approved (caret range, standard install)
- Q: How much of the 5-phase plan does this feature cover? → A: All 5 phases, with an independently verifiable gate at each phase boundary
- Q: Is the cookie-backed server-side locale fix in scope? → A: No — the shared internationalisation library is extracted lift-and-shift with today's behaviour unchanged; the server-side locale fix is a separate follow-up feature
- Q: How should the shared library be decomposed? → A: Each of the 21 shared components becomes its own presentational project; the non-component groups (constants, directives, pipes, template, mock, environment) are consolidated into utility projects; the single shared alias retires and its 23 consumer files are rewritten
- Q: How should the three navigation bars be reconciled? → A: The shared-library navigation bar is a placeholder and is deleted; the site-builder and storefront navigation bars are genuinely distinct components and each moves into its own product scope, giving two survivors

## User Scenarios & Testing _(mandatory)_

### User Story 1 — A developer changes one feature and only that feature rebuilds (Priority: P1)

A developer edits a single component inside the inventory dashboard's products feature. They expect
the workspace to understand that this change touches the products feature and its host application,
and nothing else.

**Why this priority**: This is the outcome the entire restructure exists to produce. Every other
story is either a prerequisite for it or a side effect of achieving it.

**Independent Test**: Modify one file inside a feature library, then ask the workspace which
projects are affected. The answer must name that library and its consuming application — not all
three applications.

**Acceptance Scenarios**:

1. **Given** a workspace where all builds have been run once, **When** a developer changes a file in
   one feature library and rebuilds everything, **Then** only that library's dependents rebuild and
   every other project is served from cache.
2. **Given** a change confined to the inventory dashboard, **When** the developer asks which
   projects are affected, **Then** the storefront and site-builder applications are not listed.
3. **Given** no changes at all since the previous build, **When** the developer rebuilds everything,
   **Then** every project reports a cache hit.

---

### User Story 2 — An architectural rule is enforced automatically, not by review (Priority: P1)

A developer writes an import that crosses an architectural boundary — one application importing
from another, a presentational component reaching into a data access layer, or code scoped to one
product area importing code scoped to a different one. They expect this to fail immediately at lint
time with a message naming the rule, rather than passing review and becoming permanent.

**Why this priority**: Without enforcement the structure decays back to its current state. Every
duplicate that exists today exists because nothing stopped it.

**Independent Test**: Deliberately add a forbidden import, run the lint task, and confirm it fails
with a boundary violation naming the offending tags.

**Acceptance Scenarios**:

1. **Given** enforcement is active, **When** a developer imports one application's code from another
   application, **Then** lint fails and names the violated boundary.
2. **Given** enforcement is active, **When** a presentational library imports a data access library,
   **Then** lint fails.
3. **Given** enforcement is active, **When** code in one product scope imports code from a sibling
   scope, **Then** lint fails; importing from the shared scope succeeds.
4. **Given** the restructure is complete, **When** lint runs across the whole workspace, **Then** it
   passes with no boundary exceptions remaining.

---

### User Story 3 — A shared behaviour is fixed once and every application gets the fix (Priority: P1)

A developer fixes a defect in sign-in behaviour. They expect to change it in one place and have all
three applications pick the fix up, instead of hunting for three divergent copies and hoping they
found them all.

**Why this priority**: The authentication stack is the most damaging duplication in the workspace —
it is security-relevant, it has already diverged three ways, and it is the single largest source of
"the fix didn't propagate" defects.

**Independent Test**: Change one line of shared sign-in behaviour, then confirm the change is
observable in all three running applications without any further edits.

**Acceptance Scenarios**:

1. **Given** the shared authentication library exists, **When** a developer searches the workspace
   for sign-in service implementations, **Then** exactly one is found.
2. **Given** the five authentication pages are shared, **When** a developer searches for the sign-in
   page, **Then** exactly one implementation is found and each application supplies only its own
   branding and layout.
3. **Given** all three applications consume the shared authentication library, **When** each
   application is exercised end to end, **Then** sign-in, registration, password reset, password
   recovery, and email verification behave correctly in each — including each application's own
   post-sign-in destination.

---

### User Story 4 — A visitor loads the site-builder without downloading the entire application (Priority: P2)

A first-time visitor opens the site-builder's landing page. They expect to receive only what that
page needs, not the builder wizard, the guided interview, the preview engine, and all five
authentication pages.

**Why this priority**: This is the only user-facing performance change in the feature, and it is
visible to end users rather than only to developers. It is P2 because the workspace remains correct
without it.

**Independent Test**: Compare the initial download size of the site-builder before and after; the
builder wizard, interview, preview, and authentication pages must no longer be part of it.

**Acceptance Scenarios**:

1. **Given** the site-builder is deployed, **When** a visitor loads the landing page, **Then** the
   initial payload is measurably smaller than before this change.
2. **Given** a visitor navigates to the builder wizard, **When** the route loads, **Then** the
   wizard's code is fetched at that moment and the wizard functions correctly.
3. **Given** any site-builder route, **When** it is loaded directly by URL, **Then** it renders
   correctly on the server and hydrates without console errors.

---

### User Story 5 — A developer finds one obvious home for any piece of code (Priority: P2)

A developer joins the project and needs to place a new feature. They expect one naming convention,
one folder taxonomy, and one place where each kind of code lives — not three applications each with
a different internal architecture and one of them running two competing architectures at once.

**Why this priority**: Structural inconsistency is what allowed the duplication to accumulate. It
is P2 because it is a precondition for maintainability rather than a runtime outcome.

**Independent Test**: Ask where a new data access layer for a new domain belongs; the answer is
derivable from the convention alone, without reading existing code.

**Acceptance Scenarios**:

1. **Given** the restructure is complete, **When** a developer inspects any application's source
   folder, **Then** it contains only bootstrap, configuration, routing, environment, and static
   asset files.
2. **Given** a domain with data access needs, **When** a developer looks for its state container,
   **Then** exactly one exists.
3. **Given** the internationalisation setup, **When** a developer looks for translation resources,
   **Then** exactly one mechanism is in use across all three applications.

---

### Edge Cases

- **Server-side rendering and locale**: locale and text direction are currently resolved from
  browser-only storage, so the server always renders the default locale and left-to-right direction.
  This pre-existing mismatch is accepted and carried forward unchanged; consolidating
  internationalisation into a shared library must not worsen it. Correcting it is out of scope
  (see Clarifications).
- **Divergent forks are not always equivalent**: where two copies of a component have drifted, one
  may carry fixes the other lacks. Reconciliation must produce a single survivor that keeps every
  behaviour either copy had, not simply the newer file.
- **Competing state containers**: two domains currently have two state containers each. Choosing a
  survivor changes runtime behaviour and must be validated as a behavioural change in its own right,
  separately from the file moves.
- **Direct URL entry and refresh**: every application renders on the server. A route that works when
  navigated to from inside the application may still fail when loaded directly or refreshed.
- **Pre-existing lint failures**: roughly twenty storefront components already violate a lint rule
  that is set to error. Moving them into libraries makes these failures unavoidable rather than
  merely latent.
- **Shared source across presentational libraries**: the presentational component libraries share
  source in a way that makes independent packaging fail. They must remain source-consumed.
- **Styling entry point**: the styling framework's entry directive determines where it scans for
  class usage. Relocating it out of an application would silently strip styles from that
  application's templates.

## Requirements _(mandatory)_

### Functional Requirements

#### Project structure and cache correctness

- **FR-001**: Every application MUST have its own project definition rooted at its own folder. No
  project may declare the repository root as its root.
- **FR-002**: Changing a file that belongs to one application MUST NOT mark another application as
  affected.
- **FR-003**: Re-running a build with no intervening changes MUST produce a cache hit for every
  project.
- **FR-004**: Each of the shared presentational primitives MUST be its own project, so that editing
  one does not invalidate consumers of the others.
- **FR-004a**: Each of the 21 cross-application shared components MUST likewise become its own
  presentational project. The non-component groups within the shared library — constants,
  directives, pipes, templates, mock data, and environment helpers — MUST be consolidated into
  utility projects rather than split per file.
- **FR-004b**: The single umbrella alias for the shared library MUST be retired, and every file
  importing through it MUST be rewritten to import from the specific project it depends on.
- **FR-005**: Presentational primitive projects MUST remain source-consumed; they MUST NOT be
  configured for independent packaging.
- **FR-006**: Existing import aliases for presentational primitives MUST continue to resolve
  unchanged, so no consuming import statement needs editing.
- **FR-007**: Project configuration files (compiler configuration, project references, output
  locations) MUST be consistent across all three applications.
- **FR-008**: Manually declared inter-project dependencies MUST be removed once the dependency graph
  is derived from real imports.

#### Boundary enforcement

- **FR-009**: The workspace MUST enforce import boundaries automatically as part of lint. The
  supporting lint tooling is approved as a development-only dependency and MUST NOT affect any
  shipped bundle.
- **FR-010**: Enforcement MUST use the type tags already present on every project, permitting:
  applications to import features, presentational, utility, and core projects; features to import
  features, data access, presentational, utility, and core; data access to import data access,
  utility, and core; presentational to import presentational and utility; utility to import utility
  only.
- **FR-011**: Enforcement MUST use the scope tags already present on every project, permitting each
  product scope to import from itself and from the shared scope only, and the shared scope to import
  from itself only.
- **FR-012**: The hand-written import restriction rules that exist today as a substitute for real
  enforcement MUST be removed once real enforcement is active.
- **FR-013**: Any exception granted to unblock intermediate work MUST be recorded with the phase
  that will remove it, and MUST NOT survive into the finished state.
- **FR-014**: Every application-scoped import alias MUST be namespaced. The unscoped alias currently
  owned by the site-builder MUST be renamed to a scoped one.

#### Deduplication

- **FR-015**: The workspace MUST contain exactly one authentication data access implementation —
  one sign-in service, one token service, one federated sign-in service, one set of route guards,
  one request interceptor, and one shared interface set — consumed by all three applications.
- **FR-016**: The shared authentication implementation MUST be designed against all three existing
  implementations as a superset before any application is migrated onto it. Per-application
  differences MUST be expressed through configuration or injection, never by forking the library.
- **FR-017**: The workspace MUST contain exactly one implementation of each of the five
  authentication pages, with per-application layout and branding supplied by the consuming
  application.
- **FR-018**: The workspace MUST contain exactly one implementation of each currently forked shared
  component. Where two copies have diverged, the surviving implementation MUST retain the behaviour
  of both. Where two copies are demonstrably different components rather than forks of one, both MAY
  survive, but each MUST live in the product scope that uses it and the redundant placeholder MUST
  be deleted.
- **FR-019**: The workspace MUST contain exactly one error-handling utility.
- **FR-020**: Each domain MUST have exactly one state container. The duplicate containers for
  product and supplier MUST be consolidated onto a single implementation each.
- **FR-021**: The workspace MUST use exactly one translation resource mechanism across all three
  applications; the redundant mechanism MUST be removed after any live content is preserved.
- **FR-022**: The site-builder's parallel environment and template mechanisms MUST be collapsed onto
  the single workspace-wide convention.

#### Target structure

- **FR-023**: After the restructure, each application's source MUST contain only bootstrap entry
  points, server entry point, root component, application configuration, routing configuration,
  environment files, static assets, and global stylesheet.
- **FR-024**: Every feature MUST be its own project that exposes its routes as a public contract,
  loaded on demand by the consuming application.
- **FR-025**: Every domain data access layer MUST be its own project, separate from the feature
  projects that consume it.
- **FR-026**: Application-specific shell components MUST live in a presentational project scoped to
  their application; components shared across applications MUST live in the shared scope.
- **FR-027**: Every project MUST carry both a type tag and a scope tag, and MUST expose a single
  public entry point.
- **FR-028**: New projects MUST follow the workspace's established naming convention and MUST have
  their alias registered centrally.

#### Runtime behaviour

- **FR-029**: All leaf routes in the site-builder MUST be loaded on demand. Layout shells MUST
  remain eagerly loaded.
- **FR-030**: The shared internationalisation library MUST be extracted with its current behaviour
  unchanged. It MUST NOT introduce any new server-versus-browser rendering mismatch beyond the one
  that exists today. Making locale resolvable on the server is explicitly out of scope for this
  feature and is tracked as separate follow-up work.
- **FR-031**: Backend-authored content MUST continue to render verbatim with direction derived from
  the content itself, not from the active interface locale.
- **FR-032**: Every component that is moved MUST satisfy the workspace's change-detection lint rule,
  including the components that violate it today.

#### Process

- **FR-033**: The restructure MUST proceed in phases — configuration first, then one application at
  a time, then close-out — with each phase independently verifiable and leaving the workspace green.
  All phases are in scope for this feature; no phase may be deferred to later work, because the
  temporary boundary exceptions opened by the configuration phase are only removed by close-out.
- **FR-034**: Behaviour-changing steps MUST be landed and verified separately from file relocations,
  so that a regression can be attributed to one or the other.
- **FR-035**: Existing test files MUST move with the code they cover. No new test files are authored
  as part of this work.
- **FR-036**: Project documentation MUST be corrected where it describes the current structure
  inaccurately, including the claim that the root project definition is unreferenced.

### Key Entities

- **Application**: A deployable unit. After this feature, it owns only bootstrap, configuration,
  routing, environment, and static assets. Carries an application type tag and its own scope tag.
- **Feature project**: A user-facing capability — its pages, its components, and its route contract.
  Consumes data access, presentational, and utility projects. Loaded on demand by an application.
- **Data access project**: The state container, remote-service client, and domain types for exactly
  one domain. Consumes only other data access, utility, and core projects.
- **Presentational project**: A component with no domain knowledge. Consumes only presentational and
  utility projects.
- **Utility project**: A pure helper with no dependencies beyond other utility projects.
- **Core project**: Cross-cutting foundations — the translation engine, shared type contracts,
  shared theming.
- **Type tag**: Declares what a project is; drives the vertical import rules.
- **Scope tag**: Declares which product area a project belongs to; drives the horizontal import
  rules.
- **Domain**: A business concept with exactly one data access project — product, order, supplier,
  category, cart, store, user, FAQ, builder, preview.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Changing one file in one feature project causes at most two projects to be reported as
  affected, down from all three applications today.
- **SC-002**: Rebuilding the workspace with no intervening changes produces a cache hit for 100% of
  projects.
- **SC-003**: Changing a file in one application marks zero other applications as affected.
- **SC-004**: The count of distinct sign-in service implementations in the workspace is 1, down
  from 3.
- **SC-005**: The count of authentication page implementations is 5, down from 15.
- **SC-006**: The count of navigation bar implementations is reduced from 3 to exactly 2 — one per
  product scope that needs one — and the shared-library placeholder is gone.
- **SC-007**: Duplicated component source is reduced from roughly 90 KB to zero.
- **SC-008**: The number of state containers per domain is exactly 1 for every domain, down from 2
  for product and supplier.
- **SC-009**: The share of source lines living inside applications drops from 71% to under 5%,
  measured across the whole workspace (37,636 lines of TypeScript, of which applications hold
  26,799 today).
- **SC-010**: A deliberately introduced boundary violation is rejected by lint in 100% of the rule
  categories defined — cross-application, cross-scope, and downward type violations.
- **SC-011**: Lint and build both pass across the entire workspace with zero boundary exceptions
  outstanding.
- **SC-012**: The site-builder's initial download excludes the builder wizard, the guided interview,
  the preview engine, and all authentication pages, and falls from its measured baseline of 1.30 MB
  to within the configured 1 MB budget (it currently exceeds that budget by 297.89 kB).
- **SC-013**: All three applications can be exercised end to end — sign-in, then each application's
  primary flows, then a page refresh on each route — with no console errors and no
  server-versus-browser rendering mismatch.
- **SC-014**: Every project in the workspace carries both a type tag and a scope tag, and the
  dependency graph shows no edge crossing a scope boundary except into the shared scope.

## Assumptions

- The audit figures in the source plan (line counts, file sizes, route counts, duplication
  inventory) are accurate as of the plan's authoring and are treated as the baseline. They will be
  re-measured at the start of implementation to confirm.
- The type and scope tags already present on every project are correct and can be used as the basis
  for enforcement without re-tagging.
- Testing remains deliberately deferred per project convention; verification is by build, lint,
  dependency-graph inspection, and manual end-to-end walkthrough rather than by automated tests.
- The user performs all staging and commits; this work leaves changes in the working tree only.
- Adding the boundary-enforcement tooling was raised as a dependency approval gate and has been
  explicitly approved (see Clarifications, Session 2026-08-23). It is development-only.
- The three existing test files in the workspace move with their code unchanged.
- Backend contracts are out of scope. This is a frontend-only restructure with no change to any
  request or response shape.

## Out of Scope

- Any change to backend endpoints, payloads, or contracts.
- Making locale and text direction resolvable on the server. The existing browser-only resolution is
  carried forward unchanged; correcting it is separate follow-up work.
- Authoring new automated tests.
- Visual redesign. Components move and merge, but their rendered appearance is preserved except
  where two forks must be reconciled.
- New product features. No capability is added that does not exist today.
- Deployment or infrastructure changes beyond what the project restructure requires.
