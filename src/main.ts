import { cmd } from './cmd'
import { infoStatusBar } from './util'
import { readFile } from 'fs'
import * as vscode from 'vscode'
import { ExtConfig, extStatus } from './extension'

export async function pullRebaseDiary() {
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
  let a: string = await cmd('git remote -v')
  if (a.match(/auto-diary/)) {
    await cmd(`git remote set-url auto-diary ${extStatus.config.remote}`)
  } else {
    await cmd(`git remote add auto-diary ${extStatus.config.remote}`)
  }
  //set track
  // watch out !! will reset workdir!!
  await cmd(
    `git fetch auto-diary && git checkout auto-diary/${
      extStatus.config.branch
    } -b ${extStatus.config.branch} -f`
  ).catch(async _ => {
    // 分支存在则切换过去
    await cmd(
      `git checkout ${extStatus.config.branch} && git reset auto-diary/${
        extStatus.config.branch
      }`
    )
  })
}

export function readConfig(): Promise<ExtConfig> {
  return new Promise((resolve, reject) => {
    readFile(`${vscode.workspace.rootPath}/.auto-diary.json`, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(data.toString()))
      }
    })
  })
}
