/* UMD 构建入口：注入样式，并把 API 挂到 window.LingmoUI */
import './styles/LingmoUI.css';
import LingmoUI from './index.js';

// 浏览器脚本方式引入时挂到全局；在 Node / SSR 环境 require 时不报错
if (typeof window !== 'undefined') {
    window.LingmoUI = LingmoUI;
}

export * from './index.js';
export default LingmoUI;
