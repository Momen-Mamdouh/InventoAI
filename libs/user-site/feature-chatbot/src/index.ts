/**
 * Documented deviation from "export routes, not components" (`contracts/library-api.md` rule
 * 3): the chatbot is a floating widget composed directly into `app.ts`'s shell chrome
 * (alongside the navbar/footer), not a routed page — there is no `Routes` array to export.
 * Same shape as invento's `feature-chatbot` decision at T118/R10.
 */
export { Chatbot } from './lib/chatbot';
