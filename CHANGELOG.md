# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- internal refactoring

## [0.2.4] - 2019-09-09
### Added
 - extension logo and description

## [0.2.3] - 2019-09-09
### Fixed
 - fix issue with parsing function argument with `undefined` or `null` default value
 recognized as object

## [0.2.2] - 2019-09-06
### Fixed
- internal refactoring

## [0.2.1] - 2019-09-04
### Added
- Support for regexp cucumber type definitions

## [0.2.0] - 2019-09-04
### Added
- Support custom cucumber types created with `defineParameterType`

## [0.1.9] - 2019-09-04
### Fixed
- internal refactoring

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
- write type definition file without failed commands

## [0.1.2] - 2019-08-28
### Fixed
- add assets folder to vscode ignore to keep extension size small

## [0.1.1] - 2019-08-28
### Changed
- use glob pattern for excludes from custom commands search

## [0.1.0] - 2019-08-27 
### Fixed
- internal refactoring

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
### Fixed
- dependencies

## [0.0.2] - 2019-08-21
### Changed
- internal refactoring

## [0.0.1] - 2019-08-21
### Added
- command to open cypress custom command definition
- command to open cypress for single test
- command to open cypress for file
- initial extention setup