import { IRunEnvironment } from '../api'
import { ILogger } from '../logger'
import {
  CoordinatorPluginEventHandler,
  InternalPlugin,
  PluginCleanup,
  CoordinatorPluginArgumentValues,
  CoordinatorPluginEventKey,
  CoordinatorPluginTransformEventKey,
  Operation,
  CoordinatorPluginPredicateEventKey,
  CoordinatorPluginReturnValues,
} from './types'

type HandlerRegistry = {
  [K in CoordinatorPluginEventKey]: Array<CoordinatorPluginEventHandler<K>>
}

export class PluginManager {
  private handlers: HandlerRegistry = {
    message: [],
    'paths:resolve': [],
    'pickles:filter': [],
    'pickles:order': [],
    'testcase:retry': [],
  }
  private cleanupFns: PluginCleanup[] = []

  private async register<K extends CoordinatorPluginEventKey>(
    event: K,
    handler: CoordinatorPluginEventHandler<K>
  ) {
    this.handlers[event].push(handler)
  }

  async init<OptionsType>(
    operation: Operation,
    plugin: InternalPlugin<OptionsType>,
    options: OptionsType,
    logger: ILogger,
    environment: Required<IRunEnvironment>
  ) {
    const cleanupFn = await plugin.coordinator({
      operation,
      on: this.register.bind(this),
      options,
      logger,
      environment,
    })
    if (typeof cleanupFn === 'function') {
      this.cleanupFns.push(cleanupFn)
    }
  }

  emit<K extends CoordinatorPluginEventKey>(
    event: K,
    value: CoordinatorPluginArgumentValues[K]
  ): void {
    this.handlers[event].forEach((handler) => handler(value))
  }

  async transform<K extends CoordinatorPluginTransformEventKey>(
    event: K,
    value: CoordinatorPluginArgumentValues[K]
  ): Promise<CoordinatorPluginReturnValues[K]> {
    let transformed = value
    for (const handler of this.handlers[event]) {
      const returned = await handler(transformed)
      if (typeof returned !== 'undefined') {
        transformed = returned
      }
    }
    return transformed
  }

  async predicate<K extends CoordinatorPluginPredicateEventKey>(
    event: K,
    value: CoordinatorPluginArgumentValues[K]
  ): Promise<boolean> {
    for (const handler of this.handlers[event]) {
      const returned = await handler(value)
      if (returned) {
        return returned
      }
    }
    return false
  }

  async cleanup(): Promise<void> {
    for (const cleanupFn of this.cleanupFns) {
      await cleanupFn()
    }
  }
}
