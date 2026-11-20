/* 主题切换：浅色 / 深色 */

const DARK_CLASS = 'dark-mode';

/**
 * 设置主题
 * @param {'light'|'dark'} theme
 * @returns {'light'|'dark'} 实际生效的主题
 */
export function setTheme(theme) {
    const dark = theme === 'dark';
    document.body.classList.toggle(DARK_CLASS, dark);
    return dark ? 'dark' : 'light';
}

/**
 * 读取当前主题
 * @returns {'light'|'dark'}
 */
export function getTheme() {
    return document.body.classList.contains(DARK_CLASS) ? 'dark' : 'light';
}
