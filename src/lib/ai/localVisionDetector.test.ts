/**
 * Unit tests for LocalVisionDetector.
 *
 * The OpenAI SDK is mocked so we can assert how the client is configured
 * (loopback base URL, no real key) without any network access.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { ctorOpts } = vi.hoisted(() => ({ ctorOpts: [] as Array<Record<string, unknown>> }))

vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: { content: '{"vertebrae":[]}' } }] }),
      },
    }
    constructor(opts: Record<string, unknown>) {
      ctorOpts.push(opts)
    }
  },
}))

import { useSettingsStore, DEFAULT_LOCAL_MODEL, DEFAULT_LOCAL_PORT } from '@/stores/settingsStore'
import { LocalVisionDetector } from './localVisionDetector'

beforeEach(() => {
  ctorOpts.length = 0
  useSettingsStore.getState().setLocalModel(DEFAULT_LOCAL_MODEL)
  useSettingsStore.getState().setLocalPort(DEFAULT_LOCAL_PORT)
})

describe('LocalVisionDetector', () => {
  it('is always configured — no API key required', () => {
    expect(new LocalVisionDetector().isConfigured()).toBe(true)
  })

  it('targets the loopback llama-server on the configured port with a dummy key', () => {
    useSettingsStore.getState().setLocalPort(9999)
    const detector = new LocalVisionDetector()

    detector.isConfigured() // lazily builds the client

    expect(ctorOpts).toHaveLength(1)
    expect(ctorOpts[0].baseURL).toBe('http://localhost:9999/v1')
    expect(ctorOpts[0].apiKey).toBeTruthy()
    expect(ctorOpts[0].dangerouslyAllowBrowser).toBe(true)
  })

  it('uses the configured model id, falling back to the default when blank', () => {
    // getModelVersion is protected; access it for the assertion.
    const detector = new LocalVisionDetector() as unknown as { getModelVersion(): string }

    useSettingsStore.getState().setLocalModel('my-custom-model')
    expect(detector.getModelVersion()).toBe('my-custom-model')

    useSettingsStore.getState().setLocalModel('')
    expect(detector.getModelVersion()).toBe(DEFAULT_LOCAL_MODEL)
  })
})
