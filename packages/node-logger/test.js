// Sets TEST_LOGGING before the logger is imported, so this works in every shell (cmd.exe has no `VAR=value cmd`).
process.env.TEST_LOGGING = 'true';
await import('./dist/index.js');
