import { describe, expect, it } from "vitest";
import {
  CreateProjectBody,
  EnsureProjectBody,
  parseInput,
  UpdateProjectBody,
  UpdateServiceBody,
} from "../src";

// Regression test for https://github.com/oblien/openship/issues/1018:
// projects advertise "unlimited domains" but the project input schemas capped
// publicEndpoints (which carry each domain) at 20, so a 21st domain could not
// be added from the dashboard.
const endpoint = (i: number) => ({
  port: 443,
  customDomain: `d${i}.example.com`,
  domainType: "custom" as const,
});

describe("project publicEndpoints domain cap (issue #1018)", () => {
  it("accepts more than 20 public endpoints on project update", () => {
    const publicEndpoints = Array.from({ length: 21 }, (_, i) => endpoint(i));
    const parsed = parseInput(UpdateProjectBody, { publicEndpoints });
    expect(parsed.publicEndpoints).toHaveLength(21);
  });

  it("accepts more than 20 public endpoints on project create", () => {
    const publicEndpoints = Array.from({ length: 25 }, (_, i) => endpoint(i));
    const parsed = parseInput(CreateProjectBody, { name: "x", publicEndpoints });
    expect(parsed.publicEndpoints).toHaveLength(25);
  });

  it("still rejects malformed endpoints", () => {
    const publicEndpoints = [{ port: 99999, customDomain: "d1.example.com" }];
    expect(() => parseInput(UpdateProjectBody, { publicEndpoints })).toThrow();
  });
});

// Adding a domain to a service re-saves that service's whole publicEndpoints
// list, so the service schemas need the same uncapped list as the project.
describe("service publicEndpoints domain cap (issue #1018)", () => {
  const publicEndpoints = Array.from({ length: 21 }, (_, i) => endpoint(i));

  it("accepts more than 20 public endpoints on a service update", () => {
    const parsed = parseInput(UpdateServiceBody, { publicEndpoints });
    expect(parsed.publicEndpoints).toHaveLength(21);
  });

  it("accepts more than 20 public endpoints on a compose service", () => {
    const parsed = parseInput(EnsureProjectBody, {
      name: "x",
      services: [{ name: "web", publicEndpoints }],
    });
    expect(parsed.services?.[0]?.publicEndpoints).toHaveLength(21);
  });
});
