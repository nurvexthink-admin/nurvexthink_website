// `server-only` throws when bundled for the browser — that is the whole point of
// it, and it guards the modules that touch SUPABASE_SERVICE_ROLE_KEY / OPENAI_API_KEY.
// Vitest runs those modules in Node, where the real package still refuses to load,
// so it is aliased to this no-op for tests. The production guard is unaffected.
export {};
