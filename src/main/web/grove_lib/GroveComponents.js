/**
 * @file GroveComponents.js
 * Public barrel for Grove framework components and adapter-selected DOM/hooks.
 */

export const appendClassName = (props = {}, className) => ({
    ...props,
    className: props.className
        ? `${className} ${props.className}`
        : className
});

export const toChildrenArray = children =>
    children === null || children === undefined
        ? []
        : Array.isArray(children)
            ? children
            : [children];

export const vnodeChildren = vnode =>
    toChildrenArray(vnode?.props?.children);

export const withVNodeChildren = (vnode, props, children) => ({
    ...vnode,
    props: {
        ...props,
        children
    },
    children
});

export * from "./comp/Button.js";
export * from "./comp/AppShell.js";
export * from "./comp/AppError.js";
export * from "./comp/CenterPanel.js";
export * from "./comp/CenterPanelContext.js";
export * from "./comp/Div.js";
export * from "./comp/Form.js";
export * from "./comp/FormHeader.js";
export * from "./comp/Footer.js";
export * from "./comp/Header.js";
export * from "./comp/Input.js";
export * from "./comp/Instant.js";
export * from "./comp/Label.js";
export * from "./comp/LocalDate.js";
export * from "./comp/LocalDateTime.js";
export * from "./comp/Menu.js";
export * from "./comp/OptBoolean.js";
export * from "./comp/Page.js";
export * from "./comp/Photo.js";
export * from "./comp/REST.js";
export * from "./comp/Select.js";
export * from "./comp/Table.js";
export * from "./comp/Text.js";
export * from "./comp/TextArea.js";
