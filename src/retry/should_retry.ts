import { PickleTagFilter } from '../pickle_filter'
import { IRetryableFailure, RetryOptions } from './types'

export function shouldRetry(
  failure: IRetryableFailure,
  options: RetryOptions
): boolean {
  if (options.retryTagFilter) {
    const filter = new PickleTagFilter(options.retryTagFilter)
    if (!filter.matchesAllTagExpressions(failure.pickle)) {
      return false
    }
  }
  return failure.attempt < options.retry
}
