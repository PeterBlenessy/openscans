/**
 * Smoke tests: every ui-kit primitive mounts without error in both themes and
 * renders its key variants. Guards against bad token usage / crashing markup.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { Theme } from '@/stores/settingsStore'
import {
  Spinner, ProgressBar, ViewportStatusOverlay, Button, CardButton,
  SegmentedControl, Checkbox, Callout, Badge, EmptyState,
} from './index'

const themes: Theme[] = ['dark', 'light']

describe('ui kit primitives', () => {
  for (const theme of themes) {
    it(`renders all primitives in ${theme} theme`, () => {
      const { container, getByText } = render(
        <div>
          <Spinner label="loading" />
          <ProgressBar value={42} theme={theme} label="p" />
          <ProgressBar value={null} theme={theme} label="indeterminate" />
          <ViewportStatusOverlay title="Working" detail="d" progress={50} theme={theme} />
          <Button variant="primary" theme={theme}>Primary</Button>
          <Button variant="secondary" theme={theme}>Secondary</Button>
          <Button variant="ghost" theme={theme}>Ghost</Button>
          <Button variant="danger" theme={theme}>Danger</Button>
          <Button variant="icon" theme={theme} aria-label="icon" />
          <Button variant="primary" theme={theme} loading>Loading</Button>
          <CardButton selected onClick={() => {}} theme={theme}>Sel</CardButton>
          <CardButton selected={false} onClick={() => {}} theme={theme}>Unsel</CardButton>
          <SegmentedControl
            ariaLabel="seg"
            theme={theme}
            value="a"
            onChange={() => {}}
            options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
          />
          <Checkbox checked onChange={() => {}} label="Check" theme={theme} />
          <Callout tone="info" title="Info" theme={theme}>info body</Callout>
          <Callout tone="warn" title="Warn" theme={theme}>warn body</Callout>
          <Callout tone="error" title="Err" collapsible theme={theme}>err body</Callout>
          <Badge tone="success" theme={theme}>Installed</Badge>
          <EmptyState title="Empty" description="nothing" theme={theme} />
        </div>,
      )
      expect(container).toBeTruthy()
      expect(getByText('Primary')).toBeInTheDocument()
      expect(getByText('Installed')).toBeInTheDocument()
    })
  }

  it('SegmentedControl marks the active option via aria-checked', () => {
    const { getByRole } = render(
      <SegmentedControl
        ariaLabel="seg"
        value="b"
        onChange={() => {}}
        options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
      />,
    )
    expect(getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'true')
    expect(getByRole('radio', { name: 'A' })).toHaveAttribute('aria-checked', 'false')
  })
})
