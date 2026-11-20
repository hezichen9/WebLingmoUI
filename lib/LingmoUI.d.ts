/* WebLingmoUI 类型声明 */

export interface LingmoUIInstance {
    el: HTMLElement;
    destroy(): void;
}

export interface SwitchOptions {
    value?: boolean;
    disabled?: boolean;
    onChange?(detail: { value: boolean }): void;
}

export interface SwitchInstance extends LingmoUIInstance {
    readonly value: boolean;
    readonly disabled: boolean;
    setValue(value: boolean): void;
    setDisabled(disabled: boolean): void;
}

export interface TabBarOptions {
    value?: string;
    onChange?(detail: { value: string; tab: HTMLElement }): void;
}

export interface TabBarInstance extends LingmoUIInstance {
    readonly value: string | null;
    setValue(value: string): void;
}

export interface IconCheckOptions {
    value?: string;
    onChange?(detail: { value: string; item: HTMLElement }): void;
}

export interface IconCheckInstance extends LingmoUIInstance {
    readonly value: string | null;
    setValue(value: string): void;
}

export interface ComboboxOptions {
    value?: string;
    disabled?: boolean;
    onChange?(detail: { value: string; index: number; option: HTMLOptionElement }): void;
}

export interface ComboboxInstance extends LingmoUIInstance {
    readonly value: string;
    readonly isOpen: boolean;
    setValue(value: string): void;
    setDisabled(disabled: boolean): void;
    open(): void;
    close(focusTrigger?: boolean): void;
}

export interface SliderOptions {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onChange?(detail: { value: number }): void;
}

export interface SliderInstance extends LingmoUIInstance {
    readonly value: number;
    readonly disabled: boolean;
    setValue(value: number): void;
    setDisabled(disabled: boolean): void;
}

export interface MenuOptions {
    onOpen?(): void;
    onClose?(): void;
}

export interface MenuInstance extends LingmoUIInstance {
    readonly isOpen: boolean;
    open(clientX: number, clientY: number): void;
    close(restoreFocus?: boolean): void;
}

export interface DialogButton {
    text: string;
    primary?: boolean;
    /** 返回 false 可阻止对话框自动关闭 */
    onClick?(overlay: HTMLElement): boolean | void;
}

export interface DialogOptions {
    title?: string;
    content?: string | HTMLElement;
    buttons?: DialogButton[];
    /** 是否显示背景压暗遮罩，默认 true */
    scrim?: boolean;
    /** 需要压暗的元素，默认 document.body */
    scrimTarget?: string | HTMLElement;
    /** 是否允许拖动，默认 true */
    draggable?: boolean;
    /** 点击遮罩行为：close（默认）/ none / pass */
    backdropClick?: 'close' | 'none' | 'pass';
    onClose?(): void;
}

export interface DialogInstance {
    el: HTMLElement;
    close(restoreFocus?: boolean): void;
    destroy(): void;
}

export interface FormControlsOptions {
    onChange?(detail: {
        target: HTMLElement;
        value: string;
        checked: boolean;
        originalEvent: Event;
    }): void;
}

export interface FormControlsInstance extends LingmoUIInstance {
}

export declare const version: string;
export declare const EVENT_PREFIX: string;

export declare function createSwitch(el: HTMLElement, options?: SwitchOptions): SwitchInstance;
export declare function createTabBar(el: HTMLElement, options?: TabBarOptions): TabBarInstance;
export declare function createIconCheck(el: HTMLElement, options?: IconCheckOptions): IconCheckInstance;
export declare function createCombobox(el: HTMLElement, options?: ComboboxOptions): ComboboxInstance;
export declare function createSlider(el: HTMLElement, options?: SliderOptions): SliderInstance;
export declare function createMenu(el: HTMLElement, options?: MenuOptions): MenuInstance;
export declare function createDialog(options?: DialogOptions): DialogInstance;
export declare function createFormControls(container: HTMLElement, options?: FormControlsOptions): FormControlsInstance;

export declare function closeDialog(dialogEl?: HTMLElement): void;
export declare function showScrim(target?: string | HTMLElement): HTMLElement;
export declare function hideScrim(scrim: HTMLElement): void;
export declare function closeScrim(): void;

export declare function setTheme(theme: 'light' | 'dark'): 'light' | 'dark';
export declare function getTheme(): 'light' | 'dark';

/**
 * 兼容门面：同时提供可实例化 API 与旧版 initXxx 命令式 API
 */
export interface LingmoUINamespace {
    version: string;

    createSwitch: typeof createSwitch;
    createTabBar: typeof createTabBar;
    createIconCheck: typeof createIconCheck;
    createCombobox: typeof createCombobox;
    createSlider: typeof createSlider;
    createMenu: typeof createMenu;
    createDialog: typeof createDialog;
    createFormControls: typeof createFormControls;

    initCombobox(container: HTMLElement): void;
    initSwitch(container: HTMLElement, onChange?: (el: HTMLElement, value: boolean) => void): void;
    initTabBar(container: HTMLElement, onChange?: (el: HTMLElement, tab: HTMLElement, value: string) => void): void;
    initIconCheck(container: HTMLElement, onChange?: (el: HTMLElement, item: HTMLElement, value: string) => void): void;
    initSlider(el: HTMLElement, onChange?: (value: number) => void): SliderInstance;
    initMenu(container: HTMLElement): void;
    initFormControls(container: HTMLElement, onChange?: (event: Event) => void): FormControlsInstance;
    initAll(container: HTMLElement): void;

    showMenu(menuEl: HTMLElement, clientX: number, clientY: number): void;
    closeMenu(): void;

    showDialog(options?: DialogOptions): HTMLElement;
    closeDialog: typeof closeDialog;
    showScrim: typeof showScrim;
    hideScrim: typeof hideScrim;
    closeScrim: typeof closeScrim;

    setTheme: typeof setTheme;
    getTheme: typeof getTheme;
}

declare const LingmoUI: LingmoUINamespace;

export default LingmoUI;

declare global {
    interface Window {
        LingmoUI: LingmoUINamespace;
    }
}
