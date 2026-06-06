import { createContext } from "../../lib/Grove.js";

export const AppContext = createContext({
    authToken: null,
    loggedInPerson: null
});
