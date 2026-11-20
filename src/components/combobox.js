import { createOnce, deleteInstance } from '../core/instance.js';
import { emit } from '../core/events.js';

let uid = 0;

/**
 * 创建 Combobox 下拉框实例（基于原生 select，保留表单取值语义）
 * @param {HTMLElement} el - .lingmoUI-combobox 元素
 * @param {{value?: string, disabled?: boolean, onChange?: (detail: {value: string, index: number, option: HTMLOptionElement}) => void}} [options]
 * @returns {Object} 实例：{ el, value, setValue, setDisabled, open, close, destroy }
 */
export function createCombobox(el, options = {}) {
    return createOnce(el, () => {
        const select = el.querySelector('select');
        if (!select) {
            throw new TypeError('[LingmoUI] .lingmoUI-combobox 内缺少 <select>');
        }

        const controller = new AbortController();
        const { signal } = controller;

        const selectedOption = () => select.options[select.selectedIndex] || null;
        const selectedText = () => (selectedOption() ? selectedOption().textContent : '');

        const trigger = document.createElement('div');
        trigger.className = 'lingmoUI-combobox-trigger';
        trigger.setAttribute('role', 'combobox');
        trigger.setAttribute('tabindex', '0');
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const valueEl = document.createElement('span');
        valueEl.className = 'lingmoUI-combobox-value';
        valueEl.textContent = selectedText();

        const arrowEl = document.createElement('span');
        arrowEl.className = 'lingmoUI-combobox-arrow';
        arrowEl.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16">' +
            '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
            'stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>';

        trigger.appendChild(valueEl);
        trigger.appendChild(arrowEl);

        const dropdown = document.createElement('div');
        dropdown.className = 'lingmoUI-combobox-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.id = `lingmo-combobox-listbox-${++uid}`;
        trigger.setAttribute('aria-controls', dropdown.id);

        const optionsList = document.createElement('div');
        optionsList.className = 'lingmoUI-combobox-options';
        dropdown.appendChild(optionsList);

        let optionEls = [];
        let activeIndex = select.selectedIndex;
        let isOpen = false;
        let disabled = options.disabled === true;

        const syncValue = () => {
            valueEl.textContent = selectedText();
            optionEls.forEach((item, index) => {
                const selected = index === select.selectedIndex;
                item.classList.toggle('selected', selected);
                item.setAttribute('aria-selected', String(selected));
            });
        };

        const updateActive = () => {
            optionEls.forEach((item, index) => {
                item.classList.toggle('is-focused', index === activeIndex);
            });
            const active = optionEls[activeIndex];
            if (active && isOpen) active.scrollIntoView({ block: 'nearest' });
        };

        const close = (focusTrigger) => {
            isOpen = false;
            dropdown.classList.remove('show');
            trigger.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            if (focusTrigger) trigger.focus();
        };

        const closeOthers = () => {
            document.querySelectorAll('.lingmoUI-combobox-dropdown.show').forEach(node => {
                if (node !== dropdown) node.classList.remove('show');
            });
            document.querySelectorAll('.lingmoUI-combobox-trigger.open').forEach(node => {
                if (node === trigger) return;
                node.classList.remove('open');
                node.setAttribute('aria-expanded', 'false');
            });
        };

        const open = () => {
            if (disabled) return;
            closeOthers();
            isOpen = true;
            activeIndex = select.selectedIndex >= 0 ? select.selectedIndex : 0;
            dropdown.classList.add('show');
            trigger.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
            updateActive();
        };

        const choose = (index, focusTrigger = true) => {
            if (index < 0 || index >= select.options.length) return;
            const changed = index !== select.selectedIndex;
            select.selectedIndex = index;
            activeIndex = index;
            syncValue();
            close(focusTrigger);
            if (!changed) return;

            select.dispatchEvent(new Event('change', { bubbles: true }));
            const detail = { value: select.value, index, option: select.options[index] };
            emit(el, 'change', detail);
            if (options.onChange) options.onChange(detail);
        };

        // 生成下拉项
        Array.from(select.options).forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'lingmoUI-combobox-option';
            optionEl.dataset.value = option.value;
            optionEl.dataset.index = String(index);
            optionEl.setAttribute('role', 'option');
            optionEl.setAttribute('aria-selected', String(index === select.selectedIndex));
            optionEl.textContent = option.textContent;
            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                choose(index);
            }, { signal });
            optionsList.appendChild(optionEl);
            optionEls.push(optionEl);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (disabled) return;
            if (isOpen) close();
            else open();
        }, { signal });

        trigger.addEventListener('keydown', (e) => {
            if (disabled) return;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (!isOpen) open();
                    else {
                        activeIndex = Math.min(activeIndex + 1, optionEls.length - 1);
                        updateActive();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (!isOpen) open();
                    else {
                        activeIndex = Math.max(activeIndex - 1, 0);
                        updateActive();
                    }
                    break;
                case 'Home':
                    if (!isOpen) return;
                    e.preventDefault();
                    activeIndex = 0;
                    updateActive();
                    break;
                case 'End':
                    if (!isOpen) return;
                    e.preventDefault();
                    activeIndex = optionEls.length - 1;
                    updateActive();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (isOpen) choose(activeIndex);
                    else open();
                    break;
                case 'Escape':
                    if (!isOpen) return;
                    e.preventDefault();
                    close(true);
                    break;
                case 'Tab':
                    if (isOpen) close();
                    break;
                default:
                    break;
            }
        }, { signal });

        // 点击组件外部关闭
        document.addEventListener('click', () => {
            if (isOpen) close(false);
        }, { signal });

        el.appendChild(trigger);
        el.appendChild(dropdown);

        // 原生 select 仅用于表单取值，退出键盘与无障碍树
        select.hidden = true;
        select.setAttribute('aria-hidden', 'true');
        select.setAttribute('tabindex', '-1');

        if (options.value !== undefined) {
            const index = Array.from(select.options).findIndex(option => option.value === String(options.value));
            if (index >= 0) select.selectedIndex = index;
        }
        syncValue();

        return {
            el,
            get value() {
                return select.value;
            },
            get isOpen() {
                return isOpen;
            },
            setValue(value) {
                const index = Array.from(select.options).findIndex(option => option.value === String(value));
                if (index >= 0) choose(index, false);
            },
            setDisabled(next) {
                disabled = !!next;
                el.classList.toggle('is-disabled', disabled);
                trigger.classList.toggle('is-disabled', disabled);
                trigger.setAttribute('aria-disabled', String(disabled));
                if (disabled) close(false);
            },
            open,
            close,
            destroy() {
                controller.abort();
                trigger.remove();
                dropdown.remove();
                select.hidden = false;
                select.removeAttribute('aria-hidden');
                select.removeAttribute('tabindex');
                deleteInstance(el);
            }
        };
    });
}
