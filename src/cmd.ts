import * as vscode from 'vscode'
import * as shelljs from 'shelljs'

export interface CMDOption {
  opt?: {
    silent: boolean
  }
  isWorkspaceRoot?: boolean
}

export function cmd(
  order: string,
  option: CMDOption = { isWorkspaceRoot: true }
) {
  let newOption: CMDOption = {
    isWorkspaceRoot: true,
    ...option,
  }
  let _pwd: string
  return new Promise<string>((resolve, reject) => {
    if (newOption.isWorkspaceRoot) {
      _pwd = shelljs.pwd()
      shelljs.cd(vscode.workspace.rootPath)
    }
    shelljs.exec(order, newOption.opt || {}, (code, stdout, stderr) => {
      if (code !== 0) {
        vscode.window.showErrorMessage(stderr)
        reject(stderr)
      } else {
        resolve(stdout)
      }

      shelljs.cd(_pwd)
    })
  })
}
