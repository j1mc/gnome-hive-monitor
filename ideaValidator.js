/* ideaValidator.js — Pure validation logic for idea form input.
 *
 * Extracted from IdeaDialog (tuna-os/gnome-hive-monitor#57): this module
 * encapsulates validation rules as pure functions that return structured
 * validation results. Validation is independent of UI framework and can be
 * tested without mocking GNOME Shell infrastructure.
 */

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * Validation result returned by validate().
 *
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - whether validation passed
 * @property {string|null} error - localized error message, or null if valid
 */

/**
 * Validate an idea form submission.
 *
 * @param {string} title - the proposed issue title
 * @param {string} body - the proposed issue body (optional)
 * @returns {ValidationResult} validation result with error message if invalid
 *
 * Rules:
 * - title must be non-empty and trimmed
 * - body is optional
 */
export function validateIdeaForm(title, body) {
    const trimmedTitle = (title || '').trim();

    if (!trimmedTitle) {
        return {
            valid: false,
            error: _('A title is required.'),
        };
    }

    // Additional validations can be added here (max length, profanity, etc.)
    // without modifying the UI layer.

    return {
        valid: true,
        error: null,
    };
}
