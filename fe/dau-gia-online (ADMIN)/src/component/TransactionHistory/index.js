import styles from "./transaction.module.css";
import { FaUsers, FaMoneyCheckDollar, FaBoxArchive } from "react-icons/fa6";
import { IoMdAdd } from "react-icons/io";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { formatCurrency } from "../../util/format";
import { get } from "firebase/database";

function TransactionHistory() {
    const [originalData, setOriginalData] = useState([]);
    const [data, setData] = useState([]);
    const [date, setDate] = useState("");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const transactionRef = ref(db, "transaction");
        onValue(transactionRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                const fetched = Object.entries(val).map(([key, value]) => ({
                    no: key,
                    ...value,
                }));
                setOriginalData(fetched);
                setData(fetched);
            } else {
                setOriginalData([]);
                setData([]);
            }
        });
    }, []);


    const handleSearch = (e) => {
        e.preventDefault();

        const filtered = originalData.filter((item) => {
            const matchDate = date ? item.date === date : true;
            const matchSearch =
                search === "" ||
                item.email.toLowerCase().includes(search.toLowerCase()) ||
                item.content.toLowerCase().includes(search.toLowerCase());
            return matchDate && matchSearch;
        });

        setData(filtered);
    };


    return (
        <div className={styles.ui}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}><h1>ADMIN</h1></div>
                <ul className={styles.menu}>
                    <li className={styles.menuItem} onClick={() => navigate("/admin-user")}>
                        <FaUsers className={styles.icon} /><span>Users</span>
                    </li>
                    <li className={styles.menuItem} onClick={() => navigate("/admin-product")}>
                        <FaBoxArchive className={styles.icon} /><span>Products</span>
                    </li>
                    <li className={`${styles.menuItem} ${styles.active}`} onClick={() => navigate("/transaction-history")}>
                        <FaMoneyCheckDollar className={styles.icon} /><span>Payment History</span>
                    </li>
                </ul>
                <div className={styles.sidebarUser} onClick={() => { logout(); navigate("/"); }}>
                    <img src="/user.png" alt="User Avatar" className={styles.avatar} />
                    <div className={styles.username}>ADMIN</div>
                </div>
            </aside>

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
                            <IoMdAdd />
                        </button>
                    </form>

                    <div className={styles.scrollableDiv}>
                        <table className={styles.userTable}>
                            <thead>
                                <tr>
                                    <th>NO</th>
                                    <th>TRAN ID</th>
                                    <th>EMAIL</th>
                                    <th>NAME</th>
                                    <th>DATE</th>
                                    <th>AMOUNT</th>
                                    <th>CONTENT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((t, index) => (
                                    <tr key={t.id}>
                                        <td>{t.no}</td>
                                        <td>{t.id}</td>
                                        <td>{t.email}</td>
                                        <td>{t.fullName}</td>
                                        <td>{t.date}</td>
                                        <td>{formatCurrency(t.amount)} VND</td>
                                        <td>{t.content}</td>
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
