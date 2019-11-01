import { infoStatusBar, gitMethods } from './util'
import { readFile } from 'fs'
import * as vscode from 'vscode'
import { repoName } from './const'

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

enum Status {
  'init' = '初始化',
  'syncing' = '同步中',
  'synced' = '已同步',
  'faild' = '同步失败',
}

const showError = (str: string) =>
  vscode.window.showErrorMessage('[auto-diary]:', str)

class AutoDiary {
  config: ExtConfig | undefined
  status: Status = Status.init

  async init(): Promise<any> {
    const configResult = await this.readConfig()
    if (typeof configResult === 'string') {
      throw new Error(configResult)
    }
    this.config = configResult

    this.matchBranch()
  }

  /**
   * 从文件中获取配置
   *
   * @private
   * @returns {(Promise<ExtConfig | string>)}
   * @memberof AutoDiary
   */
  private readConfig(): Promise<ExtConfig | string> {
    return new Promise((resolve, reject) => {
      readFile(`${vscode.workspace.rootPath}/.auto-diary.json`, (err, data) => {
        if (err) {
          resolve('read config faild, please check!')
        } else {
          // TODO: Check config content
          // Before this done, let's treat config options as full
          resolve({
            branch: 'master',
            ...JSON.parse(data.toString()),
          })
        }
      })
    })
  }

  private async matchBranch() {
    if (!this.config) return
    const remote = await gitMethods.getRemote()
    if (!remote) {
      gitMethods.initRepo(this.config)
    } else {
      // 是有项目的
      const curUri = remote[repoName]
      // 没有这个uri
      if (!curUri) {
        // 增加一个remote
        gitMethods.addRemote(this.config.remote)
      } else if (curUri !== this.config.remote) {
        // 更改远端地址
        gitMethods.setRemoteUri(this.config)
      }
    }
  }

  async commitAndPush() {
    if (!this.config) return
    if (this.status === Status.syncing) return
    if (this.status !== Status.synced) {
      await this.syncFile()
    }
    infoStatusBar('提交中')
    const result = await gitMethods.commitAndPush(this.config)
    if (!result) {
      infoStatusBar('提交失败，请手动检查')
      return
    }
    infoStatusBar('已提交')
  }

  async syncFile() {
    if (!this.config) return
    this.status = Status.syncing
    const result = await gitMethods.syncRemote(this.config.branch)
    // TODO: 如果同步失败，怎么处理比较合适呢
    if (result) {
      this.status = Status.synced
    } else {
      this.status = Status.faild
    }
  }
}

export default new AutoDiary()
