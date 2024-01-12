import sinon from 'sinon'
import { expect } from 'chai'
import { TestStepResultStatus } from '@cucumber/messages'
import { IRunEnvironment } from '../api'
import { ILogger } from '../logger'
import { FakeLogger } from '../../test/fake_logger'
import { IFilterablePickle } from '../filter'
import { PluginManager } from './plugin_manager'
import { CoordinatorPluginFunction } from './types'

describe('PluginManager', () => {
  const environment: Required<IRunEnvironment> = {
    cwd: 'cwd',
    stdout: process.stdout,
    stderr: process.stderr,
    env: {},
    debug: false,
  }
  const logger: ILogger = new FakeLogger()

  async function initWith(
    pluginManager: PluginManager,
    coordinator: CoordinatorPluginFunction<any>
  ): Promise<PluginManager> {
    await pluginManager.init(
      'runCucumber',
      {
        type: 'plugin',
        coordinator,
      },
      {},
      logger,
      environment
    )
    return pluginManager
  }

  it('passes the correct context to the coordinator function', async () => {
    const coordinator = sinon.fake()
    await initWith(new PluginManager(), coordinator)

    expect(coordinator).to.have.been.calledOnce
    expect(coordinator.lastCall.firstArg.operation).to.eq('runCucumber')
    expect(coordinator.lastCall.firstArg.on).to.exist
    expect(coordinator.lastCall.firstArg.options).to.deep.eq({})
    expect(coordinator.lastCall.firstArg.logger).to.eq(logger)
    expect(coordinator.lastCall.firstArg.environment).to.eq(environment)
  })

  it('calls cleanup functions from all plugins', async () => {
    const pluginManager = new PluginManager()
    const cleanup1 = sinon.fake()
    const cleanup2 = sinon.fake()
    await initWith(pluginManager, () => cleanup1)
    await initWith(pluginManager, () => cleanup2)
    await pluginManager.cleanup()

    expect(cleanup1).to.have.been.calledOnce
    expect(cleanup2).to.have.been.calledOnce
  })

  describe('void events', () => {
    it(`emits void event to all handlers`, async () => {
      const pluginManager = new PluginManager()
      const handler1 = sinon.fake()
      const handler2 = sinon.fake()
      await initWith(pluginManager, ({ on }) => on('message', handler1))
      await initWith(pluginManager, ({ on }) => on('message', handler2))

      const value = {
        testRunStarted: {
          timestamp: {
            seconds: 1,
            nanos: 1,
          },
        },
      }
      pluginManager.emit('message', value)

      expect(handler1).to.have.been.calledOnceWith(value)
      expect(handler2).to.have.been.calledOnceWith(value)
    })
  })

  describe('transforms', () => {
    const filterablePickles = [
      {
        pickle: {
          id: 'pickle-1',
        },
      },
      {
        pickle: {
          id: 'pickle-2',
        },
      },
      {
        pickle: {
          id: 'pickle-3',
        },
      },
    ] as IFilterablePickle[]

    it('should apply transforms in the order registered', async () => {
      const pluginManager = new PluginManager()
      await initWith(pluginManager, ({ on }) => {
        // removes last item
        on('pickles:filter', async (pickles) =>
          pickles.slice(0, pickles.length - 1)
        )
      })
      await initWith(pluginManager, ({ on }) => {
        // removes pickle 3 if present
        on('pickles:filter', (pickles) =>
          pickles.filter(({ pickle }) => pickle.id !== 'pickle-3')
        )
      })

      const result = await pluginManager.transform(
        'pickles:filter',
        filterablePickles
      )
      expect(result).to.have.length(2)
    })

    it('should treat undefined as a noop', async () => {
      const pluginManager = new PluginManager()
      await pluginManager.init(
        'runCucumber',
        {
          type: 'plugin',
          // bail, nothing to be done
          coordinator: ({ on }) => on('pickles:filter', () => undefined),
        },
        {},
        logger,
        environment
      )

      const result = await pluginManager.transform(
        'pickles:filter',
        filterablePickles
      )
      expect(result).to.eq(filterablePickles)
    })
  })

  describe('predicates', () => {
    const testStepResult = {
      status: TestStepResultStatus.PASSED,
      duration: {
        seconds: 1,
        nanos: 0,
      },
    }

    it('should resolve to false if all return false', async () => {
      const pluginManager = new PluginManager()
      await initWith(pluginManager, ({ on }) => {
        on('testcase:retry', async () => false)
      })
      await initWith(pluginManager, ({ on }) => {
        on('testcase:retry', async () => false)
      })

      const result = await pluginManager.predicate(
        'testcase:retry',
        testStepResult
      )
      expect(result).to.be.false
    })

    it('should resolve to true if any return true', async () => {
      const pluginManager = new PluginManager()
      await initWith(pluginManager, ({ on }) => {
        on('testcase:retry', async () => false)
      })
      await initWith(pluginManager, ({ on }) => {
        on('testcase:retry', async () => true)
      })

      const result = await pluginManager.predicate(
        'testcase:retry',
        testStepResult
      )
      expect(result).to.be.true
    })
  })
})
