// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { cmd } from './cmd';
import { infoStatusBar } from './util';
import { pullRebaseDiary, readConfig, checkDirAndInit } from './main';

export interface ExtStatus {
	synced: boolean;
	config: ExtConfig;
}

export interface ExtConfig {
	branch: string;
	remote: string;
}

export let extStatus: ExtStatus = {
	synced: false,
	config: {
		branch: '',
		remote: ''
	}
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	extStatus.config = await readConfig();
	 
	 
	 
	let disposable = vscode.commands.registerCommand('extension.syncRemote', async () => {
		extStatus.synced = await pullRebaseDiary();
	});
		
	await checkDirAndInit();
	extStatus.synced = await pullRebaseDiary();

	vscode.workspace.onDidSaveTextDocument(async (e) => {
		
		try {
			await cmd(`git add .`);
	
			await cmd(`git commit -m 'commit by vsc-auto-diary-ext ${new Date().toLocaleString()}'`);
			
			if(!extStatus.synced) {
				// init sync faild, avoid comflict, stop auto push!
				vscode.window.showWarningMessage('[auto-diary]: try reload window to sync remote again!');
			} else {
				await cmd('git push').then(() => {
					infoStatusBar('sync done!');
				});
			}

		} catch (error) {
			vscode.window.showErrorMessage('[auto-diary]:', error);
		}

	});
	
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}