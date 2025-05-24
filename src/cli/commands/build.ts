#!/usr/bin/env node

import { Vite } from "#dep/vite/index.js";
import { Command } from "@molt/command";
import { loadConfig } from "../../api/load-config.js";
import { z } from "zod";

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().default(false))
  .parse();

const config = await loadConfig({
  env: {
    command: `build`,
    mode: `production`,
  },
  overrides: {
    advanced: {
      debug: args.debug,
    },
  },
});

const builder = await Vite.createBuilder(config);

await builder.buildApp();
