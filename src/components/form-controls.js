import { createOnce, deleteInstance } from '../core/instance.js';
import { emit } from '../core/events.js';

const FORM_CONTROL_SELECTOR = '.lingmoUI-checkbox input, .lingmoUI-radio input, .lingmoUI-textfield-input';

/**
 * 创建表单控件容器实例：把原生 change 统一转成 lingmoui:change
 * Checkbox / Radio 的视觉切换由原生 input 完成，此处只负责事件归一
 * @param {HTMLElement} container - 容器元素
 * @param {{onChange?: (detail: {target: HTMLElement, value: string, checked: boolean, originalEvent: Event}) => void}} [options]
 * @returns {Object} 实例：{ el, destroy }
 */
export function createFormControls(container, options = {}) {
    return createOnce(container, () => {
        const controller = new AbortController();

        container.addEventListener('change', (e) => {
            const target = e.target;
            if (!target.matches || !target.matches(FORM_CONTROL_SELECTOR)) return;

            const detail = {
                target,
                value: target.value,
                checked: !!target.checked,
                originalEvent: e
            };
            emit(target, 'change', detail);
            if (options.onChange) options.onChange(detail);
        }, { signal: controller.signal });

        return {
            el: container,
            destroy() {
                controller.abort();
                deleteInstance(container);
            }
        };
    });
}
