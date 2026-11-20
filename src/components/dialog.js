import { emit } from '../core/events.js';
import { getFocusables } from '../core/dom.js';

let uid = 0;

/**
 * 显示背景压暗遮罩（与对话框分离，可单独使用）
 * @param {string|HTMLElement} [target=document.body] - 需要压暗的元素（选择器或元素节点）
 * @returns {HTMLElement} 遮罩元素
 */
export function showScrim(target) {
    let targetEl = document.body;
    if (typeof target === 'string') {
        targetEl = document.querySelector(target) || document.body;
    } else if (target instanceof HTMLElement) {
        targetEl = target;
    }

    const scrim = document.createElement('div');
    scrim.className = 'lingmoUI-dialog-scrim';
    document.body.appendChild(scrim);

    const updateRect = function () {
        if (targetEl === document.body || targetEl === document.documentElement) {
            scrim.classList.add('is-body');
            scrim.style.left = scrim.style.top = scrim.style.width = scrim.style.height = '';
            return;
        }
        const rect = targetEl.getBoundingClientRect();
        scrim.classList.remove('is-body');
        scrim.style.left = rect.left + 'px';
        scrim.style.top = rect.top + 'px';
        scrim.style.width = rect.width + 'px';
        scrim.style.height = rect.height + 'px';
    };
    updateRect();

    // 元素位置/尺寸变化时同步遮罩范围
    scrim.__updateRect = updateRect;
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    if (typeof ResizeObserver !== 'undefined' && targetEl !== document.body) {
        scrim.__resizeObserver = new ResizeObserver(updateRect);
        scrim.__resizeObserver.observe(targetEl);
    }

    // 强制回流，确保淡入动画可靠触发
    void scrim.offsetWidth;
    scrim.classList.add('show');
    return scrim;
}

/**
 * 关闭所有背景压暗遮罩（带淡出动画）
 */
export function closeScrim() {
    document.querySelectorAll('.lingmoUI-dialog-scrim').forEach(scrim => {
        hideScrim(scrim);
    });
}

/**
 * 关闭单个背景压暗遮罩（带淡出动画）
 * @param {HTMLElement} scrim - 遮罩元素
 */
export function hideScrim(scrim) {
    if (!scrim || scrim.dataset.closing === 'true') return;
    scrim.dataset.closing = 'true';

    if (scrim.__updateRect) {
        window.removeEventListener('resize', scrim.__updateRect);
        window.removeEventListener('scroll', scrim.__updateRect, true);
    }
    if (scrim.__resizeObserver) {
        scrim.__resizeObserver.disconnect();
    }

    scrim.classList.remove('show');
    scrim.classList.add('closing');
    const remove = () => scrim.remove();
    scrim.addEventListener('transitionend', remove, { once: true });
    // 兜底：动画若未触发 transitionend 也能移除
    setTimeout(remove, 260);
}

/**
 * 让对话框窗口可拖动（通过 --ui-dialog-offset-x/y 偏移，不破坏缩放动画）
 * @param {HTMLElement} winEl - 对话框窗口元素
 * @param {AbortSignal} signal - 用于销毁时解绑
 */
function makeDialogDraggable(winEl, signal) {
    winEl.classList.add('is-draggable');

    function beginDrag(startX, startY) {
        const offsetX = parseFloat(winEl.style.getPropertyValue('--ui-dialog-offset-x')) || 0;
        const offsetY = parseFloat(winEl.style.getPropertyValue('--ui-dialog-offset-y')) || 0;
        let moved = false;

        function moveTo(clientX, clientY) {
            moved = true;
            winEl.style.setProperty('--ui-dialog-offset-x', (offsetX + clientX - startX) + 'px');
            winEl.style.setProperty('--ui-dialog-offset-y', (offsetY + clientY - startY) + 'px');
        }

        function onMouseMove(e) {
            moveTo(e.clientX, e.clientY);
        }

        function onTouchMove(e) {
            if (e.touches.length !== 1) return;
            moveTo(e.touches[0].clientX, e.touches[0].clientY);
            // 阻止拖动过程中页面滚动
            if (e.cancelable) e.preventDefault();
        }

        function onEnd() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onEnd);
            document.removeEventListener('touchcancel', onEnd);
            winEl.classList.remove('is-dragging');
            if (!moved) return;
            // 拖动结束后吞掉紧随其后的 click，避免误触遮罩关闭
            const stopClick = function (ev) {
                ev.stopPropagation();
            };
            document.addEventListener('click', stopClick, true);
            setTimeout(() => document.removeEventListener('click', stopClick, true), 0);
        }

        winEl.classList.add('is-dragging');
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('touchcancel', onEnd);
    }

    // 鼠标拖动
    winEl.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        // 交互控件上按下时不触发拖动
        if (e.target.closest('button, input, select, textarea, a')) return;
        beginDrag(e.clientX, e.clientY);
        e.preventDefault();
    }, { signal });

    // 触摸拖动（移动端）
    winEl.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        if (e.target.closest('button, input, select, textarea, a')) return;
        beginDrag(e.touches[0].clientX, e.touches[0].clientY);
        // 阻止页面滚动、长按及后续模拟鼠标事件
        if (e.cancelable) e.preventDefault();
    }, { passive: false, signal });
}

/**
 * 获取当前最上层且未在关闭中的对话框
 * @returns {HTMLElement|null}
 */
function getTopDialog() {
    const opened = Array.from(document.querySelectorAll('.lingmoUI-dialog'))
        .filter(el => el.dataset.closing !== 'true');
    return opened[opened.length - 1] || null;
}

