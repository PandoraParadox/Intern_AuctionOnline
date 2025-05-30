const express = require('express');
const router = express.Router();
const { getUserInfo, getAllUser, deleteUsers, updateUser } = require('../model/user');


router.get('/get/all', getAllUser);
router.delete('/delete/:uid', deleteUsers);
router.get('/:uid', getUserInfo);
router.put('/update/:uid', updateUser);


module.exports = router;
