import * as vscode from 'vscode'
import { infoStatusBar } from './lib/util'
import autoDiary from './main'

export async function activate (context: vscode.ExtensionContext) {
  infoStatusBar('activate!', true)

  const result = await autoDiary.init()

  if (!result) return

  const disposable = vscode.commands.registerCommand('extension.syncRemote', () => {
    autoDiary.syncFile()
  })

  vscode.workspace.onDidSaveTextDocument((e) => {
    const path = e.uri.path.split('/').slice(0, -1).join('/')
    autoDiary.commitAndPush(path)
  })

  context.subscriptions.push(disposable)
}
export function deactivate () {}
