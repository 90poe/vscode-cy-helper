# vscode-cy-helper
Cypress extension for vs code  
## Installation
* Download file `vscode-cy-helper-{version}.vsix` from this repository
* Open VS Code extensions menu
* In up right corner with 3 dots menu find option `install from VSIX`
* Select file downloaded vsix file  

![](./assets/install.gif)

## Configuration

| setting                              | description                           | default           |    
|:--------------------------------------|:---------------------------------------|:-------------------|        
| `cypressHelper.commandForOpen`       | command used for opening cypress      | `cypress open`    |    
| `cypressHelper.customCommandsFolder` | path to folder with custom commands   | `cypress/support` |    
| `cypressHelper.typeDefinitionFile` | file to save generated custom commands   | `cypress/support/customCommands.d.ts`|    
| `cypressHelper.typeDefinitionExcludePatterns` | array of glob patterns that should be excluded from types generation  | [`**/*.ts`] |    

## Available commands or menu items
* [Go to cypress custom command definition](#1-open-cypress-custom-command-definition)
* [Open Cypress](#2-open-cypress-window)
* [Generate type definition for custom commands](#3-generate-type-definitions-for-cypress-custom-commands)
* [Find not used custom commands](#4-find-not-used-cypress-custom-commands)
* [Find not used cucumber step definitions](#5-find-not-used-cucumber-step-definitions)
* [Find custom command references](#6-find-cypress-custom-commands-references)
* [Find cucumber step references](#7-find-cucumber-step-definition-references)

## Usage
### 1. Open cypress custom command definition
Click on cypress custom command, and from menu select `Cypress: Go to custom command definition`

![](./assets/goToCommand.gif)

### 2. Open Cypress window
* for opening file - select in menu `Cypress: Open spec file`  
* for marking some tests with `only` tags - select in menu `Cypress: Open single test`  
Tags will be deleted after closing terminal instance

![](./assets/openSingleTest.gif)

### 3. Generate type definitions for Cypress custom commands
From menu select `Cypress: Generate custom command types`

![](./assets/generateTypes.gif)

### 4. Find unused Cypress custom commands
From command palette select command `Cypress: Find not used custom commands`  

![](./assets/findUnusedCustomCommands.gif)

### 5. Find unused Cucumber step definitions
From command palette select command `Cypress: Find not used Cucumber step definitions`  

![](./assets/findUnusedStepDefinitions.gif)

### 6. Find Cypress custom commands references
From menu select `Cypress: Get custom command references`

![](./assets/customCommandReference.gif)

### 7. Find Cucumber step definition references
From menu select `Cypress: Get step definition references`

![](./assets/stepDefinitionReference.gif)