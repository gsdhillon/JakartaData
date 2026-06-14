/**
 * @file GroveAdapter.js
 * Single switch point for the virtual DOM and hooks provider used by Grove UI.
 */

import * as GroveProvider from "./Grove.js";
import * as PreactProvider from "./preact.module.js";
import * as PreactHooks from "./hooks.module.js";

// Change this single value to use the bundled provider.
 export const groveDomProvider = "grove";
// export const groveDomProvider = "preact";

const createPreactRoot = rootElement => ({
    render(vnode) {
        PreactProvider.render(vnode, rootElement);
    }
});

const preactCreateElementIf = (condition, tagName, props = {}, ...children) =>
    condition ? PreactProvider.createElement(tagName, props, ...children.flat()) : null;

const adapters = {
    grove: {
        createContext: GroveProvider.createContext,
        createElement: GroveProvider.createElement,
        createElementIf: GroveProvider.createElementIf,
        createRoot: GroveProvider.createRoot,
        Fragment: GroveProvider.Fragment,
        useCallback: GroveProvider.useCallback,
        useContext: GroveProvider.useContext,
        useEffect: GroveProvider.useEffect,
        useLayoutEffect: GroveProvider.useLayoutEffect,
        useMemo: GroveProvider.useMemo,
        useReducer: GroveProvider.useReducer,
        useRef: GroveProvider.useRef,
        useState: GroveProvider.useState
    },
    preact: {
        createContext: PreactProvider.createContext,
        createElement: PreactProvider.createElement,
        createElementIf: preactCreateElementIf,
        createRoot: createPreactRoot,
        Fragment: PreactProvider.Fragment,
        useCallback: PreactHooks.useCallback,
        useContext: PreactHooks.useContext,
        useEffect: PreactHooks.useEffect,
        useLayoutEffect: PreactHooks.useLayoutEffect,
        useMemo: PreactHooks.useMemo,
        useReducer: PreactHooks.useReducer,
        useRef: PreactHooks.useRef,
        useState: PreactHooks.useState
    }
};

const adapter = adapters[groveDomProvider] || adapters.grove;

export const createContext = adapter.createContext;
export const createElement = adapter.createElement;
export const createElementIf = adapter.createElementIf;
export const createRoot = adapter.createRoot;
export const Fragment = adapter.Fragment;
export const useCallback = adapter.useCallback;
export const useContext = adapter.useContext;
export const useEffect = adapter.useEffect;
export const useLayoutEffect = adapter.useLayoutEffect;
export const useMemo = adapter.useMemo;
export const useReducer = adapter.useReducer;
export const useRef = adapter.useRef;
export const useState = adapter.useState;
