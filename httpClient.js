/* httpClient.js — Shared HTTP error handling for Soup requests.
 *
 * Extracted from githubClient.js and hiveClient.js (tuna-os/gnome-hive-monitor#54):
 * both modules duplicated network error detection, cancellation checks, JSON parsing,
 * and error reporting. This module provides reusable patterns so HTTP error handling
 * is consistent and testable in one place.
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

/**
 * Classify an error caught during send_and_read_async().
 *
 * @param {Error} error - the exception thrown by send_and_read_async()
 * @returns {string} 'cancelled' if the request was cancelled, 'network' otherwise
 */
export function classifyNetworkError(error) {
    if (error?.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
        return 'cancelled';
    return 'network';
}

/**
 * Try to parse a response body as JSON.
 *
 * @param {GLib.Bytes} bytes - the response body
 * @returns {{success: boolean, data: object|null, error: string|null}}
 *   On success: {success: true, data: parsed object, error: null}
 *   On error: {success: false, data: null, error: string description}
 */
export function tryParseJson(bytes) {
    try {
        const text = new TextDecoder().decode(bytes.get_data());
        const data = JSON.parse(text);
        return {success: true, data, error: null};
    } catch (e) {
        return {success: false, data: null, error: String(e.message ?? e)};
    }
}

/**
 * Extract an error message from a GitHub API error response.
 *
 * GitHub's REST API returns a JSON object with a `message` field on error.
 * If the response parses and contains a message, return it; otherwise return
 * the fallback (usually the HTTP status code).
 *
 * @param {GLib.Bytes} bytes - the response body
 * @param {string} fallback - what to return if extraction fails
 * @returns {string} the error message
 */
export function extractGitHubErrorMessage(bytes, fallback) {
    const json = tryParseJson(bytes);
    if (json.success && json.data?.message)
        return json.data.message;
    return fallback;
}
