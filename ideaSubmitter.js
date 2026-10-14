/* ideaSubmitter.js — Async submission handler for filing ideas as GitHub issues.
 *
 * Extracted from IdeaDialog (tuna-os/gnome-hive-monitor#57): this module
 * encapsulates the asynchronous GitHub API call and error handling, independent
 * of UI widgets. The submitter receives callbacks to notify the caller of
 * success or failure, allowing the UI layer to remain decoupled from
 * submission logic.
 */

import {fileIssue} from './githubClient.js';

/**
 * Submit an idea as a GitHub issue.
 *
 * @param {Soup.Session} session - the shared HTTP session
 * @param {Gio.Cancellable} cancellable - cancelled on extension disable
 * @param {string} repo - "owner/name" repository identifier
 * @param {string} token - GitHub API token
 * @param {string[]} labels - labels to apply to the issue
 * @param {string} title - issue title
 * @param {string} body - issue body (optional)
 * @param {Object} callbacks - result callbacks
 * @param {(number: string, htmlUrl: string|null) => void} callbacks.onSuccess -
 *   called on successful submission with issue number (#123) and URL
 * @param {(message: string) => void} callbacks.onError -
 *   called on any error with a user-facing error message
 *
 * This function delegates to githubClient.fileIssue() and translates its
 * callbacks into a simpler result interface. No UI state is modified here;
 * all results are communicated through callbacks.
 */
export function submitIdea(session, cancellable, repo, token, labels, title, body, {onSuccess, onError}) {
    fileIssue(session, cancellable, repo, token, labels, title, body, {
        onFiled: (num, htmlUrl) => onSuccess(num, htmlUrl),
        onError: (message) => onError(message),
    });
}
