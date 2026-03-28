import express from 'express'
import authentication from '../middleware/authentication.js'
import partyController from '../controller/partyController.js'

const router = express.Router()

router.route('/').post(authentication, partyController.createParty).get(authentication, partyController.getAllParties)

router.route('/:id').patch(authentication, partyController.updateParty).delete(authentication, partyController.deleteParty)

export default router
