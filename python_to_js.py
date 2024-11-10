from unicall import client
from unicall import library
import asyncio

async def example():
    while True:
        await asyncio.sleep(1.0)
async def main():
    # asyncio.create_task(example())
    # await asyncio.sleep(1.0)
    # print("OK SO YOU DO KNOW WHAT IS HAPPENING")
    JS: library.Library = await client.load.js("python_to_js.mjs")
    print("LOADED LIBRARY")
    print(await JS.run(0, 5))
    print("ok im done frfr")

asyncio.run(main())
# JS = load.js("test.js")

# print(JS.dosomething(5))