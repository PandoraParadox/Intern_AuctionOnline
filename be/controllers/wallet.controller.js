const path = require("path");
const db = require("../config/db");
const admin = require('../config/firebase');

exports.createWallet = async (req, res) => {
    const { user_id } = req.body;
    try {
        const [exists] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [user_id]);
        if (exists.length > 0) return res.json({ message: "Wallet already exists" });

        await db.query("INSERT INTO wallets (user_id) VALUES (?)", [user_id]);
        res.json({ message: "Wallet created" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWalletByUserId = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [rows] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [userId]);
        if (rows.length === 0) return res.status(404).json({ message: "Wallet not found" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTransaction = async (req, res) => {
    const { user_id, type, amount, description } = req.body;
    try {
        const [[wallet]] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [user_id]);
        if (!wallet) return res.status(404).json({ message: "Wallet not found" });
        const newBalance =
            type === "Add Funds"
                ? wallet.balance + amount
                : type === "Withdrawal"
                    ? wallet.balance - amount
                    : wallet.balance;

        const newPending =
            type === "Bids" ? wallet.pending_bids + amount : wallet.pending_bids;

        await db.query("INSERT INTO wallet_transactions (wallet_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, NOW())",
            [wallet.id, type, amount, description]);

        await db.query("UPDATE wallets SET balance = ?, pending_bids = ? WHERE id = ?",
            [newBalance, newPending, wallet.id]);

        res.json({ message: "Transaction completed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTransactionsByUserId = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [[wallet]] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [userId]);
        if (!wallet) return res.status(404).json({ message: "Wallet not found" });

        const [transactions] = await db.query(
            "SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC",
            [wallet.id]
        );
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
