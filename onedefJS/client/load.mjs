import { Library, PY } from "../classes.mjs"


export async function loadPY(filename) {
    let library = new Library(filename, PY)
    await library.load()
    return library
}

