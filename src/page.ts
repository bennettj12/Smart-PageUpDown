import * as vscode from 'vscode';

var MAX_LINES: number;
var OPENERS: string[];
var CLOSERS: string[];

export function updateConfig(){
    const CONFIG = vscode.workspace.getConfiguration('Page Up/Down');
    OPENERS = [];
    CLOSERS = [];
    MAX_LINES = CONFIG.get("maxPageSize") as number;
    if(CONFIG.get("useCurlyBrackets")){
        OPENERS.push('{');
        CLOSERS.push('}');
    }
    if(CONFIG.get("useSquareBrackets")){
        OPENERS.push('[');
        CLOSERS.push(']');
    }
    if(CONFIG.get("useParentheses")){
        OPENERS.push('(');
        CLOSERS.push(')');
    }
}
export function pageDown(doc: vscode.TextDocument, position: vscode.Position): vscode.Position{
    let text = doc.getText(new vscode.Range(position, new vscode.Position(position.line + MAX_LINES, 0)));
    let lines: string[] = text.split(/\r?\n/);
    if(!OPENERS.length){
        return new vscode.Position(Math.min(position.line + MAX_LINES, position.line + lines.length - 1), 0);
    }
    let count= 0;
    let bracketType;

    for(let line = 0; line < lines.length; line++){
        let currentLine = lines[line];
        for(let index = 0; index < currentLine.length; index++){
            let char = currentLine[index];

            if(bracketType === undefined){
                if(OPENERS.indexOf(char) !== -1){
                    let choice = OPENERS.indexOf(char);
                    bracketType = {
                        opener: char,
                        closer: CLOSERS[choice]
                    };
                } else if (CLOSERS.indexOf(char) !== -1){
                    if(line <= 1){
                        return new vscode.Position(position.line + line, position.character + index + 1);
                    } else {
                        return new vscode.Position(position.line + line - 1, lines[line - 1].length);
                    }
                }
            } else {
                if(char === bracketType.opener){
                    count++;
                } else if (char === bracketType.closer) {
                    count--;
                    if(count < 0){
                        if(line === 0){
                            return new vscode.Position(position.line + line, position.character + index + 1);
                        }
                        return new vscode.Position(position.line + line, index + 1);
                    }
                }
            }
        }
    }
    return new vscode.Position(Math.min(position.line + MAX_LINES, position.line + lines.length - 1), 0);
}

export function pageUp(doc: vscode.TextDocument, position: vscode.Position): vscode.Position{
    if(!OPENERS.length){
        return new vscode.Position(position.line - MAX_LINES, 0);
    }
    let text = doc.getText(new vscode.Range(position, new vscode.Position(Math.max(position.line - MAX_LINES,0), 0)));
    let lines = text.split(/\r?\n/);
    let count= 0;
    let bracketType;
    for(let line = 0; line < lines.length; line++){
        let thisLine = lines[lines.length - 1 - line];
        for(let index = 0; index < thisLine.length; index++){
            let char = thisLine[thisLine.length - 1 - index];
            if(bracketType === undefined){
                let opener = OPENERS.indexOf(char);
                let closer = CLOSERS.indexOf(char);
                if(opener >= 0 || closer >= 0){
                    let i = Math.max(opener,closer);
                    bracketType = {
                        opener: OPENERS[i],
                        closer: CLOSERS[i]
                    };
                    if(opener >= 0){
                        if(line <= 1){
                            return new vscode.Position(position.line - line, thisLine.length - 1 - index);
                        } else {
                            return new vscode.Position(position.line - line + 1,0);
                        }
                    } else {
                        count++;
                    }
                }
            } else {
                if(char === bracketType.closer) {
                    count++; 
                }
                if(char === bracketType.opener) {
                    if(count <= 1){
                        return new vscode.Position(Math.max(position.line - line, 0),Math.max(0, thisLine.length - index - 1));
                    } else {
                        count--;
                    }
                }
            } 
        }
    }
   
    return new vscode.Position(Math.max(position.line - MAX_LINES, 0), 0);

}