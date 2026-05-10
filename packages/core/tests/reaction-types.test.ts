import { describe, expectTypeOf, it } from "vitest";
import { effect, event, reaction, store } from "../lib";

describe("reaction types", () => {
  it("infers run payload from a single on unit", () => {
    const changed = event<{ id: string }>();
    const count = store(0);
    const searchFx = effect(async (query: string) => query.length);

    reaction({
      on: changed,
      run(payload) {
        expectTypeOf(payload).toEqualTypeOf<{ id: string }>();
      },
    });

    reaction({
      on: count,
      run(value) {
        expectTypeOf(value).toEqualTypeOf<number>();
      },
    });

    reaction({
      on: searchFx,
      run(query) {
        expectTypeOf(query).toEqualTypeOf<string>();
      },
    });

    reaction({
      on: searchFx.doneData,
      run(result) {
        expectTypeOf(result).toEqualTypeOf<number>();
      },
    });
  });

  it("infers run payload from arrow handlers and unit lists", () => {
    const changed = event<string>();
    const count = store(0);

    reaction({
      on: changed,
      run: (value) => {
        expectTypeOf(value).toEqualTypeOf<string>();
      },
    });

    reaction({
      on: [changed, count] as const,
      run(value) {
        expectTypeOf(value).toEqualTypeOf<string | number>();
      },
    });
  });
});
