import { Function, Library } from "../classes.mjs";

const functions = new Function(['int'], 'array', undefined, 'hello');
const lib = new Library('testLib', 'mjs');

export function hello(world) {
    return 'exclamation';
}