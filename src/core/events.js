/* 统一事件：所有组件变化都以 lingmoui:* CustomEvent 冒泡派发 */

export const EVENT_PREFIX = 'lingmoui:';

/**
 * 派发统一事件
 * @param {HTMLElement} el - 事件目标
 * @param {string} type - 事件名（不含前缀），如 'change'
 * @param {Object} [detail] - 事件数据
 */
export function emit(el, type, detail) {
    el.dispatchEvent(new CustomEvent(EVENT_PREFIX + type, {
        detail,
        bubbles: true
    }));
}
