/**
 * Unit tests for the local AI server bridge (ensureLocalServer).
 *
 * Mocks the Tauri command/event APIs and the platform check so the
 * download/start orchestration can be exercised in jsdom without a real
 * sidecar.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { invokeMock, listenMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  listenMock: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }))
vi.mock('@tauri-apps/api/event', () => ({ listen: listenMock }))

let underTauri = true
vi.mock('@/lib/utils/platform', () => ({ isTauri: () => underTauri }))

import { ensureLocalServer } from './localServer'

beforeEach(() => {
  vi.clearAllMocks()
  underTauri = true
  listenMock.mockResolvedValue(() => {})
})

describe('ensureLocalServer', () => {
  it('refuses to run outside the desktop app', async () => {
    underTauri = false
    await expect(ensureLocalServer('medgemma-4b-it', 8080)).rejects.toThrow(/desktop app/i)
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it('errors (without downloading) when the model is unknown and absent', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'local_ai_model_status') {
        return Promise.resolve({ model: 'custom', downloaded: false, known: false })
      }
      return Promise.resolve()
    })

    await expect(ensureLocalServer('custom', 8080)).rejects.toThrow(/not auto-downloadable/i)
    expect(invokeMock).toHaveBeenCalledWith('local_ai_model_status', { model: 'custom' })
    expect(invokeMock).not.toHaveBeenCalledWith('local_ai_download_model', expect.anything())
    expect(invokeMock).not.toHaveBeenCalledWith('local_ai_start', expect.anything())
  })

  it('downloads then starts a known model that is not yet on disk', async () => {
    invokeMock.mockImplementation((cmd: string, args: { model: string; port: number }) => {
      if (cmd === 'local_ai_model_status') {
        return Promise.resolve({ model: args.model, downloaded: false, known: true })
      }
      if (cmd === 'local_ai_download_model') return Promise.resolve()
      if (cmd === 'local_ai_start') {
        return Promise.resolve({ running: true, model: args.model, port: args.port })
      }
      return Promise.resolve()
    })
    const unlisten = vi.fn()
    listenMock.mockResolvedValue(unlisten)
    const onProgress = vi.fn()

    const status = await ensureLocalServer('medgemma-4b-it', 8080, onProgress)

    expect(invokeMock).toHaveBeenCalledWith('local_ai_download_model', { model: 'medgemma-4b-it' })
    expect(invokeMock).toHaveBeenCalledWith('local_ai_start', { model: 'medgemma-4b-it', port: 8080 })
    expect(listenMock).toHaveBeenCalledTimes(1) // progress listener registered
    expect(unlisten).toHaveBeenCalledTimes(1) // …and cleaned up after download
    expect(status).toEqual({ running: true, model: 'medgemma-4b-it', port: 8080 })
  })

  it('skips download and starts directly when the model is already present', async () => {
    invokeMock.mockImplementation((cmd: string, args: { model: string; port: number }) => {
      if (cmd === 'local_ai_model_status') {
        return Promise.resolve({ model: args.model, downloaded: true, known: true })
      }
      if (cmd === 'local_ai_start') {
        return Promise.resolve({ running: true, model: args.model, port: args.port })
      }
      return Promise.resolve()
    })

    await ensureLocalServer('medgemma-4b-it', 8080)

    expect(invokeMock).not.toHaveBeenCalledWith('local_ai_download_model', expect.anything())
    expect(invokeMock).toHaveBeenCalledWith('local_ai_start', { model: 'medgemma-4b-it', port: 8080 })
  })
})
