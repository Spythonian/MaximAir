#!/bin/bash

# MaximAir Git Workflow Helper Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
  echo -e "${BLUE}MaximAir Git Workflow Helper${NC}"
  echo ""
  echo "Usage: $0 [command] [arguments]"
  echo ""
  echo "Commands:"
  echo "  feature start <name>    - Start a new feature branch"
  echo "  feature finish <name>   - Finish a feature branch (merge to develop)"
  echo "  release start <version> - Start a new release branch"
  echo "  release finish <version> - Finish a release branch (merge to main and develop)"
  echo "  hotfix start <name>     - Start a new hotfix branch"
  echo "  hotfix finish <name>    - Finish a hotfix branch (merge to main and develop)"
  echo ""
  echo "Examples:"
  echo "  $0 feature start user-authentication"
  echo "  $0 release start 1.0.0"
  echo "  $0 hotfix start fix-login-issue"
}

# Function to check if branch exists
branch_exists() {
  git show-ref --verify --quiet refs/heads/$1
  return $?
}

# Function to check if working directory is clean
is_working_directory_clean() {
  if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Error: Working directory is not clean. Please commit or stash your changes.${NC}"
    return 1
  fi
  return 0
}

# Function to start a feature branch
feature_start() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Feature name is required.${NC}"
    exit 1
  fi

  is_working_directory_clean || exit 1

  local feature_name="feature/$1"
  
  # Check if branch already exists
  if branch_exists "$feature_name"; then
    echo -e "${RED}Error: Branch '$feature_name' already exists.${NC}"
    exit 1
  fi

  # Create feature branch from develop
  echo -e "${BLUE}Creating feature branch '$feature_name' from develop...${NC}"
  git checkout develop
  git pull origin develop
  git checkout -b "$feature_name"
  
  echo -e "${GREEN}Feature branch '$feature_name' created successfully.${NC}"
  echo -e "${YELLOW}Make your changes, then use 'git push -u origin $feature_name' to push your branch.${NC}"
}

# Function to finish a feature branch
feature_finish() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Feature name is required.${NC}"
    exit 1
  fi

  is_working_directory_clean || exit 1

  local feature_name="feature/$1"
  
  # Check if branch exists
  if ! branch_exists "$feature_name"; then
    echo -e "${RED}Error: Branch '$feature_name' does not exist.${NC}"
    exit 1
  fi

  # Merge feature branch into develop
  echo -e "${BLUE}Merging feature branch '$feature_name' into develop...${NC}"
  git checkout develop
  git pull origin develop
  git merge --no-ff "$feature_name" -m "Merge feature '$1'"
  
  echo -e "${GREEN}Feature branch '$feature_name' merged successfully.${NC}"
  echo -e "${YELLOW}Push changes with 'git push origin develop'${NC}"
  echo -e "${YELLOW}Delete the feature branch with 'git branch -d $feature_name' and 'git push origin --delete $feature_name'${NC}"
}

# Function to start a release branch
release_start() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number is required.${NC}"
    exit 1
  fi

  is_working_directory_clean || exit 1

  local release_name="release/v$1"
  
  # Check if branch already exists
  if branch_exists "$release_name"; then
    echo -e "${RED}Error: Branch '$release_name' already exists.${NC}"
    exit 1
  fi

  # Create release branch from develop
  echo -e "${BLUE}Creating release branch '$release_name' from develop...${NC}"
  git checkout develop
  git pull origin develop
  git checkout -b "$release_name"
  
  echo -e "${GREEN}Release branch '$release_name' created successfully.${NC}"
  echo -e "${YELLOW}Make final adjustments, then use 'git push -u origin $release_name' to push your branch.${NC}"
}

# Function to finish a release branch
release_finish() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number is required.${NC}"
    exit 1
  fi

  is_working_directory_clean || exit 1

  local release_name="release/v$1"
  local tag_name="v$1"
  
  # Check if branch exists
  if ! branch_exists "$release_name"; then
    echo -e "${RED}Error: Branch '$release_name' does not exist.${NC}"
    exit 1
  fi

  # Merge release branch into main
  echo -e "${BLUE}Merging release branch '$release_name' into main...${NC}"
  git checkout main
  git pull origin main
  git merge --no-ff "$release_name" -m "Release $tag_name"
  
  # Create tag
  echo -e "${BLUE}Creating tag '$tag_name'...${NC}"
  git tag -a "$tag_name" -m "Version $1"
  
  # Merge release branch into develop
  echo -e "${BLUE}Merging release branch '$release_name' into develop...${NC}"
  git checkout develop
  git pull origin develop
  git merge --no-ff "$release_name" -m "Merge release $tag_name into develop"
  
  echo -e "${GREEN}Release branch '$release_name' merged successfully.${NC}"
  echo -e "${YELLOW}Push changes with:${NC}"
  echo -e "${YELLOW}git push origin main${NC}"
  echo -e "${YELLOW}git push origin develop${NC}"
  echo -e "${YELLOW}git push origin $tag_name${NC}"
  echo -e "${YELLOW}Delete the release branch with 'git branch -d $release_name' and 'git push origin --delete $release_name'${NC}"
}

