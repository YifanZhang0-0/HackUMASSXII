import { Library, Langs } from "../classes.mjs"


export const load = {
    "py": filename => new Library(filename, Langs.PY).load(),
    "c": filename => new Library(filename, Langs.C).load()
}

