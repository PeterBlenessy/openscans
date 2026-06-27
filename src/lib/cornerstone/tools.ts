/**
 * cornerstone-tools tool names for the measurement / ROI tools we register.
 * These string identifiers match the `name` of each built-in tool class and are
 * what `setToolActive` / `setToolPassive` and the `activeTool` store field use.
 */
export const MEASUREMENT_TOOL_NAMES = {
  Length: 'Length',
  Angle: 'Angle',
  CobbAngle: 'CobbAngle',
  EllipticalRoi: 'EllipticalRoi',
  RectangleRoi: 'RectangleRoi',
  Probe: 'Probe',
  ArrowAnnotate: 'ArrowAnnotate',
} as const

export type MeasurementToolName = keyof typeof MEASUREMENT_TOOL_NAMES

const MEASUREMENT_TOOL_SET = new Set<string>(Object.values(MEASUREMENT_TOOL_NAMES))

/** True when `toolName` is one of the cornerstone-tools measurement/ROI tools. */
export function isMeasurementTool(toolName: string): boolean {
  return MEASUREMENT_TOOL_SET.has(toolName)
}
