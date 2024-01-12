import { Pickle, TestStepResult } from '@cucumber/messages'

export interface IRetryableFailure {
  pickle: Pickle
  attempt: number
  result: TestStepResult
}
