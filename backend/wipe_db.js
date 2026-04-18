import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env.development') })

const wipe = async () => {
    try {
        console.log('Connecting to database...')
        await mongoose.connect(process.env.DATABASE_URL)
        console.log('Connected.')

        const collections = [
            'ledgers',
            'transactions',
            'users',
            'accounts',
            'categories',
            'parties',
            'budgets',
            'recurring',
            'loans',
            'loanSchedules',
            'creditCardCycles',
            'assets',
            'netWorthSnapshots',
        ]
        for (const collectionName of collections) {
            console.log(`Dropping collection: ${collectionName}...`)
            try {
                await mongoose.connection.collection(collectionName).drop()
                console.log(`Dropped ${collectionName}.`)
            } catch (e) {
                if (e.message.includes('ns not found')) {
                    console.log(`Collection ${collectionName} does not exist, skipping.`)
                } else {
                    throw e
                }
            }
        }

        console.log('Database wipe complete.')
        process.exit(0)
    } catch (error) {
        console.error('Wipe failed:', error)
        process.exit(1)
    }
}

wipe()

