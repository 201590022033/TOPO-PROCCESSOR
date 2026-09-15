# Development Validation

## Toolchain

Repository evidence in `README.md` requires Node.js 20 and Python 3.11+. The JavaScript package manager is npm, with `package-lock.json` present. The current validation host reports Node `v24.19.0` and Python `3.8.10`, so Python is below the documented requirement; the active TypeScript validation does not require the Python worker.

Expected commands from a Windows terminal:

```text
npm.cmd ci
npm.cmd run check
node_modules\.bin\tsx.cmd test\sqlite.test.ts
npm.cmd run build
npm.cmd run dev
```

The development server listens on port 3000 by default. `npm.cmd` and the direct `.cmd` binaries avoid PowerShell execution-policy problems with `npm`/`npx` PowerShell wrappers. Do not change machine-wide PowerShell policy.

## Current installation caveat

`npm.cmd ci` was attempted first, as required for a lockfile-based install, but failed because `package.json` and `package-lock.json` are not synchronized. npm reported missing optional/platform packages including `fsevents`, platform `@esbuild`/`@rollup` packages, and Sharp packages. The lockfile was not changed.

For this validation run only, dependencies were installed locally with:

```text
npm.cmd install --package-lock=false --no-audit --no-fund
```

This preserves the tracked manifests but is not a reproducible substitute for repairing the lockfile in a future maintenance milestone. No dependency versions were intentionally upgraded by this milestone.

## Validation results

- `npm.cmd run check`: invocation failed because npm did not resolve the local `tsc` shim in this environment.
- `node_modules\\.bin\\tsc.cmd --noEmit`: passed with no output.
- `npx.cmd tsx test/sqlite.test.ts`: blocked by the PowerShell wrapper/environment; no test result.
- `node_modules\\.bin\\tsx.cmd test\\sqlite.test.ts`: passed all 5 SQLite hardening/migration sections; final output was `All SQLite Hardening & Migration Tests Passed Successfully!`.
- `node_modules\\.bin\\tsx.cmd script/build.ts`: passed; Vite built 2145 modules and the server bundle was written to `dist\\index.cjs`. The build emitted only the existing >500 kB chunk warning.

`node_modules`, `dist`, local SQLite files, caches, and environment files remain ignored and were not committed.

