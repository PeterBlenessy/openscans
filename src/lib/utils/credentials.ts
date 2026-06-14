/**
 * Secure credential storage backed by the OS keychain (desktop only).
 *
 * On desktop (Tauri), these helpers invoke Rust commands that store secrets
 * in the OS credential manager (macOS Keychain, Windows Credential Manager,
 * or the Secret Service on Linux). On web, they are no-ops — API keys are a
 * desktop-only concern, so there is nothing to persist in the browser.
 *
 * SECURITY: keys never touch localStorage. The Rust side resolves them from
 * the keychain by name under the fixed "openscans" service namespace.
 */
import { invoke } from '@tauri-apps/api/core'
import { isTauri } from './platform'

/**
 * Store a credential in the OS keychain (desktop only).
 *
 * @param name - Logical credential name (e.g. 'claude', 'gemini', 'openai')
 * @param key - The secret value to store
 */
export async function storeKey(name: string, key: string): Promise<void> {
  if (!isTauri()) return
  try {
    await invoke('store_credential', { service: name, key })
  } catch (e) {
    console.error(`Failed to store credential '${name}':`, e)
  }
}

/**
 * Retrieve a credential from the OS keychain (desktop only).
 *
 * @param name - Logical credential name (e.g. 'claude', 'gemini', 'openai')
 * @returns The stored secret, or null on web / when no entry exists / on error
 */
export async function getKey(name: string): Promise<string | null> {
  if (!isTauri()) return null
  try {
    return await invoke<string | null>('get_credential', { service: name })
  } catch (e) {
    console.error(`Failed to read credential '${name}':`, e)
    return null
  }
}

/**
 * Delete a credential from the OS keychain (desktop only).
 *
 * @param name - Logical credential name (e.g. 'claude', 'gemini', 'openai')
 */
export async function deleteKey(name: string): Promise<void> {
  if (!isTauri()) return
  try {
    await invoke('delete_credential', { service: name })
  } catch (e) {
    console.error(`Failed to delete credential '${name}':`, e)
  }
}
