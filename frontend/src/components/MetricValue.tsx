import { useCountUp } from '../utils/useCountUp'

export function MetricValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const animated = useCountUp(value)
  return (
    <>
      {animated}
      {suffix}
    </>
  )
}
