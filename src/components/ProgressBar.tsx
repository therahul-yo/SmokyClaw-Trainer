import { AsciiProgress } from "./terminal/AsciiProgress";

export function ProgressBar({ value, width = 24 }: { value: number; width?: number }) {
  return <AsciiProgress value={value} width={width} showPercent={false} />;
}
