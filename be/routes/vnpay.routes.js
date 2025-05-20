const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const moment = require('moment');
const qs = require('qs');

const vnp_TmnCode = 'BV75DJC9';
const vnp_HashSecret = '6XYUKVL08K6M4TLLF7LC64A8X1EI8U92';
const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const vnp_ReturnUrl = 'http://localhost:3000/payment-success'; // FE URL

router.post('/create-vnpay-payment', (req, res) => {
    const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const tmnCode = vnp_TmnCode;
    const secretKey = vnp_HashSecret;
    const vnpUrl = vnp_Url;
    const returnUrl = vnp_ReturnUrl;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('HHmmss');
    const amount = req.body.amount * 100;
    const bankCode = req.body.bankCode || '';

    let locale = 'vn';
    const currCode = 'VND';

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': locale,
        'vnp_CurrCode': currCode,
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': req.body.description || 'Nạp tiền ví',
        'vnp_OrderType': 'billpayment',
        'vnp_Amount': amount,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate,
    };

    if (bankCode) vnp_Params['vnp_BankCode'] = bankCode;

    // Sort params
    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;
    const paymentUrl = `${vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;

    res.json({ paymentUrl });
});

// Helper to sort object keys
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (let key of keys) sorted[key] = obj[key];
    return sorted;
}

module.exports = router;
