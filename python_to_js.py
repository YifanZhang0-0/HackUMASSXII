from unicall import client
from unicall import library
import asyncio

async def main():
    JS = await client.load.js("python_to_js.mjs")
    print(await JS.run(0, 5))

asyncio.run(main())
