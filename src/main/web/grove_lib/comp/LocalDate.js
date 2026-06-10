/**
 * @file LocalDate.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { Input } from "./Input.js";
import { temporalValue } from "./Instant.js";

export const LocalDate = (props = {}) =>
    Input({
        ...props,
        "data-grove-temporal": "local-date",
        type: "date",
        value: temporalValue("local-date", props.value)
    });
