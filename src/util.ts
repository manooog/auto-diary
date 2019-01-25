import * as vscode from 'vscode';

export function infoStatusBar(info: string) {
    vscode.window.setStatusBarMessage(`auto diary: ${info}`);
}