import { cmd } from "./cmd";
import { infoStatusBar } from "./util";
import { readFile } from 'fs';
import * as vscode from 'vscode';
import { ExtConfig, extStatus } from "./extension";

export async function pullRebaseDiary() {
    try {
        await cmd('git pull --rebase').then(() => {
            infoStatusBar('sync success!');
        });
        return true;
    } catch (error) {
        infoStatusBar('sync faild!');
        return false;
    }
}

export async function checkDirAndInit() {
    try {
        await cmd('git status');
    } catch (error) {
        await cmd(`git init && git remote add auto-diary ${extStatus.config.remote}`);
        //set track
        // watch out !! will reset workdir!!
        await cmd(`git fetch auto-diary && git checkout ${extStatus.config.branch} -f`);
    }
}

export function readConfig(): Promise<ExtConfig> {
    return new Promise((resolve, reject) => {
        readFile(`${vscode.workspace.rootPath}/.auto-diary.json`, (err, data) => {
            if(err) {
                reject(err);
            } else {
                resolve(JSON.parse(data.toString()));
            }
        });
    });
}