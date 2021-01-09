import { cmd } from './cmd'
import { ExtConfig, workspaceWithConfig } from '../main'
import { chcheDirName, repoName } from '../constant'
import { existsSync, mkdirSync } from 'fs'
import dayjs = require('dayjs')

export class GitMethods {
  execPath: string = ''
  constructor (path: string) {
    this.execPath = path
  }

  async cmd (command: string) {
    return await cmd(command, {
      execPath: this.execPath,
      opt: {
        silent: true
      }
    }).catch(err => {
      console.log(`[shell] ${command} 失败：\n${err}`)
      throw new Error(err)
    })
  }

  async initRepo ({ config: { remote, branch } }: workspaceWithConfig) {
    // @see: https://askubuntu.com/a/483192；https://unix.stackexchange.com/questions/6393/how-do-you-move-all-files-including-hidden-from-one-directory-to-another
    const match = '{*,.[^auto]*}'

    await this.cmd('git init')
    await this.addRemote(remote)

    await this.cmd(`git fetch ${repoName}`)
    // 先行判断是否存在目标分支
    debugger
    const branchName = await this.cmd(`git branch -la | grep ${repoName}/${branch}`)
    debugger
    if (branchName) {
      if (!existsSync(`${this.execPath}/${chcheDirName}`)) {
        mkdirSync(`${this.execPath}/${chcheDirName}`)
      }
      await this.cmd(`mv ./${match} ${chcheDirName}`).catch(() => {
        // do nothing
      })
      await this.cmd(`git checkout -f ${repoName}/${branch} -b ${branch}`).catch(_ => {
        // 是一个空项目，或者目标分支不存在
        // do nothing
      })
      await this.cmd(`cp -R ${chcheDirName}/${match} ./`).catch(() => {
        // do nothing
      })
      await this.cmd(`rm -rf ${chcheDirName}`)
    }
  }

  async addRemote (remote: string) {
    await this.cmd(`git remote add ${repoName} ${remote}`)
  }

  async setRemoteUri ({ remote }: ExtConfig) {
    await this.cmd(`git remote set-url ${repoName} ${remote}`)
  }

  async syncRemote (branch: string): Promise<boolean> {
    return await this.cmd(`git pull ${repoName} ${branch}`)
      .then(_ => true)
      .catch(_ => false)
  }

  async commitAndPush ({ branch }: ExtConfig) {
    await this.cmd('git add .')
    await this.cmd(`git commit -m commit_by_vsc-auto-diary-ext_${dayjs().format('YYYY/MM/DD_HH:mm')}`)
    return await this.cmd(`git push auto-diary ${branch}:${branch}`)
      .then(() => {
        return Promise.resolve(true)
      })
      .catch(() => {
        return Promise.resolve(false)
      })
  }

  async hasGitRepo () {
    let flag = true
    try {
      await this.cmd('git status')
    } catch (error) {
      flag = false
    }
    return flag
  }

  async getRemote (): Promise<{ [key: string]: string } | undefined> {
    if (!(await this.hasGitRepo())) return
    const obj: { [key: string]: string } = {}
    return await this.cmd('git remote -v').then((res) => {
      if (!res) return
      res
        .split(/\n/g)
        .filter((v) => !!v)
        .forEach((url) => {
          const [origin, uri] = url.split(/\t/g)
          if (!obj[origin]) {
            obj[origin] = uri.split(/\(/g)[0]
          }
        })
      return obj
    })
  }
}
