import { infoStatusBar } from './util'
import { readFile } from 'fs'
import * as vscode from 'vscode'
import { repoName } from './const'
import { GitMethods } from './lib/gitMethod'

export interface ExtConfig {
  branch: string
  remote: string
}

export interface ExtStatus {
  synced: boolean
  config: ExtConfig
}

export const extStatus: ExtStatus = {
  synced: false,
  config: {
    branch: '',
    remote: ''
  }
}

export type workspaceWithConfig = vscode.WorkspaceFolder & { config: ExtConfig, gitMethods: GitMethods }

const Status = {
  init: '初始化',
  syncing: '同步中',
  synced: '已同步',
  faild: '同步失败'
}

class AutoDiary {
  status: string = Status.init
  validateWorkspace: Array<workspaceWithConfig> = []

  async init (): Promise<boolean> {
    this.validateWorkspace = await this.getValidateWorkspace()

    if (this.validateWorkspace.length === 0) {
      infoStatusBar('没有找到配置文件 auto-diary.json')
      return false
    }

    this.validateWorkspace.forEach((workspace) => {
      this.matchBranch(workspace)
    })

    return true
  }

  async getValidateWorkspace (): Promise<Array<workspaceWithConfig>> {
    const folders = vscode.workspace.workspaceFolders || []
    return await Promise.all<any>(
      folders.map((folder) => {
        const {
          uri: { path }
        } = folder
        return new Promise((resolve) => {
          readFile(`${path}/auto-diary.json`, (err, data) => {
            // TODO: Check config content
            resolve(
              err
                ? false
                : {
                    ...folder,
                    config: {
                      branch: 'master',
                      ...JSON.parse(data.toString())
                    },
                    gitMethods: new GitMethods(folder.uri.path)
                  }
            )
          })
        })
      })
    ).then((res) => res.filter(Boolean))
  }

  private async matchBranch (ws: workspaceWithConfig) {
    const { config, gitMethods } = ws
    const remote = await gitMethods.getRemote()
    if (!remote) {
      gitMethods.initRepo(ws)
    } else {
      // 是有项目的
      const curUri = remote[repoName]
      // 没有这个uri
      if (!curUri) {
        // 增加一个remote
        gitMethods.addRemote(config.remote)
      } else if (curUri !== config.remote) {
        // 更改远端地址
        gitMethods.setRemoteUri(config)
      }
    }
  }

  async commitAndPush (path: string) {
    const workspace = this.validateWorkspace.find(({ uri: { path: myPath } }) =>
      myPath === path
    )
    if (!workspace) return
    if (this.status === Status.syncing) return
    if (this.status !== Status.synced) {
      await this.syncWorkspace(workspace)
    }
    infoStatusBar('提交中')
    const { gitMethods, config } = workspace
    const result = await gitMethods.commitAndPush(config)
    if (!result) {
      infoStatusBar('提交失败，请手动检查')
      return
    }
    infoStatusBar('已提交')
  }

   syncWorkspace: (workspace: workspaceWithConfig) => void = async ({ config, gitMethods }) => {
     const result = await gitMethods.syncRemote(config.branch)
     if (result) {
       this.status = Status.synced
     } else {
       this.status = Status.faild
     }
   }

   async syncFile () {
     this.status = Status.syncing

     this.validateWorkspace.forEach(this.syncWorkspace)
   }
}

export default new AutoDiary()
