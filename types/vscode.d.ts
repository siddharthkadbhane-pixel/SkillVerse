// Ambient declarations for VS Code extension development
declare module 'vscode' {
  export interface WorkspaceConfiguration {
    get<T = any>(section: string, defaultValue?: T): T;
    update(section: string, value: any, configurationTarget?: boolean | number): Promise<void>;
    [key: string]: any;
  }

  export namespace workspace {
    export const workspaceFolders: any;
    export function getConfiguration(section?: string, scope?: any): WorkspaceConfiguration;
  }

  export namespace window {
    export function createOutputChannel(name: string): OutputChannel;
    export function createStatusBarItem(alignment?: any, priority?: number): StatusBarItem;
    export function createWebviewPanel(viewType: string, title: string, showOptions: any, options?: any): WebviewPanel;
    export function registerTreeDataProvider(viewId: string, treeDataProvider: any): Disposable;
    export function showInformationMessage(message: string, ...items: any[]): Promise<any>;
    export function showWarningMessage(message: string, ...items: any[]): Promise<any>;
    export function showErrorMessage(message: string, ...items: any[]): Promise<any>;
    export function showInputBox(options?: any): Promise<string | undefined>;
    export function showQuickPick<T extends QuickPickItem = QuickPickItem>(items: T[] | Promise<T[]>, options?: any): Promise<T | undefined>;
    export function withProgress<R>(options: any, task: (progress: { report(value: { message?: string; increment?: number }): void }, token?: any) => Promise<R>): Promise<R>;
    export const activeTextEditor: any;
  }

  export namespace commands {
    export function registerCommand(command: string, callback: (...args: any[]) => any, thisArgs?: any): Disposable;
    export function executeCommand<T = unknown>(command: string, ...rest: any[]): Promise<T>;
  }

  export namespace env {
    export function openExternal(target: any): Promise<boolean>;
  }

  export class Uri {
    static parse(value: string, strict?: boolean): Uri;
    static file(path: string): Uri;
    fsPath: string;
    toString(): string;
  }

  export class EventEmitter<T = any> {
    event: (listener: (e: T) => any) => Disposable;
    fire(data?: T): void;
    dispose(): void;
  }

  export class TreeItem {
    label?: string;
    description?: string;
    tooltip?: string;
    iconPath?: any;
    command?: any;
    contextValue?: string;
    constructor(label: string, collapsibleState?: any);
  }

  export enum TreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2,
  }

  export class ThemeIcon {
    id: string;
    color?: any;
    constructor(id: string, color?: any);
  }

  export class ThemeColor {
    id: string;
    constructor(id: string);
  }

  export enum StatusBarAlignment {
    Left = 1,
    Right = 2,
  }

  export enum ViewColumn {
    Active = -1,
    Beside = -2,
    One = 1,
    Two = 2,
    Three = 3,
  }

  export enum ProgressLocation {
    SourceControl = 1,
    Window = 10,
    Notification = 15,
  }

  export interface ExtensionContext {
    subscriptions: { dispose(): any }[];
    secrets: SecretStorage;
    globalState: Memento;
    extensionUri: Uri;
    [key: string]: any;
  }

  export interface TreeDataProvider<T> {
    onDidChangeTreeData?: any;
    getTreeItem(element: T): TreeItem | Thenable<TreeItem>;
    getChildren(element?: T): Promise<T[]>;
  }

  export interface WebviewPanel {
    webview: {
      html: string;
      [key: string]: any;
    };
    reveal(viewColumn?: any, preserveFocus?: boolean): void;
    dispose(): any;
    onDidDispose: (listener: () => any, thisArgs?: any, disposables?: Disposable[]) => Disposable;
  }

  export interface StatusBarItem {
    alignment: StatusBarAlignment;
    priority?: number;
    text: string;
    tooltip?: string;
    command?: string;
    show(): void;
    hide(): void;
    dispose(): void;
  }

  export interface SecretStorage {
    get(key: string): Promise<string | undefined>;
    store(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    onDidChange?: any;
  }

  export interface Memento {
    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue: T): T;
    update(key: string, value: any): Promise<void>;
  }

  export interface OutputChannel {
    name: string;
    append(value: string): void;
    appendLine(value: string): void;
    show(preserveFocus?: boolean): void;
    dispose(): void;
  }

  export interface QuickPickItem {
    label: string;
    description?: string;
    detail?: string;
    picked?: boolean;
    alwaysShow?: boolean;
    [key: string]: any;
  }

  export interface Disposable {
    dispose(): any;
  }

  export type TextEditor = any;
}
