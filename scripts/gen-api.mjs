import { execSync } from "node:child_process";

const source = process.env.OPENAPI_URL || "openapi/openapi.yaml";
console.log(`[gen:api] ${source} -> api/schema.d.ts`);
execSync(
  `npx -y -p typescript@5 -p openapi-typescript@7 openapi-typescript "${source}" -o api/schema.d.ts`,
  { stdio: "inherit" },
);
