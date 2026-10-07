# AGENTS.md — agent guide for tuna-os/gnome-hive-monitor

A **GNOME Shell extension for monitoring Hive instances** from the top bar and
filing ideas into the work queue as GitHub issues.

Human docs: [`README.md`](README.md) (features, configuration, installation),
[`CONTRIBUTING.md`](CONTRIBUTING.md) (local development, validation).

## Key Facts Before You Start

1. **This is a GNOME Shell extension**, not a regular application. It runs inside
   the GNOME Shell process and communicates with hive instances via the
   `/api/widget` endpoint.

2. **Default branch is `main`.** All work targets `main`.

3. **No external dependencies.** The extension uses only `gi://` modules (`GLib`,
   `Gio`, `GObject`, `Clutter`, `St`, `Adw`, `Gtk`, `Soup`) that ship with
   GNOME Shell 45–50.

4. **DCO sign-off required.** All commits must include `git commit -s`.

## Layout & Key Files

| Path | Purpose |
|------|---------|
| `extension.js` | Main extension code (panel icon, status menu) |
| `prefs.js` | Preferences UI (settings dialog) |
| `schemas/` | GSettings schema XML |
| `metadata.json` | Extension metadata (version, description, etc.) |
| `CONTRIBUTING.md` | Local development and validation procedures |

## Build & Test

The extension is interpreted JavaScript — there is no separate build step.

### Local Development

1. **Symlink the extension:**
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions
   ln -s "$(pwd)" ~/.local/share/gnome-shell/extensions/hive-monitor@tunaos.org
   ```

2. **Compile the schema:**
   ```bash
   glib-compile-schemas schemas/
   ```

3. **Log out and back in** (Wayland: full logout required; X11: logout from session menu).

4. **Enable the extension:**
   ```bash
   gnome-extensions enable hive-monitor@tunaos.org
   gnome-extensions prefs hive-monitor@tunaos.org
   ```

5. **Test changes without logout:**
   ```bash
   gnome-extensions disable hive-monitor@tunaos.org
   gnome-extensions enable hive-monitor@tunaos.org
   ```

### Validation Before Submission

Run these checks before pushing to CI:

```bash
# Verify GSettings schema is valid
glib-compile-schemas --strict --dry-run schemas/

# Verify metadata.json syntax
python3 -m json.tool metadata.json > /dev/null

# Verify extension packaging
gnome-extensions pack --force --extra-source=schemas/
```

### Monitoring Logs

Debug messages from the extension appear in the GNOME Shell journal:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

## Architecture

The extension has two parts:

- **Panel Widget** (`extension.js`): Displays hive status in the top bar
  - Shows governor mode (SURGE/BUSY/QUIET/IDLE)
  - Shows queue depth (issues/PRs)
  - Shows agent counts and pause status
  - Fetches status from hive's `/api/widget` endpoint via HTTP GET

- **Preferences** (`prefs.js`): Settings dialog
  - Hive URL and dashboard token (read-only access via `X-Hive-Internal` header)
  - Refresh interval (15–3600 seconds, default 60)
  - GitHub repository for filing ideas
  - GitHub token for creating issues (needs `issues:write` scope)
  - Issue labels (default: `ai-fix-requested`)

The extension reads hive status and creates GitHub issues but never modifies hive configuration (by design — the dashboard token is read-only).

## Configuration Schema

The `schemas/org.gnome.shell.extensions.hive-monitor.gschema.xml` file defines:

- `hive-url` — Base URL of the hive instance
- `hive-token` — Dashboard token (sent as `X-Hive-Internal` header)
- `refresh-interval-seconds` — Polling interval
- `github-repository` — `owner/repo` for filing ideas
- `github-token` — Personal access token (write-only)
- `issue-labels` — Comma-separated label list

Update this schema when adding new settings or changing defaults. Changes are
picked up by `glib-compile-schemas` (run locally before testing).

## Supported GNOME Shell Versions

| Version | Status |
|---------|--------|
| 45–50 | ✅ Supported (ESM extensions) |
| <45 | ❌ Not supported (legacy extension format) |
| >50 | ⚠️ Untested (likely compatible, but not in CI) |

The extension uses standard GObject Introspection modules that are stable across
these versions. No GNOME Shell version detection is needed in the code.

## Testing

- **Unit tests:** None currently.
- **Manual testing:** Follow the local development setup above and test in a real GNOME Shell session.
- **CI:** `.github/workflows/` runs validation checks (schema, JSON, packaging) on each PR.

There is no headless test runner — the extension requires a display server and
GNOME Shell process to function.

## Deployment & Packaging

The extension is distributed via GitHub releases and can be installed:

1. **From this repository (development):**
   ```bash
   git clone https://github.com/tuna-os/gnome-hive-monitor.git \
     ~/.local/share/gnome-shell/extensions/hive-monitor@tunaos.org
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/hive-monitor@tunaos.org/schemas/
   ```

2. **From a packaged ZIP (release):**
   The `gnome-extensions pack` command creates a ZIP that users can extract into
   `~/.local/share/gnome-shell/extensions/`.

3. **Via GNOME Extensions website:** Not currently published, but the extension
   is compatible with the registry format.

## Security & Credentials

- **Hive token:** Sent as the `X-Hive-Internal` HTTP header. It is read-only and
  should be treated as a secret (grants read access to hive status).
- **GitHub token:** Should have minimal scope (`issues:write` on the target
  repository only). Never commit tokens to the repository.
- **No host privileges:** The extension runs in the user's session context only.

## Contributing

For development workflows, validation procedures, and PR guidelines, see
[CONTRIBUTING.md](CONTRIBUTING.md). All commits require DCO sign-off.

## License

Apache-2.0, matching upstream hive.
