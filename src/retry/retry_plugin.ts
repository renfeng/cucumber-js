import { InternalPlugin } from '../plugin'
import { IRunOptionsRuntime } from '../api'

export const retryPlugin: InternalPlugin<
  Pick<IRunOptionsRuntime, 'retry' | 'retryTagFilter'>
> = {
  type: 'plugin',
  coordinator: async ({ on, options }) => {
    if (options.retry < 1) {
      return
    }
    on('testcase:retry', (event) => {
      return false
    })
  },
}