# Function to start a hotfix branch
hotfix_start() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Hotfix name is required.${NC}"
    exit 1
  fi

  is_working_directory_clean || exit 1

  local hotfix_name="hotfix/$1"
  
  # Check if branch already exists
  if branch_exists "$hotfix_name"; then
    echo -e "${RED}Error: Branch '$hotfix_name' already exists.${NC}"
    exit 1
  fi

  # Create hotfix branch from main
  echo -e "${BLUE}Creating hotfix branch '$hotfix_name' from main...${NC}"
  git checkout main
  git pull origin main
  git checkout -b "$hotfix_name"
  
  echo -e "${GREEN}Hotfix branch '$hotfix_name' created successfully.${NC}"
  echo -e "${YELLOW}Fix the issue, then use 'git push -u origin $hotfix_name' to push your branch.${NC}"
}

# Function to finish a hotfix branch
hotfix_finish() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Hotfix name is required.${NC}"
    exit 1
  fi

  is_working_directory_clean || exit 1

  local hotfix_name="hotfix/$1"
  
  # Check if branch exists
  if ! branch_exists "$hotfix_name"; then
    echo -e "${RED}Error: Branch '$hotfix_name' does not exist.${NC}"
    exit 1
  fi

  # Get current version from the latest tag
  local current_version=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
  current_version=${current_version#v}
  
  # Increment patch version
  IFS='.' read -r major minor patch <<< "$current_version"
  patch=$((patch + 1))
  local new_version="$major.$minor.$patch"
  local tag_name="v$new_version"
  
  # Merge hotfix branch into main
  echo -e "${BLUE}Merging hotfix branch '$hotfix_name' into main...${NC}"
  git checkout main
  git pull origin main
  git merge --no-ff "$hotfix_name" -m "Hotfix: $1"
  
  # Create tag
  echo -e "${BLUE}Creating tag '$tag_name'...${NC}"
  git tag -a "$tag_name" -m "Hotfix Version $new_version"
  
  # Merge hotfix branch into develop
  echo -e "${BLUE}Merging hotfix branch '$hotfix_name' into develop...${NC}"
  git checkout develop
  git pull origin develop
  git merge --no-ff "$hotfix_name" -m "Merge hotfix '$1' into develop"
  
  echo -e "${GREEN}Hotfix branch '$hotfix_name' merged successfully.${NC}"
  echo -e "${YELLOW}Push changes with:${NC}"
  echo -e "${YELLOW}git push origin main${NC}"
  echo -e "${YELLOW}git push origin develop${NC}"
  echo -e "${YELLOW}git push origin $tag_name${NC}"
  echo -e "${YELLOW}Delete the hotfix branch with 'git branch -d $hotfix_name' and 'git push origin --delete $hotfix_name'${NC}"
}

# Main script logic
case "$1" in
  feature)
    case "$2" in
      start)
        feature_start "$3"
        ;;
      finish)
        feature_finish "$3"
        ;;
      *)
        echo -e "${RED}Error: Unknown feature command '$2'${NC}"
        show_help
        exit 1
        ;;
    esac
    ;;
  release)
    case "$2" in
      start)
        release_start "$3"
        ;;
      finish)
        release_finish "$3"
        ;;
      *)
        echo -e "${RED}Error: Unknown release command '$2'${NC}"
        show_help
        exit 1
        ;;
    esac
    ;;
  hotfix)
    case "$2" in
      start)
        hotfix_start "$3"
        ;;
      finish)
        hotfix_finish "$3"
        ;;
      *)
        echo -e "${RED}Error: Unknown hotfix command '$2'${NC}"
        show_help
        exit 1
        ;;
    esac
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$1'${NC}"
    show_help
    exit 1
    ;;
esac

exit 0