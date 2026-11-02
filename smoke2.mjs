import { JSDOM } from '/workspace/node_modules/jsdom/lib/api.js';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement; global.Element = dom.window.Element; global.Node = dom.window.Node;
global.getComputedStyle = dom.window.getComputedStyle; global.requestAnimationFrame = (cb)=>setTimeout(cb,0);
global.localStorage = dom.window.localStorage; global.CustomEvent = dom.window.CustomEvent; global.Event = dom.window.Event;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const App = (await import('/workspace/src/App.tsx')).default;
const root = createRoot(document.getElementById('root'));
await act(async () => { root.render(React.createElement(App)); });
// клик по кнопке «Начать новую игру»
const btns = [...document.querySelectorAll('button')];
const start = btns.find(b => (b.textContent||'').includes('Начать новую игру'));
if (!start) { console.log('FAIL: no start button'); process.exit(1); }
await act(async () => { start.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
const text = document.body.textContent || '';
console.log('AFTER START TEXT LENGTH:', text.length);
console.log('SNIPPET:', text.slice(0, 400));
process.exit(0);
