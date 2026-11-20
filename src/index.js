import { version } from './version.js';
import { createSwitch } from './components/switch.js';
import { createTabBar } from './components/tabbar.js';
import { createIconCheck } from './components/icon-check.js';
import { createCombobox } from './components/combobox.js';
import { createSlider } from './components/slider.js';
import { createMenu } from './components/menu.js';
import { createDialog, closeDialog, showScrim, hideScrim, closeScrim } from './components/dialog.js';
import { createFormControls } from './components/form-controls.js';
import { getTheme, setTheme } from './components/theme.js';
import { getInstance } from './core/instance.js';
import { EVENT_PREFIX } from './core/events.js';

/**
 * 在容器内批量初始化指定选择器匹配的组件
 * @param {HTMLElement} container
 * @param {string} selector
 * @param {Function} factory
 */
function initEach(container, selector, factory) {
    container.querySelectorAll(selector).forEach(el => factory(el));
}

/**
 * LingmoUI 兼容门面：提供旧版 initXxx 命令式 API，内部复用可实例化组件
 */
const LingmoUI = {
    version,

    // ---- 可实例化 API ----
    createSwitch,
    createTabBar,
    createIconCheck,
    createCombobox,
    createSlider,
    createMenu,
    createDialog,
    createFormControls,

    // ---- 批量初始化（旧版 API，保持兼容） ----
    initCombobox(container) {
        initEach(container, '.lingmoUI-combobox', el => createCombobox(el));
    },

    initSwitch(container, onChange) {
        initEach(container, '.lingmoUI-switch', el => createSwitch(el, {
            onChange: (detail) => {
                if (onChange) onChange(el, detail.value);
            }
        }));
    },

    initTabBar(container, onChange) {
        initEach(container, '.lingmoUI-tabbar', el => createTabBar(el, {
            onChange: (detail) => {
                if (onChange) onChange(el, detail.tab, detail.value);
            }
        }));
    },

    initIconCheck(container, onChange) {
        initEach(container, '.lingmoUI-icon-check-row', el => createIconCheck(el, {
            onChange: (detail) => {
                if (onChange) onChange(el, detail.item, detail.value);
            }
        }));
    },

    initSlider(sliderEl, onChange) {
        return createSlider(sliderEl, {
            onChange: (detail) => {
                if (onChange) onChange(detail.value);
            }
        });
    },

    initMenu(container) {
        initEach(container, '.lingmoUI-menu', el => createMenu(el));
    },

    initFormControls(container, onChange) {
        return createFormControls(container, {
            onChange: (detail) => {
                if (onChange) onChange(detail.originalEvent);
            }
        });
    },

    initAll(container) {
        initEach(container, '.lingmoUI-combobox', el => createCombobox(el));
        initEach(container, '.lingmoUI-switch', el => createSwitch(el));
        initEach(container, '.lingmoUI-tabbar', el => createTabBar(el));
        initEach(container, '.lingmoUI-icon-check-row', el => createIconCheck(el));
        initEach(container, '.lingmoUI-menu', el => createMenu(el));
        initEach(container, '.lingmoUI-slider', el => createSlider(el));
        createFormControls(container);
    },

    // ---- 菜单（旧版 API） ----
    showMenu(menuEl, clientX, clientY) {
        const instance = getInstance(menuEl) || createMenu(menuEl);
        instance.open(clientX, clientY);
    },

    closeMenu() {
        document.querySelectorAll('.lingmoUI-menu.show').forEach(menuEl => {
            const instance = getInstance(menuEl);
            if (instance) instance.close(false);
            else menuEl.classList.remove('show');
        });
    },

    // ---- 对话框（旧版 API） ----
    showDialog(options) {
        return createDialog(options).el;
    },

    closeDialog,

    // ---- 遮罩 ----
    showScrim,
    hideScrim,
    closeScrim,

    // ---- 主题 ----
    setTheme,
    getTheme
};

export { version, EVENT_PREFIX };
export {
    createSwitch,
    createTabBar,
    createIconCheck,
    createCombobox,
    createSlider,
    createMenu,
    createDialog,
    closeDialog,
    showScrim,
    hideScrim,
    closeScrim,
    createFormControls,
    setTheme,
    getTheme
};

export default LingmoUI;
