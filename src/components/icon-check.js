import { createOnce, deleteInstance } from '../core/instance.js';
import { emit } from '../core/events.js';

/**
 * 读取图标项的值：优先 data-value，其次 data-rotation，最后用下标
 * @param {HTMLElement} item
 * @param {number} index
 * @returns {string}
 */
function itemValue(item, index) {
    if (item.dataset.value !== undefined) return item.dataset.value;
    if (item.dataset.rotation !== undefined) return item.dataset.rotation;
    return String(index);
}

/**
 * 创建 IconCheck 图标单选组实例
 * @param {HTMLElement} el - .lingmoUI-icon-check-row 元素
 * @param {{value?: string, onChange?: (detail: {value: string, item: HTMLElement}) => void}} [options]
 * @returns {Object} 实例：{ el, value, setValue, destroy }
 */
export function createIconCheck(el, options = {}) {
    return createOnce(el, () => {
        const controller = new AbortController();
        const { signal } = controller;

        const getItems = () => Array.from(el.querySelectorAll('.lingmoUI-icon-check'));

        let value = options.value !== undefined ? String(options.value) : null;
        if (value === null) {
            const items = getItems();
            const activeIndex = items.findIndex(item => item.classList.contains('active'));
            const index = activeIndex >= 0 ? activeIndex : 0;
            value = items[index] ? itemValue(items[index], index) : null;
        }

        el.setAttribute('role', 'radiogroup');

        const apply = (next, silent) => {
            const items = getItems();
            const target = items.find((item, index) => itemValue(item, index) === String(next));
            if (!target) return null;

            value = String(next);
            items.forEach((item, index) => {
                const selected = item === target;
                item.classList.toggle('active', selected);
                item.setAttribute('role', 'radio');
                item.setAttribute('aria-checked', String(selected));
                item.setAttribute('tabindex', selected ? '0' : '-1');
                item.setAttribute('aria-label', item.textContent.trim() || itemValue(item, index));
            });

            if (!silent) {
                const detail = { value, item: target };
                emit(el, 'change', detail);
                if (options.onChange) options.onChange(detail);
            }
            return target;
        };

        el.addEventListener('click', (e) => {
            const item = e.target.closest('.lingmoUI-icon-check');
            if (!item || !el.contains(item) || item.classList.contains('is-disabled')) return;
            const index = getItems().indexOf(item);
            apply(itemValue(item, index));
        }, { signal });

        el.addEventListener('keydown', (e) => {
            const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ', 'Enter'];
            if (!keys.includes(e.key)) return;

            const items = getItems();
            const focused = document.activeElement && document.activeElement.closest
                ? document.activeElement.closest('.lingmoUI-icon-check')
                : null;
            let index = items.indexOf(focused);
            if (index < 0) index = items.findIndex(item => item.classList.contains('active'));
            if (index < 0) return;

            e.preventDefault();
            if (e.key === ' ' || e.key === 'Enter') {
                apply(itemValue(items[index], index));
                items[index].focus();
                return;
            }

            if (e.key === 'Home') {
                index = 0;
            } else if (e.key === 'End') {
                index = items.length - 1;
            } else {
                const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
                index = (index + step + items.length) % items.length;
            }

            const next = items[index];
            if (!next) return;
            apply(itemValue(next, index));
            next.focus();
        }, { signal });

        apply(value, true);

        return {
            el,
            get value() {
                return value;
            },
            setValue(next) {
                apply(next);
            },
            destroy() {
                controller.abort();
                el.removeAttribute('role');
                getItems().forEach(item => {
                    item.removeAttribute('role');
                    item.removeAttribute('aria-checked');
                    item.removeAttribute('aria-label');
                    item.removeAttribute('tabindex');
                });
                deleteInstance(el);
            }
        };
    });
}
