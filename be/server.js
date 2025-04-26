const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

const admin = require('./config/firebase');
const verifyToken = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};

const verifyTokenWS = async (token) => {
    if (!token) {
        throw new Error('No token provided');
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Token verification failed:', error);
        throw new Error('Invalid token');
    }
};

const productRoutes = require('./routes/product.routes');
const protectedRoutes = require('./routes/protected.routes');

app.use('/api/v1', productRoutes);
app.use('/api/v1/protected', verifyToken, protectedRoutes);

const clients = new Map();

const getAuctionStatus = (auctionTime) => {
    const start = new Date(auctionTime);
    if (isNaN(start.getTime())) {
        console.error('Invalid auctionTime:', auctionTime);
        throw new Error('Invalid auctionTime format');
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const now = new Date();
    console.log('getAuctionStatus:', {
        auctionTime: start.toISOString(),
        endTime: end.toISOString(),
        now: now.toISOString(),
        status: now < start ? 'Pending' : now <= end ? 'Active' : 'Ended'
    });
    if (now < start) return 'Pending';
    if (now >= start && now <= end) return 'Active';
    return 'Ended';
};

wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    let timeout;

    ws.on('message', async (message) => {
        console.log('WebSocket message received:', message.toString());
        const data = JSON.parse(message);
        const { type, auctionId, userId, bidAmount, token } = data;

        try {
            if (type === 'join') {
                await verifyTokenWS(token);
                ws.auctionId = auctionId;
                clients.set(ws, auctionId);

                const [products] = await pool.execute(
                    'SELECT * FROM product WHERE id = ?',
                    [auctionId]
                );
                const [bids] = await pool.execute('SELECT * FROM bid_history WHERE product_id = ? ORDER BY bid_time DESC', [
                    auctionId,
                ]);

                if (products.length) {
                    const product = products[0];
                    let status;
                    try {
                        status = getAuctionStatus(product.auctionTime);
                    } catch (error) {
                        ws.send(JSON.stringify({ type: 'error', message: error.message }));
                        return;
                    }
                    const startTime = new Date(product.auctionTime);
                    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

                    ws.send(
                        JSON.stringify({
                            type: 'auction_data',
                            auction: {
                                id: product.id,
                                name: product.name,
                                images: product.images,
                                startingPrice: product.startingPrice,
                                highest_bid: product.highest_bid,
                                highest_bidder_user: product.highest_bidder_user || null,
                                auctionTime: startTime.toISOString(),
                                end_time: endTime.toISOString(),
                                status,
                                category: product.category,
                                description: product.description,
                            },
                            bidHistory: bids,
                        })
                    );


                    const timeToEnd = endTime.getTime() - Date.now();
                    console.log('timeToEnd for auction', auctionId, ':', timeToEnd, 'ms');
                    if (timeToEnd > 0 && status !== 'Ended') {
                        timeout = setTimeout(() => {
                            clients.forEach((clientAuctionId, client) => {
                                if (client.readyState === WebSocket.OPEN && clientAuctionId === auctionId) {
                                    console.log('Sending auction_ended for auction', auctionId);
                                    client.send(
                                        JSON.stringify({
                                            type: 'auction_ended',
                                            winnerId: product.highest_bidder_user || null,
                                        })
                                    );
                                }
                            });
                        }, timeToEnd);
                    } else if (timeToEnd <= 0 && status === 'Ended') {
                        console.log('Auction', auctionId, 'already ended, sending auction_ended');
                        ws.send(
                            JSON.stringify({
                                type: 'auction_ended',
                                winnerId: product.highest_bidder_user || null,
                            })
                        );
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Sản phẩm không tồn tại' }));
                }
            } else if (type === 'bid') {
                const decodedToken = await verifyTokenWS(token);
                const [products] = await pool.execute('SELECT * FROM product WHERE id = ?', [auctionId]);

                if (!products.length) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Sản phẩm không tồn tại' }));
                    return;
                }

                const product = products[0];
                let status;
                try {
                    status = getAuctionStatus(product.auctionTime);
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', message: error.message }));
                    return;
                }
                if (status !== 'Active') {
                    ws.send(JSON.stringify({ type: 'error', message: 'Đấu giá không hoạt động' }));
                    return;
                }

                if (bidAmount <= (product.highest_bid || product.startingPrice)) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Giá đặt phải cao hơn giá hiện tại' }));
                    return;
                }


                await pool.execute('UPDATE product SET highest_bid = ?, highest_bidder_user = ? WHERE id = ?', [
                    bidAmount,
                    userId,
                    auctionId,
                ]);


                await pool.execute('INSERT INTO bid_history (product_id, user_id, bid_amount, bid_time) VALUES (?, ?, ?, ?)', [
                    auctionId,
                    userId,
                    bidAmount,
                    new Date().toISOString(),
                ]);

                const [updatedProduct] = await pool.execute('SELECT * FROM product WHERE id = ?', [auctionId]);
                const [updatedBids] = await pool.execute('SELECT * FROM bid_history WHERE product_id = ? ORDER BY bid_time DESC', [
                    auctionId,
                ]);


                clients.forEach((clientAuctionId, client) => {
                    if (client.readyState === WebSocket.OPEN && clientAuctionId === auctionId) {
                        client.send(
                            JSON.stringify({
                                type: 'update',
                                highestBid: updatedProduct[0].highest_bid,
                                highestBidderId: updatedProduct[0].highest_bidder_user || null,
                                bidHistory: updatedBids,
                            })
                        );
                    }
                });
            }
        } catch (error) {
            console.error('WebSocket error:', error.message);
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(ws);
        clearTimeout(timeout);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});