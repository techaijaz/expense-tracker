import cron from 'node-cron'
import recurringModel from '../model/recurringModel.js'
import databseService from '../service/databseService.js'
import dayjs from 'dayjs'

const processRecurringTransactions = async () => {
    console.log('[Cron] Checking for recurring transactions...')
    try {
        const today = dayjs().startOf('day').toDate()
        
        // Find all active recurring transactions that are due
        const recurringTasks = await recurringModel.find({
            status: 'ACTIVE',
            nextDueDate: { $lte: today }
        })

        if (recurringTasks.length === 0) {
            console.log('[Cron] No recurring tasks found.')
            return
        }

        console.log(`[Cron] Found ${recurringTasks.length} tasks to process.`)

        for (const task of recurringTasks) {
            try {
                if (task.entryType === 'auto') {
                    // Create ledger entry
                    const payload = {
                        userId: task.userId,
                        date: task.nextDueDate,
                        amount: task.amount,
                        categoryId: task.categoryId,
                        accountId: task.accountId,
                        title: `[Auto] ${task.title}`,
                        type: task.type.toLowerCase(),
                        ledgerType: 'NORMAL',
                    }

                    await databseService.createTransaction(payload)
                    console.log(`[Cron] Processed auto task: ${task.title} for user ${task.userId}`)
                } else {
                    // Just notify if it's manual (for now just log)
                    console.log(`[Cron] Manual task due: ${task.title} for user ${task.userId}`)
                }

                // Update nextDueDate
                let nextDate = dayjs(task.nextDueDate)
                switch (task.frequency) {
                    case 'DAILY': nextDate = nextDate.add(1, 'day'); break;
                    case 'WEEKLY': nextDate = nextDate.add(1, 'week'); break;
                    case 'MONTHLY': nextDate = nextDate.add(1, 'month'); break;
                    case 'QUARTERLY': nextDate = nextDate.add(3, 'month'); break;
                    case 'YEARLY': nextDate = nextDate.add(1, 'year'); break;
                }

                task.lastProcessedAt = new Date()
                task.nextDueDate = nextDate.toDate()
                await task.save()
            } catch (err) {
                console.error(`[Cron] Failed to process task ${task._id}:`, err.message)
            }
        }
    } catch (error) {
        console.error('[Cron] Error in recurring job:', error)
    }
}

// Run every day at midnight (00:00)
export const initRecurringJob = () => {
    cron.schedule('0 0 * * *', processRecurringTransactions)
    console.log('[Cron] Recurring transaction job initialized (daily at 00:00).')
    
    // Also run once on startup to catch up if server was down
    processRecurringTransactions()
}
