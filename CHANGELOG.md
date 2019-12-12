# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.9] - 2019-12-12
### Added
- fixture autocomplete for feature files on `"` character

## [0.3.8] - 2019-12-11
### Changed
- switch from klaw-sync to fast-glob to read fs

## [0.3.7] - 2019-12-10
### Added
- Command to create tsconfig.json (addressing [issue#12](https://github.com/90poe/vscode-cy-helper/issues/12))
- Prompt to create tsconfig.json if not found after generating type definitions

## [0.3.6] - 2019-12-09
### Added
- Definition provider for custom commands (native `Go to Definition`, `Peek Definition` items)
- References provider for custom commands (native `Find All References`, `Peek References` items)
- References provider for step definitions
- Configuration to disable Command References provider in case type definition file in workspace
- More information in README.
### Fixed
- opened blank file when no command definition found

## [0.3.5] - 2019-12-05
### Added
- prompt to reload vscode when configuration changed
### Fixed
- fixture autocomplete when several commands chained on same line

## [0.3.4] - 2019-12-05
### Added
- ability to configure cypress commands that require fixture autocomplete
### Fixed
- activation of fixture autocompletion for `.ts` files

## [0.3.3] - 2019-12-04
### Added
- `cy.fixture` autocompletion

## [0.3.2] - 2019-11-27
### Fixed
- issue with some globally installed dependencies causing failure to read workspace files.
- message in case no type definitions found for custom commands
### Added
- badge to readme with link to gitter chat

## [0.3.1] - 2019-11-11
### Fixed
- filePaths for cucumber commands on windows.

## [0.3.0] - 2019-11-04
### Added
- basic file watcher to reduce fs operations amount and increase performance
### Fixed
- sometimes custom command was not recognized when there are several on single line
- catch error when reading non existing file

## [0.2.9] - 2019-10-24
### Fixed
- failed extension activation when step definition folder not exist

## [0.2.8] - 2019-09-23
### Added
- possibility to add annotations for custom command type definitions
### Changed
- codebase refactoring

## [0.2.7] - 2019-09-19
### Added
- license

## [0.2.6] - 2019-09-16
### Added
- menu items are now configurable
- slight performance tweaks

## [0.2.5] - 2019-09-13
### Changed
- codebase improvements

## [0.2.4] - 2019-09-09
### Added
- extension logo and description

## [0.2.3] - 2019-09-09
### Fixed
- issue with parsing function argument with `undefined` or `null` default value
 recognized as object

## [0.2.2] - 2019-09-06
### Changed
- codebase improvements

## [0.2.1] - 2019-09-04
### Added
- Support for regexp cucumber type definitions

## [0.2.0] - 2019-09-04
### Added
- Support custom cucumber types created with `defineParameterType`

## [0.1.9] - 2019-09-04
### Changed
- codebase improvements

## [0.1.8] - 2019-09-04
### Changed
- improve Cypress custom command detection

## [0.1.7] - 2019-09-04
### Added
- menu item to find Cypress custom command references across framework

## [0.1.6] - 2019-09-04
### Added
- menu item to find Cucumber step definition references across framework

## [0.1.5] - 2019-09-02
### Added
- command to search for unused cucumber step definitions

## [0.1.4] - 2019-09-01
### Added
- search for unused cypress custom commands

## [0.1.3] - 2019-08-29
### Fixed
- case when several custom commands are used in same row
### Changed
- write type definition file even when some commands were failed to parse

## [0.1.2] - 2019-08-28
### Fixed
- add assets folder to vscode ignore to keep extension size small

## [0.1.1] - 2019-08-28
### Changed
- use glob pattern for excludes from custom commands search

## [0.1.0] - 2019-08-27
### Changed
- codebase improvements 

## [0.0.9] - 2019-08-23
### Added
- remove `@focus` and `.only` after terminal closed

## [0.0.8] - 2019-08-23
### Changed
- reuse same terminal instance for opening cypress

## [0.0.7] - 2019-08-22
### Changed
- improve user messages

## [0.0.6] - 2019-08-22
### Changed
- improve user messages

## [0.0.5] - 2019-08-22
### Added
- command for generating ts types for cypress custom commands

## [0.0.4] - 2019-08-22
### Added
- keybindings for opening cypress custom command definition
- conditions for showing menu items for commands

## [0.0.3] - 2019-08-22
### Changed
- codebase improvements

## [0.0.2] - 2019-08-21
### Changed
- codebase improvements

## [0.0.1] - 2019-08-21
### Added
- command to open cypress custom command definition
- command to open cypress for single test
- command to open cypress for file
- initial extention setup