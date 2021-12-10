// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as pages from './page';

var openers;
var closers;



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Smart Pageupdown activated.');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let pgup = vscode.commands.registerCommand('spd.pageup', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor?.selection !== undefined){
			const position = editor.selection.active;
			let selectionPosition = pages.pageUp(editor.document, position);
			editor.selection = new vscode.Selection(selectionPosition, selectionPosition);
			editor.revealRange(new vscode.Range(selectionPosition,selectionPosition));
		}
	});
	let pgdn = vscode.commands.registerCommand('spd.pagedown', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor?.selection !== undefined){
			const position = editor.selection.active;
			let selectionPosition = pages.pageDown(editor.document, position);
			editor.selection = new vscode.Selection(selectionPosition, selectionPosition);
			editor.revealRange(new vscode.Range(selectionPosition,selectionPosition));
		}
	});
	let shiftpgdn = vscode.commands.registerCommand('spd.shiftpagedown', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor?.selection !== undefined){
			const position = editor.selection.active;
			const anchor = editor.selection.anchor;
			let selectionPosition = pages.pageDown(editor.document, position);
			editor.selection = new vscode.Selection(anchor, selectionPosition);
			editor.revealRange(new vscode.Range(selectionPosition,selectionPosition));
		}
	});
	let shiftpgup = vscode.commands.registerCommand('spd.shiftpageup', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor?.selection !== undefined){
			const position = editor.selection.active;
			const anchor = editor.selection.anchor;
			let selectionPosition = pages.pageUp(editor.document, position);
			editor.selection = new vscode.Selection(anchor, selectionPosition);
			editor.revealRange(new vscode.Range(selectionPosition,selectionPosition));
		}
	});

	context.subscriptions.push(pgup, pgdn, shiftpgdn,shiftpgup);
}

// this method is called when your extension is deactivated
export function deactivate() {}
