/* httpClient.js — Shared HTTP transport for Soup-based requests.
 *
 * Extracted from githubClient.js and hiveClient.js to eliminate duplicate
 * error handling and cancellation logic (tuna-os/gnome-hive-monitor#54).
 * Both the hive status endpoint and GitHub issue API use similar patterns:
 * validate URL, send request, handle cancellation, parse response.
 *
 * This module provides sendRequest() which handles the common async flow
 * and delegates domain-specific concerns (header setup, response parsing)
 * to caller-provided functions.
 */

import Gio from 'gi://Gio';
import Soup from 'gi://Soup?version=3.0';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * Send an HTTP request and delegate response handling to callbacks.
 *
 * Encapsulates the common pattern:
 * - Create Soup.Message (with caller setup via setupMessage callback)
 * - Send via session.send_and_read_async
 * - Handle cancellation silently
 * - Delegate status code handling and parsing to caller via handleResponse
 *
 * @param {Soup.Session} session - the extension's shared Soup session.
 * @param {Gio.Cancellable} cancellable - cancelled on extension disable().
 * @param {string} url - the full URL to request. Validated by caller before
 *   calling sendRequest.
 * @param {(msg: Soup.Message) => void} setupMessage - called after
 *   Soup.Message.new() to set request headers, body, method, etc.
 * @param {(code: number, bytes: GLib.Bytes|null) => void} handleResponse -
 *   called with the HTTP status code and response bytes. Responsible for
 *   calling onSuccess/onError/onAuthError callbacks as appropriate.
 * @param {(message: string) => void} onNetworkError - called on a network
 *   error (including timeout). Not called on cancellation.
 */
export function sendRequest(session, cancellable, url, setupMessage, handleResponse, onNetworkError) {
    const msg = Soup.Message.new('GET', url);
    if (!msg) {
        // Caller should validate URL before calling sendRequest, but if we
        // get here, it means the URL is malformed.
        throw new Error(`Invalid URL: ${url}`);
    }

    setupMessage(msg);

    session.send_and_read_async(
        msg, 0, cancellable, (session_, res) => {
            let bytes;
            try {
                bytes = session_.send_and_read_finish(res);
            } catch (e) {
                if (!e.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                    console.error(`[HiveMonitor] Network error: ${e.message ?? e}`);
                    onNetworkError(String(e.message ?? e));
                }
                return;
            }
            const code = msg.get_status();
            handleResponse(code, bytes);
        });
}
