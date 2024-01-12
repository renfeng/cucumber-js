import { InternalPlugin } from '../plugin'
import { RetryOptions } from './types'
import { shouldRetry } from './should_retry'

export const retryPlugin: InternalPlugin<RetryOptions> = {
  type: 'plugin',
  coordinator: async ({ on, options }) => {
    if (options.retry < 1) {
      return
    }
    on('testcase:retry', (failure) => shouldRetry(failure, options))
  },
}
