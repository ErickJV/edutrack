import { runExitTransition } from './motion'

export function handleGoogleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const form = event.currentTarget
  void runExitTransition().then(() => form.submit())
}
