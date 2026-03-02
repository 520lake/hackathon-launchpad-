---
name: "git-pusher"
description: "Automatically push code to a specified GitHub branch. Invoke when user wants to commit and push changes."
---

# Git Pusher

This skill automates the process of committing and pushing code changes to a remote GitHub repository.

## When to Use

Use this skill when the user has completed code modifications and wants to submit and push them to a remote repository.

## Execution Steps

1.  **Check Git Status**: Verify which files have been modified.
2.  **Stage Changes**: Execute `git add .` to stage all changes.
3.  **Generate Commit Message**: Create a conventional commit message (format: `type(scope): description`) based on the changes.
4.  **Commit**: Execute `git commit` with the generated or provided message.
5.  **Check Remote Branch**: Verify if the remote branch exists; create it if it doesn't.
6.  **Push**: Execute `git push` to the specified branch.
7.  **Report**: Return the submission result and remote repository link.

## Parameters

-   **branch**: Target branch name (Default: current branch).
-   **message**: Custom commit message (Optional, AI will generate one if not provided).
-   **force**: Whether to force push (Default: `false`).

## Example

**Input:** "Push current changes to develop branch"

**Output:** "✅ Pushed 3 files to origin/develop, commit: feat(ui): Update button styles"
