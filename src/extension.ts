// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "smart-pgup-pgdown" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let pageUp = vscode.commands.registerCommand('spd.pageup', () => {
		vscode.window.showInformationMessage('Pageup pressed.');
	});
	let pageDown = vscode.commands.registerCommand('spd.pagedown', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor?.selection !== undefined){
			const position = editor.selection.active;
			let doc = editor.document;
			let selectionPosition = new vscode.Position(position.line + 15, 0);
			let text = doc.getText(new vscode.Range(position, selectionPosition));
			let lines = text.split(/\r?\n/);

			let count = 0;
			let trueCount = 0;
			outer:
			for(let line = 0; line < lines.length; line++){
				let thisLine = lines[line];
				for(let index = 0; index < thisLine.length; index++){
					let char = thisLine[index];
					if(char === '{') {
						count++; 
						trueCount++;
					}
					if(char === '}') {
						if(count <= 1){
							if(trueCount === 0){
								selectionPosition = new vscode.Position(position.line + line - 1, lines[line-1].length);
							} else {
								selectionPosition = new vscode.Position(position.line + line, index + 1);
							}
							break outer;
						} else {
							count--;
						}
					}
				}
			}
			editor.selection = new vscode.Selection(selectionPosition, selectionPosition);
			editor.revealRange(new vscode.Range(selectionPosition,selectionPosition));
		}
	});
	context.subscriptions.push(pageUp, pageDown);
}

// this method is called when your extension is deactivated
export function deactivate() {}
