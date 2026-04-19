import fs from 'fs-extra'
import path from 'path'
import archiver from 'archiver'
import { Parser } from 'json2csv'
import PDFDocument from 'pdfkit'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import logger from './loger.js'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Report Generator Utility
 * Handles generation of CSV, PDF, and ZIP archives.
 */

/**
 * Generates a CSV file from transaction data
 */
const generateCSV = async (data, filePath, metadata = {}) => {
    try {
        const tz = metadata.timezone || 'UTC'
        const fields = ['date', 'title', 'amount', 'type', 'category', 'accountName', 'targetAccountName']
        const json2csvParser = new Parser({ 
            fields,
            transforms: [
                (row) => ({
                    ...row,
                    date: dayjs(row.date).tz(tz).format('YYYY-MM-DD HH:mm')
                })
            ] 
        })
        const csv = json2csvParser.parse(data)
        await fs.outputFile(filePath, csv)
        return filePath
    } catch (error) {
        logger.error('Error generating CSV:', error)
        throw error
    }
}

/**
 * Generates a PDF file from transaction data
 */
const generatePDF = async (data, filePath, metadata = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const tz = metadata.timezone || 'UTC'
            const doc = new PDFDocument({ margin: 50 })
            const stream = fs.createWriteStream(filePath)

            doc.pipe(stream)

            // Header
            doc.fontSize(20).text('Financial Report', { align: 'center' })
            doc.fontSize(12).text(`Generated on: ${dayjs().tz(tz).format('DD MMM YYYY, HH:mm')}`, { align: 'center' })
            doc.moveDown()

            if (metadata.period) {
                doc.fontSize(14).text(`Period: ${metadata.period}`, { align: 'left' })
                doc.moveDown()
            }

            // Summary if available
            if (metadata.summary) {
                doc.fontSize(14).text('Summary')
                doc.fontSize(10).text(`Total Income: ${metadata.summary.income}`)
                doc.text(`Total Expense: ${metadata.summary.expense}`)
                doc.text(`Net Savings: ${metadata.summary.savings}`)
                doc.moveDown()
            }

            // Table Header
            doc.fontSize(12).text('Transactions', { underline: true })
            doc.moveDown(0.5)

            // Dynamic Table
            const tableTop = doc.y
            const col1 = 50
            const col2 = 150
            const col3 = 300
            const col4 = 380
            const col5 = 450

            doc.fontSize(10).font('Helvetica-Bold')
            doc.text('Date', col1, tableTop)
            doc.text('Description', col2, tableTop)
            doc.text('Type', col3, tableTop)
            doc.text('Category', col4, tableTop)
            doc.text('Amount', col5, tableTop, { align: 'right' })

            doc.font('Helvetica').fontSize(9)
            let currentY = tableTop + 20

            data.forEach((txn) => {
                // Page break handling
                if (currentY > 700) {
                    doc.addPage()
                    currentY = 50
                }

                doc.text(dayjs(txn.date).tz(tz).format('DD/MM/YYYY'), col1, currentY)
                doc.text(txn.title || 'N/A', col2, currentY, { width: 140 })
                doc.text(txn.type || 'N/A', col3, currentY)
                doc.text(txn.category || 'N/A', col4, currentY)
                doc.text(txn.amount.toString(), col5, currentY, { align: 'right' })

                currentY += 20
            })

            doc.end()
            stream.on('finish', () => resolve(filePath))
            stream.on('error', (err) => reject(err))
        } catch (error) {
            logger.error('Error generating PDF:', error)
            reject(error)
        }
    })
}

/**
 * Creates a ZIP archive containing the provided files
 */
const createZip = async (sourceFiles, zipPath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', () => resolve(zipPath))
        archive.on('error', (err) => reject(err))

        archive.pipe(output)

        sourceFiles.forEach((file) => {
            archive.file(file.path, { name: file.name })
        })

        archive.finalize()
    })
}

/**
 * Cleanup temporary files
 */
const cleanupFiles = async (filePaths) => {
    try {
        for (const filePath of filePaths) {
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath)
            }
        }
    } catch (error) {
        logger.error('Error cleaning up files:', error)
    }
}

export default {
    generateCSV,
    generatePDF,
    createZip,
    cleanupFiles,
}
