import * as core from "@virentia/core";
import type {
  EventCallable as CoreEvent,
  EventPayload,
  Scope as CoreScope,
  StoreWritable as CoreStoreWritable,
} from "@virentia/core";

export const unitKind = Symbol("virentia.effector.unit");

export type Unsubscribe = () => void;

export interface Scope {
  readonly __core: CoreScope;
  getState<T>(store: Store<T>): T;
}

export interface CompatScope extends Scope {
  readonly __changedSids: Set<string>;
}

export interface Unit<T = unknown> {
  readonly [unitKind]: UnitKind;
  readonly node: core.Node;
  readonly shortName: string;
  getType(): string;
  watch(fn: (payload: T) => void): Unsubscribe;
}

export interface Event<T = void> extends Unit<T> {
  map<Next>(fn: (payload: T) => Next): Event<Next>;
  filter(config: { fn(payload: T): boolean } | ((payload: T) => boolean)): Event<T>;
  filterMap<Next>(fn: (payload: T) => Next | undefined): Event<Next>;
  prepend<Before>(fn: (payload: Before) => T): EventCallable<Before>;
}

export interface EventCallable<T = void> extends Event<T> {
  (...payload: EventPayload<T>): Promise<void>;
}

export interface Store<T> extends Unit<T> {
  readonly updates: Event<T>;
  readonly sid?: string;
  defaultState: T;
  getState(scope?: Scope): T;
  map<Next>(fn: (state: T) => Next): Store<Next>;
  on<Payload>(trigger: Unit<Payload>, reducer: (state: T, payload: Payload) => T): Store<T>;
  reset(trigger: Unit<any> | readonly Unit<any>[]): Store<T>;
}

export interface StoreWritable<T> extends Store<T> {
  setState(value: T, scope?: Scope): void;
  on<Payload>(trigger: Unit<Payload>, reducer: (state: T, payload: Payload) => T): StoreWritable<T>;
  reset(trigger: Unit<any> | readonly Unit<any>[]): StoreWritable<T>;
}

export interface Effect<Params, Done, Fail = Error> extends Unit<Params> {
  (...params: EventPayload<Params>): Promise<Done>;
  readonly done: Event<{ params: Params; result: Done }>;
  readonly fail: Event<{ params: Params; error: Fail }>;
  readonly finally: Event<
    | { status: "done"; params: Params; result: Done }
    | { status: "fail"; params: Params; error: Fail }
  >;
  readonly doneData: Event<Done>;
  readonly failData: Event<Fail>;
  readonly pending: Store<boolean>;
  readonly inFlight: Store<number>;
  prepend<Before>(fn: (payload: Before) => Params): EventCallable<Before>;
  use: {
    (handler: (params: Params) => Done | PromiseLike<Done>): Effect<Params, Done, Fail>;
    getCurrent(): (params: Params) => Done | PromiseLike<Done>;
  };
}

export type UnitKind = "event" | "store" | "effect";
export type AnyUnit = Event<any> | Store<any> | Effect<any, any, any>;
export type UnitTargetable<T = any> = EventCallable<T> | StoreWritable<T> | Effect<T, any, any>;
export type UnitTarget<T> = Unit<T> | readonly Unit<T>[];

export interface BaseUnit<T> extends Unit<T> {
  readonly __core: core.Unit<T>;
}

export interface EventState<T> extends EventCallable<T>, BaseUnit<T> {
  readonly __core: CoreEvent<T> | core.Event<T>;
}

export interface StoreState<T> extends StoreWritable<T>, BaseUnit<T> {
  readonly __box: CoreStoreWritable<{ value: T }>;
}

export interface EffectState<Params, Done, Fail>
  extends Effect<Params, Done, Fail>, BaseUnit<Params> {
  readonly __core: core.Effect<Params, Done, Fail>;
}

export type SourceShape = Store<any> | readonly Store<any>[] | Record<string, Store<any>>;

export type SourceValue<Source> =
  Source extends Store<infer Value>
    ? Value
    : Source extends readonly unknown[]
      ? { [Key in keyof Source]: Source[Key] extends Store<infer Value> ? Value : never }
      : Source extends Record<string, Store<any>>
        ? { [Key in keyof Source]: Source[Key] extends Store<infer Value> ? Value : never }
        : never;

export type StoreValues =
  | Record<string, unknown>
  | ReadonlyMap<StoreWritable<any> | string, unknown>
  | readonly (readonly [StoreWritable<any>, unknown])[];
