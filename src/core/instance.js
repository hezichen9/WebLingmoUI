/* 组件实例注册表：同一元素只允许存在一个实例，并提供销毁注册 */

const registry = new WeakMap();

/**
 * 读取元素上已创建的组件实例
 * @param {HTMLElement} el
 * @returns {Object|null}
 */
export function getInstance(el) {
    return registry.get(el) || null;
}

/**
 * 从注册表移除实例（组件 destroy 时调用）
 * @param {HTMLElement} el
 */
export function deleteInstance(el) {
    registry.delete(el);
}

/**
 * 幂等地创建组件实例：重复调用返回首次创建的实例
 * @param {HTMLElement} el - 组件根元素
 * @param {Function} factory - 返回实例的工厂函数
 * @returns {Object} 组件实例
 */
export function createOnce(el, factory) {
    if (!el || el.nodeType !== 1) {
        throw new TypeError('[LingmoUI] 需要传入有效的 DOM 元素');
    }
    const existing = registry.get(el);
    if (existing) return existing;

    const instance = factory();
    registry.set(el, instance);
    return instance;
}
