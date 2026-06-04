/**
 * @file LocalDateTime.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { Input } from "./Input.js";
import { temporalValue } from "./Instant.js";

export const LocalDateTime = (props = {}) =>
    Input({
        ...props,
        "data-grove-temporal": "local-date-time",
        type: "datetime-local",
        value: temporalValue("local-date-time", props.value)
    });
