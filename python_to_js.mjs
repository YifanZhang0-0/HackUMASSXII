import { serve } from "./unicallJS/server/server.mjs"
import { Magic } from "./unicallJS/magic.mjs"

function dosomething(a) { return a + 5 }
serve(
    [dosomething, [Magic.INT], Magic.INT]
)