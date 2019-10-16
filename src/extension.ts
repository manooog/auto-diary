// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { cmd } from './cmd'
import { infoStatusBar } from './util'
import { pullRebaseDiary, readConfig } from './main'
var dayjs = require('dayjs')

export interface ExtStatus {
  synced: boolean
  config: ExtConfig
}

export interface ExtConfig {
  branch: string
  remote: string
}

export let extStatus: ExtStatus = {
  synced: false,
  config: {
    branch: '',
    remote: '',
  },
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  infoStatusBar('activate!')
  extStatus.config = await readConfig()

  let disposable = vscode.commands.registerCommand(
    'extension.syncRemote',
    async () => {
      extStatus.synced = await pullRebaseDiary()
    }
  )

  extStatus.synced = await pullRebaseDiary()

  vscode.workspace.onDidSaveTextDocument(async e => {
    try {
      await cmd(`git add .`)

      await cmd(
        `git commit -m commit_by_vsc-auto-diary-ext_${dayjs().format(
          'YYYY/MM/DD_HH:mm'
        )}`
      )

      if (!extStatus.synced) {
        // init sync faild, avoid comflict, stop auto push!
        vscode.window.showWarningMessage(
          '[auto-diary]: try reload window to sync remote again!'
        )
      } else {
        infoStatusBar('pushing!')
        await cmd(`git push auto-diary HEAD:${extStatus.config.branch}`).then(
          () => {
            infoStatusBar('sync done!')
          }
        )
      }
    } catch (error) {
      vscode.window.showErrorMessage('[auto-diary]:', error)
    }
  })

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate() {}
