/**
 * @file Form.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../Grove.js";
import { Div } from "./Div.js";
import { temporalValue } from "./Instant.js";

const formFieldTypes = new Set([
    "input",
    "select",
    "textarea"
]);

const isCheckedInput = element =>
    element.type === "checkbox" ||
    element.type === "radio";

const valueFromFormTarget = target =>
    isCheckedInput(target)
        ? target.checked
        : target.dataset.groveTemporal && target.value === ""
            ? null
            : target.value;

const valueForFormField = (props, data) => {
    const value = data[props.name];

    return props["data-grove-temporal"]
        ? temporalValue(props["data-grove-temporal"], value)
        : value;
};

const bindFormVNode = (vnode, data) => {
    if (
        vnode === null ||
        vnode === undefined ||
        typeof vnode === "string" ||
        typeof vnode === "number"
    ) {
        return vnode;
    }

    const props = vnode.props || {};
    const isField =
        (
            formFieldTypes.has(vnode.type) ||
            typeof vnode.type === "function"
        ) &&
        props.name &&
        Object.prototype.hasOwnProperty.call(data, props.name);

    const nextProps = isField
        ? {
            ...props,
            [isCheckedInput(props) ? "checked" : "value"]: valueForFormField(props, data)
        }
        : props;

    return {
        ...vnode,
        props: nextProps,
        children: (vnode.children || []).map(child =>
            bindFormVNode(child, data)
        )
    };
};

const toSlotChildren = slot =>
    Array.isArray(slot)
        ? slot
        : [slot];

const hasSlotLayout = slots =>
    slots.main !== undefined ||
    slots.aside !== undefined ||
    slots.actions !== undefined;

const renderSlotLayout = slots => {
    const layoutChildren = [];

    if (slots.main !== undefined || slots.aside !== undefined) {
        const mainChildren = slots.main !== undefined
            ? toSlotChildren(slots.main)
            : [];

        layoutChildren.push(
            Div(
                { className: "form-main" },
                Div(
                    { className: "form-fields" },
                    ...mainChildren
                ),
                ...(slots.aside !== undefined
                    ? toSlotChildren(slots.aside)
                    : [])
            )
        );
    }

    if (slots.actions !== undefined) {
        layoutChildren.push(
            Div(
                { className: "form-actions" },
                ...toSlotChildren(slots.actions)
            )
        );
    }

    return layoutChildren;
};

/**
 * Creates a form virtual node with optional data binding for named fields.
 * @param {Object} [props={}] - Form attributes and event handlers.
 * @param {...any} children - Form child nodes.
 * @returns {Object} A Grove virtual node.
 */
export const Form = (props = {}, ...children) => {
    const {
        data,
        main,
        aside,
        action,
        actions,
        onDataChange,
        onChange,
        ...formProps
    } = props;
    const actionSlot = actions ?? action;
    const formChildren = hasSlotLayout({ main, aside, actions: actionSlot })
        ? renderSlotLayout({ main, aside, actions: actionSlot })
        : children;
    const boundChildren =
        data && onDataChange
            ? formChildren.map(child =>
                bindFormVNode(child, data)
            )
            : formChildren;

    return createElement(
        "form",
        {
            ...formProps,
            onChange(event) {
                onChange?.(event);

                if (!onDataChange || !event.target.name) {
                    return;
                }

                const fieldName = event.target.name;

                onDataChange(currentData => ({
                    ...currentData,
                    [fieldName]: valueFromFormTarget(event.target)
                }));
            }
        },
        ...boundChildren
    );
};

export const FormIf = (condition, props = {}, ...children) =>
    condition ? Form(props, ...children) : null;
