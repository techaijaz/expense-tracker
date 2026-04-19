import express from 'express'
import assetController from '../controller/assetController.js'
import authentication from '../middleware/authentication.js'

const router = express.Router()

router.use(authentication)

router.post('/', assetController.createAsset)
router.get('/', assetController.getAssets)
router.put('/:id', assetController.updateAsset)
router.delete('/:id', assetController.deleteAsset)

export default router
