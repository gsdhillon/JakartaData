/**
 * @file Form.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement,
    useMemo,
    useRef
} from "../Grove.js";
import { Div } from "./Div.js";
import { temporalValue } from "./Instant.js";
import {
    useCenterPanel,
    useCenterPanelActions
} from "./CenterPanelContext.js";

const formFieldTypes = new Set([
    "input",
    "select",
    "textarea"
]);

const isCheckedInput = element =>
    element.type === "checkbox" ||
    element.type === "radio";

const isRadioInput = element =>
    element.type === "radio";

const coerceRadioValue = value => {
    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    return value;
};

const booleanValue = (value, nullable) => {
    if (nullable && value === "") {
        return null;
    }

    return value === "true";
};

const valueFromFormTarget = target =>
    isRadioInput(target)
        ? coerceRadioValue(target.value)
        : isCheckedInput(target)
        ? target.checked
        : target.dataset.groveBoolean
            ? booleanValue(target.value, target.dataset.groveBoolean === "nullable")
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
        ? isRadioInput(props)
            ? {
                ...props,
                checked: String(valueForFormField(props, data)) === String(props.value)
            }
            : {
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

const isNonEditableField = (props, editableFields) =>
    props.name &&
    (
        props.editable === false ||
        editableFields?.[props.name] === false
    );

const containsNonEditableField = (vnode, editableFields) => {
    if (
        vnode === null ||
        vnode === undefined ||
        typeof vnode === "string" ||
        typeof vnode === "number"
    ) {
        return false;
    }

    const props = vnode.props || {};

    return isNonEditableField(props, editableFields) ||
        (vnode.children || []).some(child =>
            containsNonEditableField(child, editableFields)
        );
};

const filterNonEditableFields = (vnode, editableFields) => {
    if (
        vnode === null ||
        vnode === undefined ||
        typeof vnode === "string" ||
        typeof vnode === "number"
    ) {
        return vnode;
    }

    const props = vnode.props || {};

    if (
        isNonEditableField(props, editableFields) ||
        (
            vnode.type === "label" &&
            String(props.className || "").includes("grove-field-label") &&
            containsNonEditableField(vnode, editableFields)
        )
    ) {
        return null;
    }

    return {
        ...vnode,
        children: (vnode.children || [])
            .map(child => filterNonEditableFields(child, editableFields))
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
                { className: "grove-form-main" },
                Div(
                    { className: "grove-form-fields" },
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
                { className: "grove-form-actions" },
                ...toSlotChildren(slots.actions)
            )
        );
    }

    return layoutChildren;
};

const bindActionToForm = (vnode, formId) => {
    if (
        vnode === null ||
        vnode === undefined ||
        typeof vnode === "string" ||
        typeof vnode === "number"
    ) {
        return vnode;
    }

    const props = vnode.props || {};
    const nextProps =
        vnode.type === "button" && (props.type || "submit") === "submit"
            ? {
                ...props,
                form: props.form || formId
            }
            : props;

    return {
        ...vnode,
        props: nextProps,
        children: (vnode.children || []).map(child =>
            bindActionToForm(child, formId)
        )
    };
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
        editableFields,
        main,
        aside,
        action,
        actions,
        centerActions = true,
        hideNonEditableFields = false,
        layout,
        onDataChange,
        onChange,
        ...formProps
    } = props;
    const formIdRef = useRef(`grove-form-${Math.random().toString(36).slice(2)}`);
    const centerPanel = useCenterPanel();
    const actionSlot = actions ?? action;
    const formId = formProps.id || formProps.name || formIdRef.current;
    const toolbarActions = useMemo(
        () => actionSlot === undefined
            ? null
            : Div(
                { className: "grove-form-actions" },
                ...toSlotChildren(actionSlot).map(actionNode =>
                    bindActionToForm(actionNode, formId)
                )
            ),
        [actionSlot, formId]
    );
    const moveActionsToCenter = Boolean(centerActions && centerPanel && actionSlot !== undefined);
    useCenterPanelActions(moveActionsToCenter ? toolbarActions : null);
    const formChildren = hasSlotLayout({ main, aside, actions: actionSlot })
        ? renderSlotLayout({
            main,
            aside,
            actions: moveActionsToCenter ? undefined : actionSlot
        })
        : children;
    const layoutClassName = layout
        ? `grove-form-${String(layout).toLowerCase()}`
        : "";
    const renderedFormProps = appendClassName(
        formProps,
        [
            "grove-form",
            layoutClassName
        ].filter(Boolean).join(" ")
    );
    const visibleFormChildren = hideNonEditableFields
        ? formChildren.map(child => filterNonEditableFields(child, editableFields))
        : formChildren;
    const boundChildren =
        data && onDataChange
            ? visibleFormChildren.map(child =>
                bindFormVNode(child, data)
            )
            : visibleFormChildren;

    return createElement(
        "form",
        {
            ...renderedFormProps,
            id: formId,
            onChange(event) {
                onChange?.(event);

                if (!onDataChange || !event.target.name) {
                    return;
                }

                if (isRadioInput(event.target) && !event.target.checked) {
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
