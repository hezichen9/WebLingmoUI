import { createOnce, deleteInstance } from '../core/instance.js';
import { emit } from '../core/events.js';
import { setDisabled } from '../core/dom.js';

/**
 * 创建 Slider 滑块实例
 * @param {HTMLElement} el - .lingmoUI-slider 元素
 * @param {{value?: number, min?: number, max?: number, step?: number, disabled?: boolean, onChange?: (detail: {value: number}) => void}} [options]
 * @returns {Object} 实例：{ el, value, setValue, setDisabled, destroy }
 */
export function createSlider(el, options = {}) {
    return createOnce(el, () => {
        const track = el.querySelector('.lingmoUI-slider-track');
        const fill = el.querySelector('.lingmoUI-slider-fill');
        const handle = el.querySelector('.lingmoUI-slider-handle');
        const tooltip = el.querySelector('.lingmoUI-slider-tooltip');
        if (!track || !fill || !handle) {
            throw new TypeError('[LingmoUI] .lingmoUI-slider 结构不完整');
        }

        const controller = new AbortController();
        const { signal } = controller;

        const min = options.min !== undefined ? Number(options.min) : 0;
        const max = options.max !== undefined ? Number(options.max) : 100;
        const step = options.step !== undefined ? Number(options.step) : 1;

        let disabled = options.disabled === true;
        let dragging = false;

        const clamp = (value) => Math.min(max, Math.max(min, value));
        const snap = (value) => {
            if (!step) return clamp(value);
            const snapped = Math.round((value - min) / step) * step + min;
            return clamp(Number(snapped.toFixed(6)));
        };

        // 初始值：优先 options.value，其次从填充宽度反推
        let value = options.value !== undefined
            ? snap(Number(options.value))
            : snap(parseFloat(fill.style.width) || 0);

        const percent = () => ((value - min) / (max - min)) * 100;

        const render = () => {
            const p = percent();
            fill.style.width = p + '%';
            handle.style.left = p + '%';
            if (tooltip) tooltip.textContent = String(value);
            el.setAttribute('aria-valuemin', String(min));
            el.setAttribute('aria-valuemax', String(max));
            el.setAttribute('aria-valuenow', String(value));
            el.setAttribute('aria-valuetext', String(value));
            setDisabled(el, disabled);
        };

        const setValue = (next, silent) => {
            const clamped = snap(Number(next));
            if (clamped === value) return;
            value = clamped;
            render();
            if (silent) return;

            const detail = { value };
            emit(el, 'change', detail);
            if (options.onChange) options.onChange(detail);
        };

        const valueFromClientX = (clientX) => {
            const rect = track.getBoundingClientRect();
            if (!rect.width) return value;
            const ratio = (clientX - rect.left) / rect.width;
            return snap(min + ratio * (max - min));
        };

        const onPointerDown = (e) => {
            if (disabled || e.button !== 0) return;
            dragging = true;
            el.classList.add('dragging');
            if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
            setValue(valueFromClientX(e.clientX));
            e.preventDefault();
        };

        const onPointerMove = (e) => {
            if (!dragging) return;
            setValue(valueFromClientX(e.clientX));
        };

        const onPointerUp = (e) => {
            if (!dragging) return;
            dragging = false;
            el.classList.remove('dragging');
            if (el.releasePointerCapture && el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) {
                el.releasePointerCapture(e.pointerId);
            }
        };

        el.addEventListener('pointerdown', onPointerDown, { signal });
        el.addEventListener('pointermove', onPointerMove, { signal });
        el.addEventListener('pointerup', onPointerUp, { signal });
        el.addEventListener('pointercancel', onPointerUp, { signal });

        el.addEventListener('keydown', (e) => {
            if (disabled) return;
            const big = step * 10;
            let next = null;
            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowUp':
                    next = value + step;
                    break;
                case 'ArrowLeft':
                case 'ArrowDown':
                    next = value - step;
                    break;
                case 'PageUp':
                    next = value + big;
                    break;
                case 'PageDown':
                    next = value - big;
                    break;
                case 'Home':
                    next = min;
                    break;
                case 'End':
                    next = max;
                    break;
                default:
                    return;
            }
            e.preventDefault();
            setValue(next);
        }, { signal });

        el.setAttribute('role', 'slider');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
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
                el.classList.remove('dragging');
                el.removeAttribute('role');
                el.removeAttribute('tabindex');
                el.removeAttribute('aria-valuemin');
                el.removeAttribute('aria-valuemax');
                el.removeAttribute('aria-valuenow');
                el.removeAttribute('aria-valuetext');
                el.removeAttribute('aria-disabled');
                deleteInstance(el);
            }
        };
    });
}
