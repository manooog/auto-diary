import * as vscode from 'vscode'
import { infoStatusBar } from './util'
import autoDiary from './main'

export async function activate(context: vscode.ExtensionContext) {
  infoStatusBar('activate!')

  await autoDiary.init()

  let disposable = vscode.commands.registerCommand(
    'extension.syncRemote',
    () => {
      autoDiary.syncFile()
    }
  )

  autoDiary.syncFile()

  vscode.workspace.onDidSaveTextDocument(e => autoDiary.commitAndPush())

  context.subscriptions.push(disposable)
}
export function deactivate() {}
