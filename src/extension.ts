import * as vscode from 'vscode';
import * as pages from './page';

export function activate(context: vscode.ExtensionContext) {
	// prep config
	pages.updateConfig();
	//listen for changes to settings.
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		pages.updateConfig();
	}));

	type SelectFunc = (editor: vscode.TextEditor, position: vscode.Position) => void;
	type PageFunc = (document: vscode.TextDocument, position: vscode.Position) => vscode.Position;

	const updateSelection: SelectFunc = (editor: vscode.TextEditor, position: vscode.Position) => {
		editor.revealRange(new vscode.Range(position,position));
		editor.selection = new vscode.Selection(position, position);
	};
	const updateSelectionAnchor: SelectFunc = (editor: vscode.TextEditor, position: vscode.Position) => {
		editor.revealRange(new vscode.Range(position,position));
		editor.selection = new vscode.Selection(editor.selection.anchor, position);
	};
	const runIfSelection =(editor: vscode.TextEditor, update: SelectFunc, getPosition: PageFunc) => {
		if(editor.selection){
			update(editor, getPosition(editor.document, editor.selection.active));
		}
	};
	const COMMANDS = {
		pageup: (editor: vscode.TextEditor) => runIfSelection(editor, updateSelection, pages.pageUp),
		pagedown: (editor: vscode.TextEditor) => runIfSelection(editor, updateSelection, pages.pageDown),
		shiftpageup: (editor : vscode.TextEditor) => runIfSelection(editor, updateSelectionAnchor, pages.pageUp),
		shiftpagedown: (editor : vscode.TextEditor) => runIfSelection(editor, updateSelectionAnchor, pages.pageDown),
		opensettings: () => {
			vscode.commands.executeCommand( 'workbench.action.openSettings', 'Smart PageUp/PageDown' );
		}
	};

	for(let [name, func] of Object.entries(COMMANDS)){
		context.subscriptions.push(
			vscode.commands.registerTextEditorCommand('spd.' + name, func)
		);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
