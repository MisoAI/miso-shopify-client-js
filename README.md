# Sentry SDK

## System Requirements

- Node 12

## Dev Requirement

1. Ensure commit author by

   ```bash
   git config user.name <my Miso name>
   git config user.email <my Miso email>
   ```

1. Setup git commit template by

   ```bash
   git config commit.template .gitmessage
   ```

1. Setup pre-push hook to check commit log, run linter, and unit test.

   ```bash
   ln -s ../../pre-push .git/hooks/pre-push
   ```

1. Use `Default` template for merge request
