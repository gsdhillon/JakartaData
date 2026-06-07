# Developer Terms

| Term | Meaning |
| --- | --- |
| toast plumbing | Code path that creates, stores, renders, and removes popup messages. |
| cache busting | Changing a URL or version so the browser fetches fresh files instead of cached ones. |
| wiring | Connecting events, state, services, and components so a flow works. |
| state | Data remembered by a component between renders. |
| props | Values passed from a parent component to a child component. |
| callback | Function passed to another function or component to run later. |
| router | Code that maps a URL or path to the component/page to show. |
| hash route | Route stored after `#` in the browser URL, handled only by the frontend. |
| fetch wrapper | Shared helper around `fetch` for headers, parsing, and errors. |
| payload | Data sent in a request body, usually JSON. |
| rerender | Running component render code again because state, props, or context changed. |
| listener | Function registered to react to an event, such as click, fetch, hashchange, or a custom app event. |
| rerender/listener churn | Repeated rerenders and event listener attach/remove cycles caused by unstable values or effects. |
| vendor churn | Repeated changes caused by external libraries, tools, APIs, or frameworks changing over time. |
| prop drilling | Passing data or callbacks through many intermediate components only so a deep child can use them. |
| callback hell | Code that becomes hard to follow because callbacks are nested inside callbacks. |
| context | Shared value made available to child components without passing it through every prop layer. |
| memoization | Reusing a previous computed value until its dependencies change. |
| dependency array | Hook argument that decides when memoized values or effects should run again. |
| stable reference | Object, array, or function identity that stays the same between renders unless its real inputs change. |
| effect | Hook code that runs after render to synchronize with external systems, events, or browser APIs. |
| cleanup | Function that removes work created by an effect, such as event listeners or timers. |
