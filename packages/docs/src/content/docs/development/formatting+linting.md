---
title: "Formatting and Linting"
---
Formatting and linting are performed with [Biome](https://biomejs.dev/) for the following formats: `css`, `js`, `jsx`, `ts`, `tsx`, `d.ts`, `json`, and `jsonc`. Configuration and linting rules are defined in `./biome.json`.
`Biome` is much faster than its competitors and can even reformat malformed code.

## Webstorm

The official plugin for IntelliJ products, as of February 23rd, 2024, does not always function as expected:
- It seems not to respect `biome.json`, at least not without a restart of the LSP server.
- It requires manual interaction (a shortcut and click) to format.

Therefore, it is advised to avoid using the plugin.

A workaround is to set up a file watcher for changes (on save):

Go to **Settings** -> **Tools** -> **File Watcher**:

1. Click on `+` to add a new task.
2. Enter a name, e.g., `Biome JSX`.
3. Choose the file type for files to watch, e.g., `TypeScript JSX`.
4. Scope: `Project Files`.
5. Program: Specify the path to the Biome executable in your project, for example, `$ProjectFileDir$/node_modules/.pnpm/@biomejs+biome@1.8.1/node_modules/@biomejs/biome/bin/biome` (adjust the version as necessary).
6. Arguments: `check --apply --no-errors-on-unmatched $FileName$`.

Alternatively, you can import this configuration:

```markdown
<TaskOptions>
  <option name="arguments" value="check --apply --no-errors-on-unmatched $FileName$" />
  <option name="checkSyntaxErrors" value="true" />
  <option name="description" />
  <option name="exitCodeBehavior" value="ALWAYS" />
  <option name="fileExtension" value="tsx" />
  <option name="immediateSync" value="true" />
  <option name="name" value="Biome" />
  <option name="output" value="" />
  <option name="outputFilters">
    <array />
  </option>
  <option name="outputFromStdout" value="false" />
  <option name="program" value="$ProjectFileDir$/node_modules/.pnpm/@biomejs+biome@1.8.1/node_modules/@biomejs/biome/bin/biome" />
  <option name="runOnExternalChanges" value="true" />
  <option name="scopeName" value="Project Files" />
  <option name="trackOnlyRoot" value="false" />
  <option name="workingDir" value="" />
  <envs />
</TaskOptions>
```

Repeat the process by creating a copy of the file watcher task for the other file formats supported.
Most importantly `ts`, `tsx`, `js`, `jsx`, and `css`.
