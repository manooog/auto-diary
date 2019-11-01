import * as vscode from 'vscode'
import { cmd } from './cmd'
import { ExtConfig } from './main'
import { repoName } from './const'
const dayjs = require('dayjs')

let timer: any

export function infoStatusBar(info: string) {
  vscode.window.setStatusBarMessage(`auto diary: ${info}`)
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
  timer = setTimeout(() => {
    vscode.window.setStatusBarMessage('')
  }, 1500)
}

export const gitMethods = {
  async initRepo({ branch, remote }: ExtConfig) {
    await cmd('git init')
    await this.addRemote(remote)
  },
  async addRemote(remote: string) {
    await cmd(`git remote add ${repoName} ${remote}`)
  },
  async setRemoteUri({ remote }: ExtConfig) {
    await cmd(`git remote set-url ${repoName} ${remote}`)
  },
  async syncRemote(branch: string) {
    // TODO: 可能会存在冲突，需要想办法优化
    return await cmd(`git pull ${repoName} ${branch}`)
      .then(() => {
        return Promise.resolve(true)
      })
      .catch(() => {
        return Promise.resolve(false)
      })
  },
  async commitAndPush({ branch }: ExtConfig) {
    await cmd(`git add .`)
    await cmd(
      `git commit -m commit_by_vsc-auto-diary-ext_${dayjs().format(
        'YYYY/MM/DD_HH:mm'
      )}`
    )
    return await cmd(`git push auto-diary HEAD:${branch}`)
      .then(() => {
        return Promise.resolve(true)
      })
      .catch(() => {
        return Promise.resolve(false)
      })
  },
  async hasGitRepo() {
    let flag = true
    try {
      cmd('git status')
    } catch (error) {
      flag = false
    }
    return flag
  },
  async getRemote(): Promise<{ [key: string]: string } | undefined> {
    if (!this.hasGitRepo()) return
    let obj: { [key: string]: string } = {}
    return await cmd('git remote -v').then(res => {
      if (!res) return
      res
        .split(/\n/g)
        .filter(v => !!v)
        .forEach(url => {
          let [origin, uri] = url.split(/\t/g)
          if (!obj[origin]) {
            obj[origin] = uri.split(/\(/g)[0]
          }
        })
      return obj
    })
  },
}
