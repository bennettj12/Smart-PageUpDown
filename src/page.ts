import * as vscode from 'vscode';

const CONFIG = vscode.workspace.getConfiguration('Page Up/Down');
const MAX_LINES = CONFIG.get("maxPageSize") as number;
const OPENERS: string[] = [];
const CLOSERS: string[] = [];
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


export function pageDown(doc: vscode.TextDocument, position: vscode.Position): vscode.Position{
    if(!OPENERS.length){
        return new vscode.Position(position.line + MAX_LINES, 0);
    }

    let text = doc.getText(new vscode.Range(position, new vscode.Position(position.line + MAX_LINES, 0)));
    let lines = text.split(/\r?\n/);
    let count= 0;
    let bracketType;
    for(let line = 0; line < lines.length; line++){
        let thisLine = lines[line];
        for(let index = 0; index < thisLine.length; index++){
            let char = thisLine[index];
            if(bracketType === undefined){
                let opener = OPENERS.indexOf(char);
                let closer = CLOSERS.indexOf(char);
                if(opener >= 0 || closer >= 0){
                    let i = Math.max(opener,closer);
                    bracketType = {
                        opener: OPENERS[i],
                        closer: CLOSERS[i]
                    };
                    if(closer >= 0){
                        return new vscode.Position(position.line + line - 1, 999);
                    } else {
                        if(thisLine && thisLine.length > index && thisLine[index + 1] === bracketType.closer){
                            // skip open/close | '[]' '{}' '()'
                            bracketType = undefined;
                            index++;
                            continue;
                        }
                        count++;
                    }
                }
            } else {
                if(char === bracketType.opener) {
                    count++; 
                }
                if(char === bracketType.closer) {
                    if(count <= 1){
                        return new vscode.Position(position.line + line, index + 1);
                    } else {
                        count--;
                    }
                }
            } 
        }
    }
    return new vscode.Position(position.line + MAX_LINES, 0);
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
                        return new vscode.Position(position.line - line + 1,0);
                    } else {
                        if(thisLine && thisLine.length > index && thisLine[thisLine.length - 2 - index] === bracketType.opener){
                            // skip open/close | '[]' '{}' '()'
                            bracketType = undefined;
                            index++;
                            continue;
                        }
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