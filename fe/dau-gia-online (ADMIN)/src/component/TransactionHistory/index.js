import styles from "./transaction.module.css";
import { FaMoneyCheckDollar, FaBoxArchive } from "react-icons/fa6";
import { FaUsers } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { formatCurrency } from "../../util/format";
import { get } from "firebase/database";
import axiosInstance from "../../interceptor";
import { jwtDecode } from 'jwt-decode';

function TransactionHistory() {
    const [originalData, setOriginalData] = useState([]);
    const [data, setData] = useState([]);
    const [date, setDate] = useState("");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const [uid, setUid] = useState(null);
    const [user, setuser] = useState(null);

    useEffect(() => {
        if (authToken) {
            const { sub } = jwtDecode(authToken);
            setUid(sub);
        }
    }, [authToken]);

    useEffect(() => {
        const fetchTransactionsWithUsers = async () => {
            try {
                const transactionsRes = await axiosInstance.get(`http://localhost:5000/api/v1/wallet/gettrans/all`);
                const transactions = transactionsRes.data;
                const userIds = [...new Set(transactions.map(t => t.user_id))];

                const userRequests = userIds.map(uid => axiosInstance.get(`http://localhost:5000/api/v1/user/${uid}`)
                    .then(res => ({ uid, displayName: res.data.displayName || "Unknown" }))
                    .catch(() => ({ uid, displayName: "Unknown" }))
                );
                const userResults = await Promise.all(userRequests);
                const userMap = Object.fromEntries(
                    userResults.map(({ uid, displayName }) => [uid, displayName])
                );
                const transactionsWithNames = transactions.map(t => ({
                    ...t,
                    displayName: userMap[t.user_id] || "Unknown",
                    formattedDate: new Date(t.created_at).toLocaleString()
                }));

                setData(transactionsWithNames);
                setOriginalData(transactionsWithNames);

            } catch (err) {
                console.error("Lỗi fetch dữ liệu:", err);
            }
        };

        fetchTransactionsWithUsers();

    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userRes = await axiosInstance.get(`http://localhost:5000/api/v1/user/${uid}`);
                setuser(userRes.data);
            } catch (err) {
                console.error("Lỗi fetch dữ liệu:", err);
            }
        };

        if (uid) {
            fetchUser();
        }
    }, [uid]);


    function formatCurrency(amount) {
        return Math.trunc(amount).toLocaleString("vi-VN");
    }


    const handleSearch = (e) => {
        e.preventDefault();

        const filtered = originalData.filter((item) => {
            const matchDate = date ? item.date === date : true;
            const matchSearch =
                search === "" ||
                item.type.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase()) ||
                item.displayName.toLowerCase().includes(search.toLowerCase());
            return matchDate && matchSearch;
        });

        setData(filtered);
    };
    const handleToUsers = () => navigate("/admin-user");
    const handleToProducts = () => navigate("/admin-product");
    const handleToPayHistory = () => navigate("/transaction-history");
    const { logout } = useAuth();
    const handleToLogOut = () => {
        logout();
        navigate("/");
    }


    return (
        <div className={styles.ui}>
            <div className={styles.sidebar}>
                <div className={styles.logo}>
                    <h1 className={styles.logoText}>ADMIN MANAGER</h1>
                </div>
                <ul className={styles.menu}>
                    <li className={styles.menuItem} onClick={handleToUsers}>
                        <span className={styles.icon}><FaUsers /></span>
                        <span className={styles.text}>Users</span>
                    </li>
                    <li className={`${styles.menuItem}`} onClick={handleToProducts}>
                        <span className={styles.icon}><FaBoxArchive /></span>
                        <span className={styles.text}>Products</span>
                    </li>
                    <li className={`${styles.menuItem} ${styles.active}`} onClick={handleToPayHistory}>
                        <span className={styles.icon}><FaMoneyCheckDollar /></span>
                        <span className={styles.text}>Payment History</span>
                    </li>
                </ul>
                <div className={styles.sidebarUser} onClick={handleToLogOut}>
                    <img src="/user.png" alt="User Avatar" className={styles.avatar} />
                    <div>
                        <div className={styles.username}>{user?.displayName || ""}</div>
                        <div className={styles.username}>{user?.email || ""}</div>

                    </div>
                </div>
            </div>

            <main className={styles.mainBox}>
                <h1 className={styles.title}>TRANSACTION HISTORY</h1>
                <div className={styles.contentBox}>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <h1 className={styles.infor}>{data.length}</h1>
                            <h1 className={styles.infor}>Total Payments</h1>
                        </div>
                        <form className={styles.searchForm} onSubmit={handleSearch}>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Select Date" />
                        </form>
                    </div>

                    <form className={styles.searchBar} onSubmit={handleSearch}>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Email or Content"
                        />
                        <button type="submit" className={styles.addProductIcon}>
                            <IoSearch />
                        </button>
                    </form>

                    <div className={styles.scrollableDiv}>
                        <table className={styles.userTable}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>NAME</th>
                                    <th>ACTION</th>
                                    <th>AMOUNT</th>
                                    <th>DESCRIPTION</th>
                                    <th>DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((t, index) => (
                                    <tr key={t.id}>
                                        <td>{t.id}</td>
                                        <td>{t.displayName}</td>
                                        <td>{t.type}</td>
                                        <td>{formatCurrency(t.amount)} VND</td>
                                        <td>{t.description}</td>
                                        <td>{new Date(t.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default TransactionHistory;
