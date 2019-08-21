# vscode-cy-helper
Extension for cypress.
## Installation
* Download file `vscode-cy-helper-{version}.vsix` from this repository
* Open VS Code extensions menu
* In up right corner with 3 dots menu find option `install from VSIX`
* Select file downloaded vsix file

## Configuration
in `.vscode/settings.json`:    

| setting                              | description                           | default           |    
|:--------------------------------------|:---------------------------------------|:-------------------|    
| `cypressHelper.packageManager`       | package manager to use - npm|yarn|npx | `yarn`            |    
| `cypressHelper.commandForOpen`       | command used for opening cypress      | `cypress open`    |    
| `cypressHelper.customCommandsFolder` | path to folder with custom commands   | `cypress/support` |    

## Usage
### Open cypress custom command definition
In a spec file or step definition (in case of cucumber) select name of target command, 
and from menu select `Go to Custom Command Definition`

### Open Cypress window for single spec file
From menu select `Open Cypress Spec File`

### Running a single spec
From menu select `Open Cypress Single Spec`