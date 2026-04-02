import {describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import defaultsContract from "../shared/defaults-contract.js";

const {REQUIRED_TESTABLE_EXPORTS} = defaultsContract;

describe("runtime compatibility exports", () => {
  it("keeps the expected __testables surface after the module split", () => {
    const env = loadRuntime();
    expect(Object.keys(env.api)).toEqual(expect.arrayContaining(REQUIRED_TESTABLE_EXPORTS));
  });
});
