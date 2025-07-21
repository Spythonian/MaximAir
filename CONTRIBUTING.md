# Contributing to MaximAir

Thank you for your interest in contributing to MaximAir! This document outlines our branching strategy and contribution workflow.

## Branching Strategy

We follow a standard branching model with the following branches:

### Main Branches

- **`main`**: The production branch that contains the code currently deployed to production.
- **`develop`**: The development branch that contains the latest development changes for the next release.

### Supporting Branches

- **Feature Branches**: For developing new features
  - Branch from: `develop`
  - Merge back into: `develop`
  - Naming convention: `feature/feature-name`

- **Release Branches**: For preparing a new production release
  - Branch from: `develop`
  - Merge back into: `main` and `develop`
  - Naming convention: `release/vX.Y.Z`

- **Hotfix Branches**: For urgent fixes to production
  - Branch from: `main`
  - Merge back into: `main` and `develop`
  - Naming convention: `hotfix/issue-description`

## Workflow

### Feature Development

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Develop your feature with regular commits.

3. Push your feature branch to the remote repository:
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. Create a Pull Request to merge your feature into `develop`.

5. After code review and approval, merge your feature into `develop`.

### Release Process

1. Create a release branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b release/vX.Y.Z
   ```

2. Make any final adjustments and bug fixes.

3. Create a Pull Request to merge the release into `main`.

4. After the release is merged into `main`, tag the release:
   ```bash
   git checkout main
   git pull
   git tag -a vX.Y.Z -m "Version X.Y.Z"
   git push origin vX.Y.Z
   ```

5. Merge the release back into `develop`:
   ```bash
   git checkout develop
   git merge main
   git push
   ```

### Hotfix Process

1. Create a hotfix branch from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/issue-description
   ```

2. Fix the issue with one or more commits.

3. Create a Pull Request to merge the hotfix into `main`.

4. After the hotfix is merged into `main`, tag the release:
   ```bash
   git checkout main
   git pull
   git tag -a vX.Y.Z -m "Hotfix Version X.Y.Z"
   git push origin vX.Y.Z
   ```

5. Merge the hotfix back into `develop`:
   ```bash
   git checkout develop
   git merge main
   git push
   ```

## Code Style and Standards

- Follow the established code style in the project
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed