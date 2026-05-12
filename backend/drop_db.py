import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["healthmais"]
    
    await db.operators.drop()
    await db.indicators.drop()
    await db.subindicators.drop()
    await db.patients.drop()
    await db.events.drop()
    
    print("Database cleared successfully!")

if __name__ == "__main__":
    asyncio.run(main())
