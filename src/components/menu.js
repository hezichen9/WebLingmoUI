import { createOnce, getInstance, deleteInstance } from '../core/instance.js';
import { emit } from '../core/events.js';

/**
 * 创建 Menu 菜单实例（右键菜单 / 下拉菜单）
 * @param {HTMLElement} el - .lingmoUI-menu 元素
 * @param {{onOpen?: Function, onClose?: Function}} [options]
 * @returns {Object} 实例：{ el, isOpen, open, close, destroy }
 */
export function createMenu(el, options = {}) {
    return createOnce(el, () => {
        const controller = new AbortController();
        const { signal } = controller;

        let isOpen = false;
        let returnFocus = null;

        el.setAttribute('role', 'menu');
        el.setAttribute('aria-hidden', 'true');

        const getItems = () => Array.from(el.querySelectorAll('.lingmoUI-menu-item'))
            .filter(item => !item.classList.contains('is-disabled'));

        const initItems = () => {
            el.querySelectorAll('.lingmoUI-menu-item').forEach(item => {
                item.setAttribute('role', 'menuitem');
                if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '-1');
            });
            el.querySelectorAll('.lingmoUI-menu-separator').forEach(separator => {
                separator.setAttribute('role', 'separator');
            });
        };
        initItems();

        const closeOthers = () => {
            document.querySelectorAll('.lingmoUI-menu.show').forEach(menu => {
                if (menu === el) return;
                const instance = getInstance(menu);
                if (instance) instance.close(false);
                else menu.classList.remove('show');
            });
        };

        const open = (clientX, clientY) => {
            closeOthers();
            returnFocus = document.activeElement;
            isOpen = true;

            // 先归零再显示，便于测量真实尺寸
            el.style.left = '0px';
            el.style.top = '0px';
            el.classList.add('show');
            el.setAttribute('aria-hidden', 'false');

            const rect = el.getBoundingClientRect();
            let x = clientX;
            let y = clientY;
            if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 4;
            if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 4;
            el.style.left = Math.max(4, x) + 'px';
            el.style.top = Math.max(4, y) + 'px';

            const items = getItems();
            if (items[0]) items[0].focus();

            emit(el, 'open', {});
            if (options.onOpen) options.onOpen();
        };

        const close = (restoreFocus = true) => {
            if (!isOpen) return;
            isOpen = false;
            el.classList.remove('show');
            el.setAttribute('aria-hidden', 'true');

            if (restoreFocus && returnFocus && document.contains(returnFocus) &&
                typeof returnFocus.focus === 'function') {
                returnFocus.focus();
            }
            returnFocus = null;

            emit(el, 'close', {});
            if (options.onClose) options.onClose();
        };

        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { signal });

        el.addEventListener('click', (e) => {
            const item = e.target.closest('.lingmoUI-menu-item');
            if (!item) return;
            e.stopPropagation();
            if (item.classList.contains('has-submenu') || item.classList.contains('is-disabled')) return;
            close(false);
        }, { signal });

        el.addEventListener('keydown', (e) => {
            const items = getItems();
            if (!items.length) return;

            const current = items.indexOf(document.activeElement);
            const move = (delta) => {
                const next = (current + delta + items.length) % items.length;
                items[next].focus();
            };

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    move(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    move(-1);
                    break;
                case 'Home':
                    e.preventDefault();
                    items[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    items[items.length - 1].focus();
                    break;
                case 'Escape':
                    e.preventDefault();
                    close();
                    break;
                case 'Tab':
                    close(false);
                    break;
                default:
                    break;
            }
        }, { signal });

        document.addEventListener('click', () => close(false), { signal });

        return {
            el,
            get isOpen() {
                return isOpen;
            },
            open,
            close,
            destroy() {
                controller.abort();
                el.classList.remove('show');
                el.removeAttribute('role');
                el.removeAttribute('aria-hidden');
                deleteInstance(el);
            }
        };
    });
}
