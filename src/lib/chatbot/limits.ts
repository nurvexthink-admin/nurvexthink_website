/**
 * Limits shared by the browser and the server.
 *
 * Deliberately in their own module with NO `server-only` import: the chat input
 * needs the character cap, and pulling it from guard.ts would drag the
 * service-role client into the client bundle.
 *
 * The client uses these for a good UX (a maxLength on the textarea). The server
 * re-applies them in guard.ts as the real enforcement — a browser value is a
 * hint, never a control.
 */

export const MAX_USER_MESSAGE_CHARS = 2000;
export const MAX_MESSAGES_PER_REQUEST = 60;