/**
 * 创建对话框实例（支持多个对话框同时存在，后打开的位于上层）
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string|HTMLElement} [options.content]
 * @param {Array<{text: string, primary?: boolean, onClick?: Function}>} [options.buttons]
 * @param {boolean} [options.scrim=true] - 是否显示背景压暗遮罩
 * @param {string|HTMLElement} [options.scrimTarget=document.body]
 * @param {boolean} [options.draggable=true]
 * @param {'close'|'none'|'pass'} [options.backdropClick='close']
 * @param {Function} [options.onClose]
 * @returns {Object} 实例：{ el, close, destroy }
 */
export function createDialog(options = {}) {
    let baseZ = 2000;
    document.querySelectorAll('.lingmoUI-dialog').forEach(el => {
        baseZ = Math.max(baseZ, parseInt(el.style.zIndex, 10) || 2000);
    });

    const controller = new AbortController();
    const { signal } = controller;
    const previousFocus = document.activeElement;
    const titleId = `lingmo-dialog-title-${++uid}`;

    const overlay = document.createElement('div');
    overlay.className = 'lingmoUI-dialog';

    const win = document.createElement('div');
    win.className = 'lingmoUI-dialog-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');

    if (options.title) {
        const title = document.createElement('div');
        title.className = 'lingmoUI-dialog-title';
        title.id = titleId;
        title.textContent = options.title;
        win.setAttribute('aria-labelledby', titleId);
        win.appendChild(title);
    }

    const body = document.createElement('div');
    body.className = 'lingmoUI-dialog-body';
    if (typeof options.content === 'string') {
        body.innerHTML = options.content;
    } else if (options.content) {
        body.appendChild(options.content);
    }
    win.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'lingmoUI-dialog-actions';
    (options.buttons || [{ text: '确定' }]).forEach(btn => {
        const b = document.createElement('button');
        b.className = btn.primary ? 'lingmoUI-button-primary' : 'lingmoUI-button';
        b.textContent = btn.text;
        b.addEventListener('click', function (e) {
            e.stopPropagation();
            if (btn.onClick) {
                const keepOpen = btn.onClick(overlay);
                if (keepOpen === false) return;
            }
            instance.close();
        }, { signal });
        actions.appendChild(b);
    });
    win.appendChild(actions);

    overlay.appendChild(win);

    // 每个对话框拥有独立的背景压暗遮罩，层级依次递增以支持多对话框并存
    const scrim = options.scrim !== false ? showScrim(options.scrimTarget) : null;
    if (scrim) scrim.style.zIndex = baseZ + 1;
    overlay.style.zIndex = baseZ + 2;

    // 点击遮罩行为：close（默认关闭）/ none（无操作）/ pass（穿透到下层页面）
    const backdropClick = options.backdropClick || 'close';
    if (backdropClick === 'pass') {
        overlay.style.pointerEvents = 'none';
        win.style.pointerEvents = 'auto';
        if (scrim) scrim.style.pointerEvents = 'none';
    }

    // 仅最上层对话框响应 ESC
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (getTopDialog() !== overlay) return;
        instance.close();
    }, { signal });

    // 焦点陷阱：Tab / Shift+Tab 在窗口内循环
    overlay.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const list = getFocusables(win);
        if (!list.length) {
            e.preventDefault();
            win.focus();
            return;
        }
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === win)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }, { signal });

    document.body.appendChild(overlay);
    // 强制回流，确保 opacity/scale 从初始值开始过渡，可靠触发打开动画
    void overlay.offsetWidth;
    overlay.classList.add('show');

    if (options.draggable !== false) {
        makeDialogDraggable(win, signal);
    }

    // 点击遮罩关闭（仅关闭当前对话框）；none / pass 时不绑定关闭行为
    if (backdropClick === 'close') {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) instance.close();
        }, { signal });
    }

    // 打开后聚焦首个按钮，便于键盘操作与 ESC 接收
    const focusTarget = getFocusables(win)[0];
    if (focusTarget) focusTarget.focus();
    else {
        win.setAttribute('tabindex', '-1');
        win.focus();
    }

    emit(overlay, 'open', {});
    let closing = false;

    const instance = {
        el: overlay,
        close(restoreFocus = true) {
            if (closing) return;
            closing = true;
            overlay.dataset.closing = 'true';

            controller.abort();
            hideScrim(scrim);

            overlay.classList.remove('show');
            overlay.classList.add('closing');
            emit(overlay, 'close', {});

            let removed = false;
            const remove = () => {
                if (removed) return;
                removed = true;
                if (restoreFocus && previousFocus && document.contains(previousFocus) &&
                    typeof previousFocus.focus === 'function') {
                    previousFocus.focus();
                }
                overlay.remove();
                if (options.onClose) options.onClose();
            };

            overlay.addEventListener('transitionend', (e) => {
                if (e.target === overlay) remove();
            }, { once: true });
            // 兜底：动画若未触发 transitionend 也能移除
            setTimeout(remove, 260);
        },
        destroy() {
            this.close(false);
        }
    };

    overlay.__lingmoDialog = instance;
    return instance;
}

/**
 * 关闭对话框：传元素则关闭指定对话框，缺省关闭最上层
 * @param {HTMLElement} [dialogEl]
 */
export function closeDialog(dialogEl) {
    if (!dialogEl) {
        const top = getTopDialog();
        if (!top) {
            // 没有任何对话框时，清理独立使用的遮罩
            closeScrim();
            return;
        }
        dialogEl = top;
    }

    const instance = dialogEl.__lingmoDialog;
    if (instance) instance.close();
    else dialogEl.remove();
}
