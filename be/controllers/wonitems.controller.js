const pool = require('../config/db');
const path = require("path");
async function recalculatePending(userId) {
    const [rows] = await pool.query(`
        SELECT SUM(final_price) AS total_pending
        FROM won_items 
        WHERE user_id = ? AND status = 'Pending'
    `, [userId]);

    const totalPending = rows[0].total_pending || 0;

    await pool.query(`
        UPDATE wallets SET pending_bids = ? WHERE user_id = ?
    `, [totalPending, userId]);
}
exports.getWonItem = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [cancelResult] = await pool.query(`
            UPDATE won_items 
            SET status = 'Cancel' 
            WHERE user_id = ? 
              AND status NOT IN ('Delivered', 'Received', 'Cancel') 
              AND created_at < NOW()
        `, [userId]);

        if (cancelResult.affectedRows > 0) {
            await recalculatePending(userId);
            await pool.query(`INSERT INTO notifications(user_id, message, type, is_read) VALUES (?,?,?,0)`, [userId, "Your product is overdue", "cancel"]);
        }

        const [rows] = await pool.query(
            `SELECT wi.id AS won_item_id, p.id AS product_id, p.name, wi.final_price, wi.status, wi.won_at ,wi.payment_due, p.images, wi.created_at
             FROM won_items wi
             JOIN product p ON wi.product_id = p.id
             WHERE wi.user_id = ? and wi.status NOT IN ('Received', 'Cancel')`,
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
                payment_due: row.payment_due,
                created_at: row.created_at,
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

        await pool.query(`INSERT INTO notifications(user_id, message, type, is_read) VALUES (?,?,?,0)`, [userId, "Payment confirmation successful", "confirm"]);

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

exports.confirmReceived = async (req, res) => {
    const itemId = req.params.productID;
    const userId = req.user.uid;
    const connection = await pool.getConnection();
    try {
        await connection.query(
            `UPDATE won_items SET status = ? WHERE id = ? AND user_id = ?`,
            ['Received', itemId, userId]
        );
        await connection.commit();
        res.status(200).json({ message: 'Received done' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Received fail' })
    } finally {
        connection.release();
    }
};