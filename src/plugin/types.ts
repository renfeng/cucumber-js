import { Envelope, TestCaseFinished, TestStepResult } from '@cucumber/messages'
import { ArrayValues, Promisable } from 'type-fest'
import { IRunEnvironment } from '../api'
import { ILogger } from '../logger'
import { IFilterablePickle } from '../filter'
import { IResolvedPaths } from '../paths'
import {
  coordinatorPredicateKeys,
  coordinatorTransformKeys,
  coordinatorVoidKeys,
} from './events'

export type Operation = 'loadSources' | 'loadSupport' | 'runCucumber'

export type CoordinatorPluginVoidEventKey = ArrayValues<
  typeof coordinatorVoidKeys
>
export type CoordinatorPluginTransformEventKey = ArrayValues<
  typeof coordinatorTransformKeys
>
export type CoordinatorPluginPredicateEventKey = ArrayValues<
  typeof coordinatorPredicateKeys
>
export type CoordinatorPluginEventKey =
  | CoordinatorPluginVoidEventKey
  | CoordinatorPluginTransformEventKey
  | CoordinatorPluginPredicateEventKey

export type CoordinatorPluginArgumentValues = {
  // void
  message: Readonly<Envelope>
  'paths:resolve': Readonly<IResolvedPaths>
  // transform
  'pickles:filter': Readonly<Array<IFilterablePickle>>
  'pickles:order': Readonly<Array<IFilterablePickle>>
  // predicate
  'testcase:retry': Readonly<TestStepResult>
}

export type CoordinatorPluginReturnValues = {
  // void
  message: void
  'paths:resolve': void
  // transform
  'pickles:filter': Readonly<Array<IFilterablePickle>>
  'pickles:order': Readonly<Array<IFilterablePickle>>
  // predicate
  'testcase:retry': boolean
}

export type CoordinatorPluginEventHandler<K extends CoordinatorPluginEventKey> =
  (
    value: CoordinatorPluginArgumentValues[K]
  ) => K extends CoordinatorPluginVoidEventKey
    ? void
    : Promisable<CoordinatorPluginReturnValues[K]>

export interface CoordinatorPluginContext<OptionsType> {
  operation: Operation
  on: <EventKey extends CoordinatorPluginEventKey>(
    event: EventKey,
    handler: CoordinatorPluginEventHandler<EventKey>
  ) => void
  options: OptionsType
  logger: ILogger
  environment: Required<IRunEnvironment>
}

export type CoordinatorPluginFunction<OptionsType> = (
  context: CoordinatorPluginContext<OptionsType>
) => Promisable<PluginCleanup | void>

export type PluginCleanup = () => Promisable<void>

/**
 * A plugin to implement Cucumber built-in functionality.
 *
 * Uses the same events and mechanisms as user-authored plugins, but is free to require configuration and context from
 * inside of Cucumber as its `options`, whereas user-authored plugins will be limited to `pluginOptions` from the
 * project configuration.
 */
export interface InternalPlugin<OptionsType = any> {
  type: 'plugin'
  coordinator: CoordinatorPluginFunction<OptionsType>
}
