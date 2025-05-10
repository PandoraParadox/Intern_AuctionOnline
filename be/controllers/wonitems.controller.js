const path = require("path");
const db = require("../config/db");
const pool = require('../config/db');
const admin = require('../config/firebase');

exports.getWonItem = async (req, res) => {
    console.log(`Fetching won-items for userId: ${req.params.userId}`);
    try {
        const [rows] = await pool.query(
            `SELECT wi.id AS won_item_id, p.id AS product_id, p.name, wi.final_price, wi.status, wi.won_at, p.images
             FROM won_items wi
             JOIN product p ON wi.product_id = p.id
             WHERE wi.user_id = ?`,
            [req.params.userId]
        );

        const wonItems = rows.map((row) => {
            const images = row.images ? JSON.parse(row.images) : [];
            return {
                id: row.won_item_id,
                productID: row.product_id,
                name: row.name,
                price: row.final_price || 0,
                status: row.status,
                date: row.won_at,
                image: images.length > 0 ? images[0] : '',
            };
        });

        res.json(wonItems);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách mục đã thắng:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
};

exports.confirmPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const productId = req.params.productID;
        const { id, address, shipMethod, phone } = req.body;
        const userId = req.user.uid;

        await connection.query(
            `UPDATE won_items SET status = ? WHERE product_id = ? AND user_id = ?`,
            ['Delivered', productId, userId]
        );


        await connection.query(
            `INSERT INTO payments (user_id, won_item_id,  paid_at, shipping_method, shipping_address, phoneNumber, deliveredTime) 
             VALUES (?, ?, NOW(), ?, ?, ?, DATE_ADD(NOW(), INTERVAL 4 DAY))`,
            [userId, id, shipMethod, address, phone]
        );

        await connection.commit();
        res.status(200).json({ message: 'Xác nhận thanh toán thành công' });
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi xác nhận thanh toán:', err);
        res.status(500).json({ error: 'Lỗi xác nhận thanh toán' });
    } finally {
        connection.release();
    }
};

exports.detailWonitem = async (req, res) => {
    const itemId = req.params.id;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT 
                pay.phoneNumber,
                pay.shipping_address,
                pay.shipping_method,
                pay.deliveredTime,
                p.description
            FROM payments pay
            JOIN won_items wi ON pay.won_item_id = wi.id
            JOIN product p ON wi.product_id = p.id
            WHERE pay.won_item_id = ?
        `, [itemId]);

        if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });

        res.json(rows[0]);
    } catch (error) {
        console.error("Lỗi khi truy vấn chi tiết sản phẩm đã thắng:", error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};