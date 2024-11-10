import { Library, PY, C } from "../classes.mjs"


export async function loadPY(filename) {
    let library = new Library(filename, PY)
    await library.load()
    return library
}

export async function loadC(filename) {
    let library = new Library(filename, C)
    await library.load()
    return library
}

