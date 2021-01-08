import * as vscode from 'vscode'

let timer: any

export function infoStatusBar (info: string, persist: boolean = false) {
  vscode.window.setStatusBarMessage(`auto diary: ${info}`)
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
  if (persist) return
  timer = setTimeout(() => {
    vscode.window.setStatusBarMessage('')
  }, 1500)
}
