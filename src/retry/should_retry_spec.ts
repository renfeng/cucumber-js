import { expect } from 'chai'
import {
  Pickle,
  TestStepResult,
  TestStepResultStatus,
} from '@cucumber/messages'
import { shouldRetry } from './should_retry'

describe('shouldRetry', () => {
  const result: TestStepResult = {
    status: TestStepResultStatus.FAILED,
    duration: {
      seconds: 1,
      nanos: 0,
    },
  }

  it("should return false when tag filter is present and doesn't match pickle", () => {
    expect(
      shouldRetry(
        {
          pickle: {
            tags: [{ name: '@things', astNodeId: '123' }],
          } as unknown as Pickle,
          attempt: 0,
          result,
        },
        {
          retry: 2,
          retryTagFilter: '@stuff',
        }
      )
    ).to.be.false
  })

  it('should return true when tag filter is present and matches pickle', () => {
    expect(
      shouldRetry(
        {
          pickle: {
            tags: [{ name: '@stuff', astNodeId: '123' }],
          } as unknown as Pickle,
          attempt: 0,
          result,
        },
        {
          retry: 2,
          retryTagFilter: '@stuff',
        }
      )
    ).to.be.true
  })

  describe('number of attempts', () => {
    const cases = [
      [2, 0, true],
      [2, 1, true],
      [2, 2, false],
      [2, 3, false],
    ] as const
    cases.forEach(([max, attempt, expected]) => {
      it(`should return ${expected} for attempt ${attempt} with max set to ${max}`, () => {
        expect(
          shouldRetry(
            {
              pickle: {
                tags: [],
              } as unknown as Pickle,
              result,
              attempt,
            },
            {
              retry: max,
              retryTagFilter: '',
            }
          )
        ).to.eq(expected)
      })
    })
  })
})
