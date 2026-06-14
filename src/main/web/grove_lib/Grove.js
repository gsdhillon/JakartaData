/**
 * @file Grove.js
 * @description Core DOM rendering and component management for Grove.
 * Grove is a calm, durable, and structured framework: a stable system that grows organically.
 * It favors clean separation, plain modules, no JSX requirement, and long-term maintainability over vendor churn.
 * Handles virtual DOM creation, patching, state management (hooks), and scheduling.
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

/**
 * The current version of the Grove UI library.
 * @constant {string}
 */
export const version = "1.0.0";

const ensureGroveStyles = () => {
    if (typeof document === "undefined") {
        return;
    }

    const styleHrefs = [
        "./bootstrap.min.css",
        "./bootstrap-icons.min.css",
        "./styles.css"
    ].map(path => new URL(path, import.meta.url).href);

    styleHrefs.forEach(href => {
        if (document.querySelector(`link[href="${href}"]`)) {
            return;
        }

        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.href = href;
        link.dataset.groveStyles = "true";

        document.head.appendChild(link);
    });
};

ensureGroveStyles();

/**
 * Creates a virtual DOM element.
 * @param {string|Function} tagName - The type of the element (e.g., 'div', 'span', or a component function).
 * @param {Object} [props={}] - The properties/attributes of the element.
 * @param {...(string|Object|Array)} children - Child elements or text nodes.
 * @returns {Object} A virtual DOM node object.
 */
export const createElement = (tagName, props = {}, ...children) => {
    const resolvedChildren = children.flat();

    return {
        type: tagName,
        props: {
            ...(props || {}),
            children: resolvedChildren
        },
        key: props?.key || null,
        children: resolvedChildren
    };
};

export const createElementIf = (condition, tagName, props = {}, ...children) => {
    return condition ? createElement(tagName, props, ...children) : null;
};

/**
 * A component that renders its children without adding extra DOM nodes.
 * Similar to React's Fragment.
 * @param {Object} props - The properties, expected to contain `children`.
 * @returns {Array} The children passed to the Fragment.
 */
export const Fragment = props => props.children;

export function createContext(defaultValue) {
    const context = {
        value: defaultValue,
        Provider: null
    };

    context.Provider = props => {
        context.value = props.value;
        return props.children?.[0] ?? null;
    };

    return context;
}

