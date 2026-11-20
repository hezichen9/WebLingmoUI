import { createOnce, deleteInstance } from '../core/instance.js';
import { emit } from '../core/events.js';
import { setDisabled } from '../core/dom.js';

/**
 * 创建 Switch 开关实例
 * @param {HTMLElement} el - .lingmoUI-switch 元素
 * @param {{value?: boolean, disabled?: boolean, onChange?: (detail: {value: boolean}) => void}} [options]
 * @returns {Object} 实例：{ el, value, disabled, setValue, setDisabled, destroy }
 */
export function createSwitch(el, options = {}) {
    return createOnce(el, () => {
        const controller = new AbortController();
        const { signal } = controller;

        let value = options.value !== undefined ? !!options.value : el.classList.contains('active');
        let disabled = options.disabled === true;

        el.setAttribute('role', 'switch');
        el.setAttribute('tabindex', '0');

        const render = () => {
            el.classList.toggle('active', value);
            el.setAttribute('aria-checked', String(value));
            setDisabled(el, disabled);
        };

        const setValue = (next, silent) => {
            next = !!next;
            if (next === value) return;
            value = next;
            render();
            if (silent) return;

            const detail = { value };
            emit(el, 'change', detail);
            if (options.onChange) options.onChange(detail);
        };

        el.addEventListener('click', () => {
            if (!disabled) setValue(!value);
        }, { signal });

        el.addEventListener('keydown', (e) => {
            if (disabled || (e.key !== ' ' && e.key !== 'Enter')) return;
            e.preventDefault();
            setValue(!value);
        }, { signal });

        render();

        return {
            el,
            get value() {
                return value;
            },
            get disabled() {
                return disabled;
            },
            setValue: (next) => setValue(next),
            setDisabled(next) {
                disabled = !!next;
                render();
            },
            destroy() {
                controller.abort();
                el.removeAttribute('role');
                el.removeAttribute('tabindex');
                el.removeAttribute('aria-checked');
                el.removeAttribute('aria-disabled');
                deleteInstance(el);
            }
        };
    });
}
