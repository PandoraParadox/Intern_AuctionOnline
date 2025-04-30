const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        if (req.user.uid !== req.params.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.get('/:userId', verifyToken, async (req, res) => {
    console.log(`Fetching won-items for userId: ${req.params.userId}`);
    try {
        const [rows] = await pool.query(
            `SELECT wi.id, p.name, wi.final_price, wi.status, wi.won_at, p.images
             FROM won_items wi
             JOIN product p ON wi.product_id = p.id
             WHERE wi.user_id = ?`,
            [req.params.userId]
        );

        const wonItems = rows.map((row) => {
            const images = row.images ? JSON.parse(row.images) : [];
            return {
                id: row.id,
                name: row.name,
                price: row.final_price || 0,
                status: row.status,
                date: row.won_at,
                image: images.length > 0 ? images[0] : '',
            };
        });

        res.json(wonItems);
    } catch (error) {
        console.error('Error fetching won_items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;