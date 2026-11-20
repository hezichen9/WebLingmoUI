/* 组件共用的 DOM 辅助函数 */

/**
 * 设置禁用态：同步类名与 aria-disabled
 * @param {HTMLElement} el
 * @param {boolean} disabled
 * @param {string} [className='is-disabled']
 */
export function setDisabled(el, disabled, className = 'is-disabled') {
    el.classList.toggle(className, disabled);
    if (disabled) {
        el.setAttribute('aria-disabled', 'true');
    } else {
        el.removeAttribute('aria-disabled');
    }
}

/**
 * 收集元素内可聚焦节点（用于对话框焦点陷阱）
 * @param {HTMLElement} root
 * @returns {HTMLElement[]}
 */
export function getFocusables(root) {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return Array.from(root.querySelectorAll(selector))
        .filter(el => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');
}
