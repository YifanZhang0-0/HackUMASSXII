import { serve } from "./onedefJS/server/server.mjs"
import { Magic } from "./onedefJS/magic.mjs"

function dosomething(a) { return a + 5 }
serve(
    [dosomething, [Magic.INT], Magic.INT]
)
