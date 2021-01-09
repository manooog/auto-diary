import * as vscode from 'vscode'
import * as shelljs from 'shelljs'

export interface CMDOption {
  opt?: {
    silent: boolean
  }
  execPath?: string
}

export function cmd (order: string, option?: CMDOption) {
  const newOption: CMDOption = {
    ...option
  }
  let _pwd: string
  return new Promise<string>((resolve, reject) => {
    if (newOption.execPath) {
      _pwd = shelljs.pwd()
      shelljs.cd(newOption.execPath)
    }
    shelljs.exec(order, newOption.opt || {}, (code, stdout, stderr) => {
      if (code !== 0) {
        if (!newOption.opt?.silent) vscode.window.showErrorMessage(stderr)
        reject(stderr)
      } else {
        resolve(stdout)
      }

      if (_pwd) shelljs.cd(_pwd)
    })
  })
}
