import { createOnce, deleteInstance } from '../core/instance.js';
import { emit } from '../core/events.js';

/**
 * 创建 TabBar 标签栏实例
 * @param {HTMLElement} el - .lingmoUI-tabbar 元素
 * @param {{value?: string, onChange?: (detail: {value: string, tab: HTMLElement}) => void}} [options]
 * @returns {Object} 实例：{ el, value, setValue, destroy }
 */
export function createTabBar(el, options = {}) {
    return createOnce(el, () => {
        const controller = new AbortController();
        const { signal } = controller;

        const getTabs = () => Array.from(el.querySelectorAll('.lingmoUI-tab'));

        let value = options.value !== undefined ? String(options.value) : null;
        if (value === null) {
            const active = getTabs().find(tab => tab.classList.contains('active'));
            value = active ? active.dataset.value : (getTabs()[0] && getTabs()[0].dataset.value);
        }

        el.setAttribute('role', 'tablist');

        const apply = (next, silent) => {
            const tabs = getTabs();
            const target = tabs.find(tab => tab.dataset.value === String(next));
            if (!target) return null;

            value = String(next);
            tabs.forEach(tab => {
                const selected = tab === target;
                tab.classList.toggle('active', selected);
                tab.setAttribute('role', 'tab');
                tab.setAttribute('aria-selected', String(selected));
                tab.setAttribute('tabindex', selected ? '0' : '-1');
            });

            if (!silent) {
                const detail = { value, tab: target };
                emit(el, 'change', detail);
                if (options.onChange) options.onChange(detail);
            }
            return target;
        };

        el.addEventListener('click', (e) => {
            const tab = e.target.closest('.lingmoUI-tab');
            if (!tab || !el.contains(tab) || tab.classList.contains('is-disabled')) return;
            apply(tab.dataset.value);
        }, { signal });

        el.addEventListener('keydown', (e) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;

            const tabs = getTabs();
            const focused = document.activeElement && document.activeElement.closest
                ? document.activeElement.closest('.lingmoUI-tab')
                : null;
            let index = tabs.indexOf(focused);
            if (index < 0) index = tabs.findIndex(tab => tab.classList.contains('active'));
            if (index < 0) return;

            e.preventDefault();
            if (e.key === 'Home') {
                index = 0;
            } else if (e.key === 'End') {
                index = tabs.length - 1;
            } else {
                const step = e.key === 'ArrowRight' ? 1 : -1;
                index = (index + step + tabs.length) % tabs.length;
            }

            const next = tabs[index];
            if (!next) return;
            apply(next.dataset.value);
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
                getTabs().forEach(tab => {
                    tab.removeAttribute('role');
                    tab.removeAttribute('aria-selected');
                    tab.removeAttribute('tabindex');
                });
                deleteInstance(el);
            }
        };
    });
}
