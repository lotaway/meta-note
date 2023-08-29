import {PrismaClient} from "@prisma/client";

let client: InstanceType<typeof PrismaClient> = null

export function prismaClientProvider() {
    if (!client) client = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    })
    return client
}