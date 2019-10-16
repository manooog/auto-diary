import { cmd } from './cmd'
import { infoStatusBar } from './util'
import { readFile } from 'fs'
import * as vscode from 'vscode'
import { ExtConfig, extStatus } from './extension'

export async function pullRebaseDiary() {
  await checkDirAndInit()
  infoStatusBar('syncing!')
  try {
    await cmd(`git pull auto-diary --rebase`).then(() => {
      infoStatusBar('sync success!')
    })
    return true
  } catch (error) {
    infoStatusBar('sync faild!')
    return false
  }
}

export async function checkDirAndInit() {
  //TODO: 增加远程服务的指纹
  //ssh-keyscan code.aliyun.com >> ~/.ssh/known_hosts
  try {
    await cmd('git status')
  } catch (error) {
    await cmd('git init')
  }
  const remote: string = await cmd(`git remote -v`)
  const isSameRemote = !remote
    ? false
    : (remote.match(/[^\s]+?\.git/) as Array<String>)[0] ===
      extStatus.config.remote

  if (isSameRemote) {
    await cmd(`git checkout ${extStatus.config.branch}`)
  } else {
    await cmd(
      `git remote ${remote ? 'set-url' : 'add'} auto-diary ${
        extStatus.config.remote
      }`
    )
    await cmd(
      `git fetch auto-diary && git checkout auto-diary/${extStatus.config.branch} -b ${extStatus.config.branch} -f`
    )
  }
}

export function readConfig(): Promise<ExtConfig> {
  return new Promise((resolve, reject) => {
    readFile(`${vscode.workspace.rootPath}/.auto-diary.json`, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve({
          branch: 'master',
          ...JSON.parse(data.toString()),
        })
      }
    })
  })
}