const global = typeof window === "undefined"
    ? globalThis
    : window;

    // --- Global Registries and Queues ---
    /**
     * Registry for storing components by their string type.
     * Allows components to be referenced by a string name rather than a direct function reference.
     * @type {Object.<string, Function>}
     */
    const ComponentRegistry = {};

    /**
     * Reference to the global Grove object, or an empty object if not yet defined.
     * Used for attaching hooks like useState and useEffect.
     * @type {Object}
     */
    const Grove = global.Grove || {
        createElement,
        createElementIf,
        Fragment,
        version
    };

    /**
     * Queue for high-priority tasks to be scheduled.
     * @type {Array<Function>}
     */
    const highPriorityQueue = [];

    /**
     * Queue for normal-priority tasks to be scheduled.
     * @type {Array<Function>}
     */
    const normalPriorityQueue = [];

    /**
     * Flag to indicate if the scheduler is currently running.
     * Prevents multiple scheduler flushes from being queued simultaneously.
     * @type {boolean}
     */
    let schedulerRunning = false;

    // --- Internal State for Hooks ---
    /**
     * The currently active component instance during rendering.
     * Used by hooks (useState, useEffect) to associate state with the correct component.
     * @type {ComponentInstance|null}
     */
    let currentInstance = null;

    /**
     * Index to track the current hook being processed within a component instance.
     * Ensures hooks are called in the same order on every render.
     * @type {number}
     */
    let hookIndex = 0;

    /**
     * The active renderer instance for the application.
     * Allows hooks to trigger updates on the correct renderer.
     * @type {Renderer|null}
     */
    let appRenderer = null;

    let componentTypeId = 0;

    const componentTypeIds = new WeakMap();

    // --- Concurrent Mode / Scheduling (Placeholder) ---
    /**
     * The next unit of work to be processed by the concurrent scheduler.
     * Currently a placeholder for future concurrent rendering features.
     * @type {Function|null}
     */
    let nextUnitOfWork = null;

    // --- Utility Functions ---
    /**
     * Checks if a given vnode represents a component (functional or registered class/function).
     * @param {Object} vnode - The virtual DOM node to check.
     * @returns {boolean} True if the vnode is a component, false otherwise.
     */
    function isComponent(vnode) {
        return (vnode && typeof vnode !== "string" && typeof vnode !== "number" && (typeof vnode.type === "function" || ComponentRegistry[vnode.type]));
    }

    /**
     * Normalizes an array of children while preserving empty child slots.
     * Nullish/boolean values become placeholder text nodes so conditional
     * children do not shift sibling indexes during patching.
     * @param {Array<any>} children - The array of children to normalize.
     * @returns {Array<string|Object|null>} A new array with normalized children.
     */
    function normalizeChildren(children) {
        return (children || [])
            .map(normalizeChild);
    }

    function normalizeChild(child) {
        if (
            child === null ||
            child === undefined ||
            child === false ||
            child === true
        ) {
            return null;
        }

        return typeof child === "number"
            ? String(child)
            : child;
    }

    function isPlaceholderVNode(vnode) {
        return vnode === null ||
            vnode === false ||
            vnode === true;
    }

    function componentTypeKey(componentFn) {
        if (typeof componentFn !== "function") {
            return String(componentFn);
        }

        if (!componentTypeIds.has(componentFn)) {
            componentTypeId++;
            componentTypeIds.set(
                componentFn,
                "fn:" + componentTypeId
            );
        }

        return componentTypeIds.get(componentFn);
    }

    function vnodePathSegment(vnode, index) {
        if (
            vnode &&
            typeof vnode !== "string" &&
            typeof vnode !== "number" &&
            vnode.key !== null &&
            vnode.key !== undefined
        ) {
            return "key:" + String(vnode.key);
        }

        return String(index);
    }

    function vnodeKey(vnode) {
        if (
            vnode &&
            typeof vnode !== "string" &&
            typeof vnode !== "number" &&
            vnode.key !== null &&
            vnode.key !== undefined
        ) {
            return String(vnode.key);
        }

        return null;
    }

    function componentInstanceKey(componentFn, vnode, path) {
        return componentTypeKey(componentFn) + "|path:" + path;
    }

    /**
     * Recursively resolves a component vnode by rendering it until a non-component vnode is returned.
     * @param {Object} vnode - The virtual DOM node to resolve.
     * @param {Renderer} renderer - The active renderer.
     * @param {string} path - Stable render-tree path for instance reuse.
     * @returns {Object} The resolved non-component virtual DOM node.
     */
    function resolveComponent(vnode, renderer, path = "0") {
        if (!isComponent(vnode)) {
            return vnode;
        }

        const componentFn =
            typeof vnode.type === "function"
                ? vnode.type
                : ComponentRegistry[vnode.type];

        const instanceKey =
            componentInstanceKey(
                componentFn,
                vnode,
                path
            );

        let instance = renderer.componentInstances.get(instanceKey);

        if (!instance) {
            instance =
                new ComponentInstance(
                    componentFn,
                    {
                        ...vnode.props,
                        children: vnode.children
                    },
                    renderer
                );

            renderer.componentInstances.set(
                instanceKey,
                instance
            );
        } else {
            instance.props = {
                ...vnode.props,
                children: vnode.children
            };
            instance.renderer = renderer;
        }

        renderer.activeComponentKeys.add(instanceKey);

        return resolveComponent(
            instance.render(),
            renderer,
            path + ".0"
        );
    }

    function resolveVNodeTree(vnode, renderer, path = "0") {
        const resolved =
            resolveComponent(
                vnode,
                renderer,
                path
            );

        const normalized =
            normalizeChild(resolved);

        if (
            normalized === null ||
            typeof normalized === "string" ||
            typeof normalized === "number"
        ) {
            return normalized;
        }

        return {
            ...normalized,
            children: normalizeChildren(normalized.children)
                .map((child, index) =>
                    resolveVNodeTree(
                        child,
                        renderer,
                        path + "." + vnodePathSegment(child, index)
                    )
                )
        };
    }

    // --- Scheduler Functions ---
    /**
     * Schedules a task to be run by the scheduler.
     * High priority tasks are run before normal priority tasks.
     * @param {Function} task - The function to execute.
     * @param {"high"|"normal"} [priority="normal"] - The priority of the task.
     */
    function schedule(task, priority = "normal") {
        if (priority === "high") {
            highPriorityQueue.push(task);
        } else {
            normalPriorityQueue.push(task);
        }

        if (!schedulerRunning) {
            schedulerRunning = true;
            queueMicrotask(flushScheduler);
        }
    }

    /**
     * Flushes the high and normal priority queues.
     * This function is typically called via `queueMicrotask` to ensure it runs after current script execution.
     */
    function flushScheduler() {
        runQueue(highPriorityQueue);
        runQueue(normalPriorityQueue);
        schedulerRunning = false;
    }

    /**
     * Executes all tasks in a given queue.
     * @param {Array<Function>} queue - The queue of functions to run.
     */
    function runQueue(queue) {
        while (queue.length) {
            queue.shift()();
        }
    }

    function haveDepsChanged(previousDeps, nextDeps) {
        return !nextDeps ||
            !previousDeps ||
            nextDeps.length !== previousDeps.length ||
            nextDeps.some((dependency, index) => dependency !== previousDeps[index]);
    }

    function assertHookInstance(hookName) {
        if (!currentInstance) {
            throw new Error(hookName + " called outside component");
        }

        return currentInstance;
    }

    // --- Hook Management ---
    /**
     * Sets the current component instance for hook context and resets the hook index.
     * @param {ComponentInstance} instance - The component instance currently being rendered.
     */
    function setCurrentInstance(instance) {
        currentInstance = instance;
        hookIndex = 0;
    }

    /**
     * A hook that allows functional components to use state.
     * @param {any} initialValue - The initial value of the state.
     * @returns {[any, Function]} A tuple containing the current state value and a function to update it.
     * @throws {Error} If called outside a component's render function.
     */
    export function useState(initialValue) {
        const instance = assertHookInstance("useState");

        const index = hookIndex;

        // Initialize hook state if it doesn't exist for this index
        if (instance.hooks[index] === undefined) {
            instance.hooks[index] =
                typeof initialValue === "function"
                    ? initialValue()
                    : initialValue;
        }

        /**
         * Function to update the state.
         * @param {any|Function} value - The new state value or a function that receives the previous state and returns the new state.
         * @param {"high"|"normal"} [priority="normal"] - The priority of the update.
         */
        const setState = (value, priority = "normal") => {
            instance.hooks[index] = typeof value === "function" ? value(instance.hooks[index]) : value;

            schedule(() => {
                instance.renderer.update(); // Trigger re-render of the component
            }, priority);
        };

        hookIndex++; // Move to the next hook index

        return [instance.hooks[index], setState];
    }

    /**
     * A hook that stores a mutable object for the lifetime of a component instance.
     * Updating `.current` does not trigger a re-render.
     * @param {any} initialValue - Initial value for the ref's current property.
     * @returns {{current: any}} The stable ref object.
     */
    export function useRef(initialValue) {
        const instance = assertHookInstance("useRef");

        const index = hookIndex;

        if (instance.hooks[index] === undefined) {
            instance.hooks[index] = {
                type: "ref",
                current: initialValue
            };
        }

        hookIndex++;

        return instance.hooks[index];
    }

    /**
     * A hook that manages state through a reducer function.
     * @param {Function} reducer - Function receiving current state and action.
     * @param {any} initialArg - Initial state or initializer argument.
     * @param {Function} [init] - Optional lazy initializer.
     * @returns {[any, Function]} Current state and dispatch function.
     */
    export function useReducer(reducer, initialArg, init) {
        const instance = assertHookInstance("useReducer");

        const index = hookIndex;

        if (instance.hooks[index] === undefined) {
            const hook = {
                type: "reducer",
                state:
                    typeof init === "function"
                        ? init(initialArg)
                        : initialArg,
                dispatch: null
            };

            hook.dispatch = action => {
                const nextState =
                    reducer(
                        hook.state,
                        action
                    );

                if (Object.is(hook.state, nextState)) {
                    return;
                }

                hook.state = nextState;

                schedule(() => {
                    instance.renderer.update();
                });
            };

            instance.hooks[index] = hook;
        }

        const hook = instance.hooks[index];

        hookIndex++;

        return [
            hook.state,
            hook.dispatch
        ];
    }

    /**
     * A hook that memoizes an expensive computed value while dependencies remain stable.
     * @param {Function} factory - Function that produces the value.
     * @param {Array<any>} deps - Dependency list.
     * @returns {any} Memoized value.
     */
    export function useMemo(factory, deps) {
        const instance = assertHookInstance("useMemo");

        const index = hookIndex;

        const previous = instance.hooks[index];

        if (
            !previous ||
            haveDepsChanged(previous.deps, deps)
        ) {
            instance.hooks[index] = {
                type: "memo",
                deps,
                value: factory()
            };
        }

        hookIndex++;

        return instance.hooks[index].value;
    }

    /**
     * A hook that memoizes a callback while dependencies remain stable.
     * @param {Function} callback - Callback to memoize.
     * @param {Array<any>} deps - Dependency list.
     * @returns {Function} Memoized callback.
     */
    export function useCallback(callback, deps) {
        return useMemo(
            () => callback,
            deps
        );
    }

    export function useContext(context) {
        assertHookInstance("useContext");

        return context.value;
    }

    /**
     * A hook that allows functional components to perform side effects.
     * @param {Function} callback - The effect function to run. Can return a cleanup function.
     * @param {Array<any>} [deps] - An array of dependencies. The effect will only re-run if a dependency changes.
     * @throws {Error} If called outside a component's render function.
     */
    export function useEffect(callback, deps) {
        const instance = assertHookInstance("useEffect");

        const index = hookIndex;

        const previous = instance.hooks[index];

        let changed = true;
        let previousCleanup = null;

        if (previous) {
            const oldDeps = previous.deps;

            previousCleanup = previous.cleanup;

            changed =
                haveDepsChanged(oldDeps, deps);
        }

        // If dependencies changed, schedule the effect to run
        if (changed) {
            const effectHook = {
                type: "effect",
                deps,
                cleanup: null,
                pending: true
            };

            instance.hooks[index] = effectHook;

            queueMicrotask(() => {
                if (instance.disposed || instance.hooks[index] !== effectHook) {
                    return;
                }

                if (typeof previousCleanup === "function") {
                    previousCleanup();
                }

                const cleanup = callback(); // Execute the effect callback

                // Store new dependencies and cleanup function
                effectHook.cleanup =
                    typeof cleanup === "function"
                        ? cleanup
                        : null;
                effectHook.pending = false;
            });
        }

        hookIndex++; // Move to the next hook index
    }

    /**
     * A hook that runs after DOM updates and before passive effects.
     * This is useful for reading layout or attaching imperative DOM resources.
     * @param {Function} callback - Effect function. Can return a cleanup function.
     * @param {Array<any>} deps - Dependency list.
     */
    export function useLayoutEffect(callback, deps) {
        const instance = assertHookInstance("useLayoutEffect");

        const index = hookIndex;

        const previous = instance.hooks[index];

        let changed = true;
        let previousCleanup = null;

        if (previous) {
            previousCleanup = previous.cleanup;

            changed =
                haveDepsChanged(previous.deps, deps);
        }

        if (changed) {
            const layoutEffectHook = {
                type: "layoutEffect",
                deps,
                cleanup: null,
                pending: true
            };

            instance.hooks[index] = layoutEffectHook;

            instance.renderer.enqueueLayoutEffect(() => {
                if (instance.disposed || instance.hooks[index] !== layoutEffectHook) {
                    return;
                }

                if (typeof previousCleanup === "function") {
                    previousCleanup();
                }

                const cleanup = callback();

                layoutEffectHook.cleanup =
                    typeof cleanup === "function"
                        ? cleanup
                        : null;
                layoutEffectHook.pending = false;
            });
        }

        hookIndex++;
    }

    // --- Component Instance Class ---
    /**
     * Represents an instance of a functional component.
     * Manages its props, renderer, and hook state.
     */
    class ComponentInstance {
        /**
         * @param {Function} componentFn - The functional component function.
         * @param {Object} props - The properties passed to the component.
         * @param {Renderer} renderer - The renderer instance responsible for this component.
         */
        constructor(componentFn, props, renderer) {
            this.componentFn = componentFn;
            this.props = props;
            this.renderer = renderer;
            this.disposed = false;
            /**
             * Array to store the state and cleanup functions for hooks used by this instance.
             * @type {Array<any>}
             */
            this.hooks = [];
        }

        cleanup() {
            this.disposed = true;

            this.hooks.forEach(hook => {
                if (
                    (
                        hook?.type === "effect" ||
                        hook?.type === "layoutEffect"
                    ) &&
                    typeof hook.cleanup === "function"
                ) {
                    hook.cleanup();
                }
            });
        }

        /**
         * Renders the component by calling its function with current props.
         * Sets up the current instance context for hooks before rendering.
         * @returns {Object} The virtual DOM node returned by the component function.
         */
        render() {
            setCurrentInstance(this); // Set context for hooks

            const vnode = this.componentFn(this.props);

            currentInstance = null; // Clear context after rendering

            return vnode;
        }
    }

    // --- DOM Manipulation Functions ---
    /**
     * Creates a real DOM element from a virtual DOM node.
     * Recursively creates and appends children.
     * @param {Object|string|number} vnode - The virtual DOM node.
     * @param {Renderer} renderer - The active renderer.
     * @param {string} path - Stable render-tree path for instance reuse.
     * @returns {Node} The created real DOM node.
     */
    function createDom(vnode, renderer, path = "0") {
        vnode = resolveComponent(
            vnode,
            renderer,
            path
        ); // Resolve any component vnodes

        if (vnode === undefined || isPlaceholderVNode(vnode)) {
            return document.createTextNode(""); // Return empty text node for null/undefined
        }

        if (typeof vnode === "string" || typeof vnode === "number") {
            return document.createTextNode(vnode); // Create text node for primitives
        }

        const dom = document.createElement(vnode.type); // Create element for non-primitives

        updateProps(dom, {}, vnode.props); // Apply properties

        // Recursively create and append children
        normalizeChildren(vnode.children)
            .map((child, index) =>
                createDom(
                    child,
                    renderer,
                    path + "." + vnodePathSegment(child, index)
                )
            )
            .forEach(child => dom.appendChild(child));

        return dom;
    }

    /**
     * Checks if a property key represents an event handler.
     * @param {string} key - The property key.
     * @returns {boolean} True if it's an event handler (starts with "on"), false otherwise.
     */
    function isEvent(key) {
        return key.startsWith("on");
    }

    /**
     * Checks if a property key should be treated as a DOM property (not children or event).
     * @param {string} key - The property key.
     * @returns {boolean} True if it's a DOM property, false otherwise.
     */
    function isProperty(key) {
        return key !== "children" && key !== "key" && !isEvent(key);
    }

    function isAttribute(name) {
        return name.startsWith("data-") ||
            name.startsWith("aria-") ||
            name === "role" ||
            name === "form";
    }

    const browserManagedInputTypes = new Set([
        "date",
        "datetime-local",
        "month",
        "time",
        "week"
    ]);

    function isBrowserManagedInput(element) {
        return element.tagName === "INPUT" &&
            browserManagedInputTypes.has((element.type || "").toLowerCase());
    }

    /**
     * Determines the correct event type for a given event handler name and DOM element.
     * Handles special cases like 'change' event for input/textarea elements.
     * @param {HTMLElement} dom - The DOM element.
     * @param {string} name - The event handler name (e.g., "onClick").
     * @returns {string} The actual event type (e.g., "click", "input").
     */
    function eventTypeFor(dom, name) {
        const eventName = name.substring(2).toLowerCase();

        if (eventName === "change" && isBrowserManagedInput(dom)) {
            return "change";
        }

        if (eventName === "change" && (dom.tagName === "INPUT" || dom.tagName === "TEXTAREA") && dom.type !== "checkbox" && dom.type !== "radio" && dom.type !== "file") {
            return "input"; // Use 'input' for value changes in most inputs/textareas
        }

        return eventName;
    }

    /**
     * Sets CSS styles on a DOM element.
     * Handles both string-based and object-based style definitions.
     * @param {HTMLElement} dom - The DOM element.
     * @param {string|Object|null} style - The style to apply.
     */
    function setStyle(dom, style) {
        if (typeof style === "string") {
            dom.setAttribute("style", style);
            return;
        }

        if (!style) {
            dom.removeAttribute("style");
            return;
        }

        dom.removeAttribute("style"); // Clear existing inline styles

        Object.keys(style)
            .forEach(name => {
                if (name.startsWith("--")) {
                    dom.style.setProperty(name, style[name]);
                } else {
                    dom.style[name] = style[name];
                }
            });
    }

    /**
     * Updates the properties of a real DOM element based on changes between old and new vnode props.
     * Handles events, standard properties, className, and style.
     * @param {HTMLElement} dom - The real DOM element to update.
     * @param {Object} prevProps - The previous properties object.
     * @param {Object} nextProps - The new properties object.
     */
    function updateProps(dom, prevProps, nextProps) {
        // Remove old event listeners
        Object.keys(prevProps)
            .filter(isEvent)
            .forEach(name => {
                dom.removeEventListener(eventTypeFor(dom, name), prevProps[name]);
            });

        // Remove old properties that are no longer present
        Object.keys(prevProps)
            .filter(isProperty)
            .forEach(name => {
                if (!(name in nextProps)) {
                    if (name === "className") {
                        dom.removeAttribute("class");
                    } else if (name === "style") {
                        dom.removeAttribute("style");
                    } else if (isAttribute(name)) {
                        dom.removeAttribute(name);
                    } else {
                        dom[name] = ""; // Clear other properties
                    }
                }
            });

        // Add/Update new properties
        Object.keys(nextProps)
            .filter(isProperty)
            .forEach(name => {
                if (name === "className") {
                    dom.setAttribute("class", nextProps[name]);
                } else if (name === "style") {
                    setStyle(dom, nextProps[name]);
                } else if (
                    name === "value" &&
                    document.activeElement === dom
                ) {
                    return;
                } else if (isAttribute(name)) {
                    const value = nextProps[name];

                    if (value === null || value === undefined || value === false) {
                        dom.removeAttribute(name);
                    } else {
                        dom.setAttribute(name, String(value));
                    }
                } else if (dom[name] !== nextProps[name]) {
                    dom[name] = nextProps[name];
                }
            });

        // Add new event listeners
        Object.keys(nextProps)
            .filter(isEvent)
            .forEach(name => {
                dom.addEventListener(eventTypeFor(dom, name), nextProps[name]);
            });
    }

    /**
     * Checks if two virtual DOM nodes are different enough to require a full replacement.
     * Considers type and whether they are primitive values.
     * @param {Object|string|number} a - The first vnode.
     * @param {Object|string|number} b - The second vnode.
     * @returns {boolean} True if they are different types or primitive/non-primitive mismatch, false otherwise.
     */
    function changed(a, b) {
        const aPrimitive = typeof a === "string" || typeof a === "number";
        const bPrimitive = typeof b === "string" || typeof b === "number";

        if (aPrimitive || bPrimitive) {
            return !(aPrimitive && bPrimitive); // Different if one is primitive and other is not
        }

        const aKey =
            vnodeKey(a);
        const bKey =
            vnodeKey(b);

        if (
            (aKey !== null || bKey !== null) &&
            aKey !== bKey
        ) {
            return true;
        }

        return (typeof a !== typeof b || a?.type !== b?.type); // Different if types or vnode types differ
    }

    /**
     * Recursively compares and updates the real DOM to match the new virtual DOM.
     * This is the core reconciliation algorithm.
     * @param {HTMLElement} parent - The parent DOM element.
     * @param {Object|string|number|null|undefined} newVNode - The new virtual DOM node.
     * @param {Object|string|number|null|undefined} oldVNode - The old virtual DOM node.
     * @param {number} [index=0] - The index of the child node being patched.
     * @param {Renderer} renderer - The active renderer.
     * @param {string} path - Stable render-tree path for instance reuse.
     */
    function patch(parent, newVNode, oldVNode, index = 0, renderer, path = "0") {
        if (!parent) {
            return;
        }

        newVNode = resolveComponent(
            newVNode,
            renderer,
            path
        ); // Resolve components before patching

        const existing = parent.childNodes[index]; // Get the corresponding real DOM node

        // Case 1: New vnode exists, old vnode doesn't (add new node)
        if (oldVNode === undefined) {
            parent.appendChild(
                createDom(
                    newVNode,
                    renderer,
                    path
                )
            );
            return;
        }

        // Case 2: Old vnode exists, new vnode doesn't (remove old node)
        if (newVNode === undefined) {
            if (existing) {
                parent.removeChild(existing);
            }
            return;
        }

        if (!existing) {
            parent.insertBefore(
                createDom(
                    newVNode,
                    renderer,
                    path
                ),
                parent.childNodes[index] || null
            );
            return;
        }

        // Case 3: Vnodes are fundamentally different types (replace old with new)
        if (changed(newVNode, oldVNode)) {
            parent.replaceChild(
                createDom(
                    newVNode,
                    renderer,
                    path
                ),
                existing
            );
            return;
        }

        // Case 4: Both are primitive text nodes (update text content)
        if (typeof newVNode === "string" || typeof newVNode === "number") {
            if (existing && existing.nodeValue !== String(newVNode)) {
                existing.nodeValue = String(newVNode);
            }
            return;
        }

        if (isPlaceholderVNode(newVNode)) {
            if (existing && existing.nodeType !== Node.TEXT_NODE) {
                parent.replaceChild(
                    createDom(
                        newVNode,
                        renderer,
                        path
                    ),
                    existing
                );
            }
            return;
        }

        // Case 5: Both are element vnodes of the same type (update props and children)
        updateProps(existing, oldVNode.props || {}, newVNode.props || {});

        const oldChildren = normalizeChildren(oldVNode.children);
        const newChildren = normalizeChildren(newVNode.children);

        if (hasKeyedChildren(oldChildren, newChildren)) {
            patchKeyedChildren(
                existing,
                newChildren,
                oldChildren,
                renderer,
                path
            );
            return;
        }

        const commonLength = Math.min(oldChildren.length, newChildren.length);

        // Patch common children
        for (let i = 0; i < commonLength; i++) {
            const childPath = path + "." + vnodePathSegment(newChildren[i], i);

            patch(
                existing,
                newChildren[i],
                oldChildren[i],
                i,
                renderer,
                childPath
            );
        }

        // Remove excess old children
        for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
            patch(
                existing,
                undefined,
                oldChildren[i],
                i,
                renderer,
                path + "." + vnodePathSegment(oldChildren[i], i)
            );
        }

        // Add new children
        for (let i = commonLength; i < newChildren.length; i++) {
            patch(
                existing,
                newChildren[i],
                undefined,
                i,
                renderer,
                path + "." + vnodePathSegment(newChildren[i], i)
            );
        }
    }

    function hasKeyedChildren(oldChildren, newChildren) {
        return oldChildren.some(child => vnodeKey(child) !== null) ||
            newChildren.some(child => vnodeKey(child) !== null);
    }

    function patchKeyedChildren(parent, newChildren, oldChildren, renderer, path) {
        const oldKeyed = new Map();

        oldChildren.forEach((child, index) => {
            const key = vnodeKey(child);

            if (key !== null) {
                oldKeyed.set(
                    key,
                    {
                        child,
                        dom: parent.childNodes[index]
                    }
                );
            }
        });

        const usedKeys = new Set();

        newChildren.forEach((newChild, newIndex) => {
            const key = vnodeKey(newChild);

            const oldMatch =
                key !== null
                    ? oldKeyed.get(key)
                    : null;

            const childPath = path + "." + vnodePathSegment(newChild, newIndex);

            if (oldMatch?.dom && parent.contains(oldMatch.dom)) {
                usedKeys.add(key);

                const currentIndex =
                    Array
                        .prototype
                        .indexOf
                        .call(
                            parent.childNodes,
                            oldMatch.dom
                        );

                patch(
                    parent,
                    newChild,
                    oldMatch.child,
                    currentIndex,
                    renderer,
                    childPath
                );

                const patchedNode = parent.childNodes[currentIndex];

                const wantedNode = parent.childNodes[newIndex];

                if (
                    patchedNode &&
                    patchedNode !== wantedNode
                ) {
                    parent.insertBefore(
                        patchedNode,
                        wantedNode || null
                    );
                }

                return;
            }

            if (key === null) {
                const oldChildAtIndex =
                    oldChildren[newIndex];

                if (
                    oldChildAtIndex !== undefined &&
                    vnodeKey(oldChildAtIndex) === null
                ) {
                    patch(
                        parent,
                        newChild,
                        oldChildAtIndex,
                        newIndex,
                        renderer,
                        childPath
                    );
                    return;
                }
            }

            const created =
                createDom(
                    newChild,
                    renderer,
                    childPath
                );

            parent.insertBefore(
                created,
                parent.childNodes[newIndex] || null
            );
        });

        oldKeyed.forEach((oldMatch, key) => {
            if (usedKeys.has(key)) {
                return;
            }

            if (
                oldMatch.dom &&
                parent.contains(oldMatch.dom)
            ) {
                parent.removeChild(oldMatch.dom);
            }
        });

        while (parent.childNodes.length > newChildren.length) {
            const lastNode = parent.lastChild;

            if (!lastNode) {
                break;
            }

            parent.removeChild(lastNode);
        }
    }

    // --- Concurrent Mode Work Loop (Experimental/Placeholder) ---
    /**
     * The work loop for concurrent rendering, executed via `requestIdleCallback`.
     * Processes units of work until the deadline is met or no more work exists.
     * @param {IdleDeadline} deadline - Object provided by `requestIdleCallback` with `timeRemaining()`.
     */
    function workLoop(deadline) {
        let shouldYield = false;

        while (nextUnitOfWork && !shouldYield) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
            shouldYield = deadline.timeRemaining() < 1; // Yield if less than 1ms remaining
        }

        if (nextUnitOfWork) {
            requestIdleCallback(workLoop); // Schedule next work loop if work remains
        }
    }

    /**
     * Performs a single unit of work.
     * Currently, just executes the function if it's a function.
     * @param {Function|any} work - The unit of work to perform.
     * @returns {null} Always returns null, indicating work is done for this unit.
     */
    function performUnitOfWork(work) {
        if (typeof work === "function") {
            work();
        }
        return null;
    }

    // --- Renderer Class ---
    /**
     * Manages the rendering process for a specific root DOM element.
     * Handles mounting, updating, and concurrent updates.
     */
    export class Renderer {
        /**
         * @param {HTMLElement} root - The root DOM element where the application will be mounted.
         */
        constructor(root) {
            this.root = root;
            /**
             * The current virtual DOM tree being rendered.
             * @type {Object|null}
             */
            this.currentVNode = null;
            /**
             * The root application function that returns the main vnode.
             * @type {Function|null}
             */
            this.appFn = null;
            /**
             * Data passed to the root application function.
             * @type {Object|null}
             */
            this.data = null;
            this.componentInstances =
                new Map();
            this.activeComponentKeys =
                new Set();
            this.pendingLayoutEffects = [];
            appRenderer = this; // Set this renderer as the global active renderer
        }

        /**
         * Mounts the application to the root DOM element.
         * @param {Function} appFn - The root component/function that returns the application's vnode.
         * @param {Object} [data={}] - Initial data to pass to the appFn.
         */
        mount(appFn, data = {}) {
            this.appFn = appFn;
            this.data = data;
            this.update(); // Perform initial render
        }

        /**
         * Triggers a synchronous update/re-render of the application.
         * Captures active element state, re-renders, and restores focus.
         */
        update() {
            const activeState = captureActiveElement(this.root); // Save active element state
            this.activeComponentKeys =
                new Set();

            const newVNode =
                resolveVNodeTree(
                    this.appFn(this.data),
                    this,
                    "0"
                ); // Get new vnode tree

            if (this.currentVNode === null) {
                this.root.replaceChildren(
                    createDom(
                        newVNode,
                        this,
                        "0"
                    )
                ); // Create and replace any stale root DOM on initial mount
            } else {
                patch(
                    this.root,
                    newVNode,
                    this.currentVNode,
                    0,
                    this,
                    "0"
                ); // Patch existing DOM
            }

            this.currentVNode = newVNode; // Store current vnode
            this.cleanupUnusedComponentInstances();
            restoreActiveElement(this.root, activeState); // Restore focus and cursor position
            this.flushLayoutEffects();
        }

        enqueueLayoutEffect(effect) {
            this.pendingLayoutEffects.push(effect);
        }

        flushLayoutEffects() {
            const effects =
                this.pendingLayoutEffects.splice(0);

            effects.forEach(effect => {
                try {
                    effect();
                } catch (error) {
                    console.error("Unable to run layout effect", error);
                }
            });
        }

        cleanupUnusedComponentInstances() {
            Array
                .from(this.componentInstances.keys())
                .forEach(key => {
                    if (this.activeComponentKeys.has(key)) {
                        return;
                    }

                    const instance = this.componentInstances.get(key);

                    if (instance) {
                        instance.cleanup();
                    }

                    this.componentInstances.delete(key);
                });
        }

        /**
         * Schedules an update to be performed concurrently using `requestIdleCallback`.
         * This is an experimental feature for non-blocking updates.
         */
        concurrentUpdate() {
            nextUnitOfWork = () => {
                this.update();
            };
            requestIdleCallback(workLoop);
        }
    }

    // --- Focus Management ---
    const selectableInputTypes = new Set([
        "",
        "email",
        "password",
        "search",
        "tel",
        "text",
        "url"
    ]);

    function shouldUpdateActiveValue(element) {
        return !isBrowserManagedInput(element);
    }

    function supportsTextSelection(element) {
        if (element.tagName === "TEXTAREA") {
            return true;
        }

        return element.tagName === "INPUT" &&
            selectableInputTypes.has((element.type || "").toLowerCase());
    }

    /**
     * Captures the state of the currently active input/textarea element within the root.
     * @param {HTMLElement} root - The root DOM element.
     * @returns {Object|null} An object containing active element details, or null if no relevant element is active.
     */
    function captureActiveElement(root) {
        const active = document.activeElement;

        if (!active || !root.contains(active) || !(active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
            return null;
        }

        if (isBrowserManagedInput(active)) {
            return null;
        }

        return {
            id: active.id || "",
            name: active.name || "",
            selectionEnd: supportsTextSelection(active)
                ? active.selectionEnd
                : null,
            selectionStart: supportsTextSelection(active)
                ? active.selectionStart
                : null,
            value: active.value
        };
    }

    /**
     * Restores focus and cursor position to an element based on captured state.
     * @param {HTMLElement} root - The root DOM element.
     * @param {Object|null} activeState - The captured active element state.
     */
    function restoreActiveElement(root, activeState) {
        if (!activeState) {
            return;
        }

        const active = findReplacementElement(root, activeState);

        if (!active) {
            return;
        }

        // Browser-managed inputs can expose partial edit state that should not be forced back.
        if (shouldUpdateActiveValue(active) && active.value !== activeState.value) {
            active.value = activeState.value;
        }

        active.focus();

        if (
            supportsTextSelection(active) &&
            typeof active.setSelectionRange === "function" &&
            activeState.selectionStart !== null &&
            activeState.selectionEnd !== null
        ) {
            active.setSelectionRange(activeState.selectionStart, activeState.selectionEnd);
        }
    }

    /**
     * Finds a replacement input/textarea element in the new DOM based on ID or name.
     * @param {HTMLElement} root - The root DOM element.
     * @param {Object} activeState - The captured active element state.
     * @returns {HTMLInputElement|HTMLTextAreaElement|null} The found element, or null.
     */
    function findReplacementElement(root, activeState) {
        if (activeState.id) {
            return document.getElementById(activeState.id);
        }

        if (!activeState.name) {
            return null;
        }

        return Array
            .from(root.querySelectorAll("input, textarea"))
            .find(element => element.name === activeState.name);
    }

    /**
     * Creates a root renderer for a given DOM element, primarily for simple vnode rendering.
     * @param {HTMLElement} rootElement - The DOM element to render into.
     * @returns {Object} An object with a `render` method.
     */
    export const createRoot = rootElement => {
        const renderer = new Renderer(rootElement);

        return {
            /**
             * Renders a virtual DOM node into the root element.
             * @param {Object} vnode - The virtual DOM node to render.
             */
            render(vnode) {
                renderer.mount(() => vnode);
            }
        };
    };

    // --- Expose Hooks and Global Objects ---
    Grove.useState = useState;
    Grove.useEffect = useEffect;
    Grove.useLayoutEffect = useLayoutEffect;
    Grove.useRef = useRef;
    Grove.useReducer = useReducer;
    Grove.useMemo = useMemo;
    Grove.useCallback = useCallback;
    Grove.useContext = useContext;
    global.Grove = Grove;

    /**
     * Global GroveDOM object, exposing core DOM rendering utilities.
     * @namespace GroveDOM
     */
    global.GroveDOM = {
        createRoot,
        Renderer // Expose Renderer class for advanced use or inspection
    };
