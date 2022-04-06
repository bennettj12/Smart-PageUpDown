import { type } from 'os';
import * as vscode from 'vscode';

const nonFreeFormLanguages = [
    `python`,
]

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
    if(nonFreeFormLanguages.includes(doc.languageId)){
        return pageDownNonFreeform(doc, position);
    } 
    let text = doc.getText(new vscode.Range(position, new vscode.Position(position.line + MAX_LINES, 0)));
    let lines: string[] = text.split(/\r?\n/);
    if(!OPENERS.length){
        return new vscode.Position(Math.min(position.line + MAX_LINES, position.line + lines.length - 1), 0);
    }
    let count= 0;
    let bracketType: {opener: string, closer: string} | undefined;

    for(let line = 0; line < lines.length; line++){
        let currentLine = lines[line];
        if(bracketType === undefined){
            let potentialBracket = getInitialBracket(currentLine);
            if(potentialBracket.index >= 0){
                bracketType = potentialBracket.bracket;
                if(potentialBracket.closed === true){
                    if(line <= 1){
                        console.log("closed bracket at start of file");
                        return new vscode.Position(position.line + line, position.character + potentialBracket.index + 1);
                    } else {
                        console.log("closed bracket found on line " + (line + 1) + " but not on line 1");
                        return new vscode.Position(position.line + line - 1, lines[line - 1].length);
                    }
                }
            } else {
                bracketType = undefined;
            }
        } else {
            let bracketData = getLineBracketCount(count, currentLine, bracketType.opener, bracketType.closer);
            if(bracketData.index >= 0){
                if(line === 0){
                    console.log("bracket found on line 1");
                    return new vscode.Position(position.line + line, position.character + bracketData.index + 1);
                }
                console.log("bracket found on line " + (line + 1));
                return new vscode.Position(position.line + line, bracketData.index + 1);
            } else {
                count = bracketData.count;
            }
            
        }
    }
    return new vscode.Position(Math.min(position.line + MAX_LINES, position.line + lines.length - 1), 0);
}

export function pageUp(doc: vscode.TextDocument, position: vscode.Position): vscode.Position{
    if(nonFreeFormLanguages.includes(doc.languageId)){
        return pageUpNonFreeform(doc, position);
    }
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

export function pageUpNonFreeform(doc: vscode.TextDocument, position: vscode.Position): vscode.Position {
    let text = doc.getText(new vscode.Range(
        new vscode.Position(position.line, 0), 
        new vscode.Position(Math.min(position.line + MAX_LINES,0), 0)));   

        let lines = text.split(/\r?\n/)

    return new vscode.Position(Math.max(position.line - MAX_LINES, 0), 0);
}
export function pageDownNonFreeform(doc: vscode.TextDocument, position: vscode.Position): vscode.Position{
    // current line from the beginning.
    let text = doc.getText(new vscode.Range(
        new vscode.Position(position.line, 0), 
        new vscode.Position(position.line + MAX_LINES, 0)));
    let lines = text.split(/\r?\n/);

    let startingDepth: number = getLineDepth(lines[0]); 
    let innerDepthReached: boolean = false;
    //for each line
    for(let line = 0; line < lines.length; line++){
        let thisLine = lines[line];
        let depth = getLineDepth(thisLine);
        if(depth > startingDepth){
            innerDepthReached = true;
        }
        if(depth < startingDepth || (innerDepthReached && depth === startingDepth)){
            if(isWhitespace(thisLine)){
                continue;
            }
            // backtrack to last line that is not whitespace
            let cLine = line - 1;
            thisLine = lines[cLine];
            while(isWhitespace(thisLine)){
                cLine--;
                thisLine = lines[cLine];
            }
            return new vscode.Position(position.line + cLine + 1,0);
        }
    }
    return new vscode.Position(Math.min(position.line + MAX_LINES, position.line + lines.length - 1), 0);
}
// searches a line for opening or closing brackets, returns the type of bracket found, or none
function getInitialBracket(line: string): {bracket?: any, index: number, closed: boolean} {
    for(let i = 0; i < line.length; i++){
        if(OPENERS.indexOf(line[i]) >= 0){
            return {
                index: i,
                bracket: {
                    opener: line[i],
                    closer: CLOSERS[OPENERS.indexOf(line[i])]
                },
                closed: false
            };
        } else if (CLOSERS.indexOf(line[i]) >= 0){
            return {
                index: i,
                bracket: {
                    opener: OPENERS[CLOSERS.indexOf(line[i])],
                    closer: line[i]
                },
                closed: true
            };
        }

    }
    return {
        index: -1,
        bracket: undefined,
        closed: false
    };
}

// gets the number of brackets in a line, openers and closers cancel each other out
function getLineBracketCount(count: number, line: string, opener: string, closer: string): {index: number, count: number} {
    let data = {
        index: -1,
        count: count
    }
    let individualLineCount = 0;
    for(let i = 0; i < line.length; i++){
        let char = line[i];
        if(opener === char){
            count++;
            individualLineCount++;
        } else if (closer === char){
            count--;
            individualLineCount--;
        }
        if(count === 0 && individualLineCount === 0){
            data.index = i;
            data.count = count;
            return data;
        }

    }
    data.count = count;
    return data;
}
function getLineDepth(line: string): number{
    let depth = 0;
    for(let i = 0; i < line.length; i++){
        if(line[i] === ' '){
            depth++;
        } else {
            break;
        }
    }
    return depth;
}
// this method detects if a line contains only whitespace
// comments are considered to be whitespace
function isWhitespace(line: string): boolean{
    let whitespace = /^\s*$/;
    return whitespace.test(line) || line.length === 0 || isComment(line);
}
// this method detects if a line is a comment
function isComment(line: string): boolean{
    let comment = /^\s*#/;
    return comment.test(line);
}