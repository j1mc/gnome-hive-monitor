/**
 * Configuration validation for gnome-hive-monitor.
 * 
 * This module provides a centralized validation interface for extension settings,
 * enabling consistent validation across the preferences UI and runtime configuration.
 * 
 * Phase 1: Extract validation logic
 * Phase 2: Add settings schema validation
 * Phase 3: Add async validation (URL reachability, GitHub API checks)
 */

/**
 * Validates a GitHub repository identifier.
 * 
 * @param {string} repo - Repository in format "owner/name"
 * @returns {{valid: boolean, error?: string}}
 */
export function validateGitHubRepo(repo) {
    if (!repo || typeof repo !== 'string') {
        return { valid: false, error: 'Repository is required' };
    }
    
    const trimmed = repo.trim();
    if (!trimmed) {
        return { valid: false, error: 'Repository cannot be empty' };
    }
    
    // Match owner/name format exactly
    const match = trimmed.match(/^([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)$/);
    if (!match) {
        return {
            valid: false,
            error: 'Repository must be in format "owner/name" (e.g., "tuna-os/hive")'
        };
    }
    
    const [, owner, name] = match;
    
    // Validate individual components
    if (owner.length < 1 || owner.length > 39) {
        return { valid: false, error: 'Owner must be 1-39 characters' };
    }
    
    if (name.length < 1 || name.length > 255) {
        return { valid: false, error: 'Repository name must be 1-255 characters' };
    }
    
    return { valid: true };
}

/**
 * Validates a URL string.
 * 
 * @param {string} url - URL to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateURL(url) {
    if (!url || typeof url !== 'string') {
        return { valid: false, error: 'URL is required' };
    }
    
    const trimmed = url.trim();
    if (!trimmed) {
        return { valid: false, error: 'URL cannot be empty' };
    }
    
    // Basic URL validation
    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return {
                valid: false,
                error: 'URL must use http:// or https://'
            };
        }
        return { valid: true };
    } catch (e) {
        return {
            valid: false,
            error: 'Invalid URL format'
        };
    }
}

/**
 * Validates a comma-separated list of labels.
 * 
 * @param {string} labels - Comma-separated labels
 * @returns {{valid: boolean, error?: string, parsed?: string[]}}
 */
export function validateLabels(labels) {
    if (!labels || typeof labels !== 'string') {
        return { valid: true, parsed: [] }; // Labels are optional
    }
    
    const trimmed = labels.trim();
    if (!trimmed) {
        return { valid: true, parsed: [] };
    }
    
    // Split and validate each label
    const parsed = trimmed
        .split(',')
        .map(label => label.trim())
        .filter(label => label.length > 0);
    
    // Check label length and characters
    for (const label of parsed) {
        if (label.length > 50) {
            return {
                valid: false,
                error: 'Each label must be 50 characters or less'
            };
        }
        
        // Warn about unusual characters, but don't fail
        if (!/^[\w\-\s]+$/.test(label)) {
            // Labels with special chars are allowed but uncommon
            console.warn(`Unusual characters in label: "${label}"`);
        }
    }
    
    return { valid: true, parsed };
}

/**
 * Validates all extension configuration.
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.repo - GitHub repository
 * @param {string} config.hiveUrl - Hive server URL
 * @param {string} config.hiveToken - Hive API token
 * @param {string} [config.labels] - Optional comma-separated labels
 * @returns {{valid: boolean, errors: Object.<string, string>}}
 */
export function validateConfig(config) {
    const errors = {};
    
    // Validate required fields
    const repoResult = validateGitHubRepo(config.repo);
    if (!repoResult.valid) {
        errors.repo = repoResult.error;
    }
    
    const urlResult = validateURL(config.hiveUrl);
    if (!urlResult.valid) {
        errors.hiveUrl = urlResult.error;
    }
    
    if (!config.hiveToken || !String(config.hiveToken).trim()) {
        errors.hiveToken = 'Hive token is required';
    }
    
    // Validate optional fields
    if (config.labels !== undefined) {
        const labelsResult = validateLabels(config.labels);
        if (!labelsResult.valid) {
            errors.labels = labelsResult.error;
        }
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Gets user-friendly error messages for configuration validation.
 * 
 * @param {Object} errors - Validation errors from validateConfig
 * @returns {string} Human-readable error message
 */
export function formatValidationErrors(errors) {
    const messages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${error}`)
        .join('\n');
    
    return messages || 'Configuration is invalid';
}
