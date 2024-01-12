import { Pickle, TestStepResult } from '@cucumber/messages'
import { IRunOptionsRuntime } from '../api'

export type RetryOptions = Pick<IRunOptionsRuntime, 'retry' | 'retryTagFilter'>

export interface IRetryableFailure {
  /**
   * Source of the test case in question
   */
  pickle: Pickle
  /**
   * Zero-indexed attempt number for this test case
   */
  attempt: number
  /**
   * Test step result that caused this attempt to fail
   */
  result: TestStepResult
}
