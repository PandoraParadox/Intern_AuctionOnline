import styles from "./adminUser.module.css";
import { FaUsers } from "react-icons/fa";
import { FaBoxArchive } from "react-icons/fa6";
import { BiSolidInbox } from "react-icons/bi";
import { FaTrash } from "react-icons/fa";
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { ref, get, remove } from "firebase/database";
import axiosInstance from "../../interceptor";
import { jwtDecode } from 'jwt-decode';

function AdminUser() {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const [uid, setUid] = useState(null);
    const [user, setuser] = useState(null);



    const handleDeleteUser = (uid) => {
        setUserToDelete(uid);
        setShowModal(true);
    };

    const confirmChange = async () => {
        try {
            await axiosInstance.delete(`http://localhost:5000/api/v1/user/delete/${userToDelete}`)
            setData(data.filter(user => user.uid !== userToDelete));
            setShowModal(false);
            toast.success("User has been successfully deleted!", {
                position: "bottom-right",
                autoClose: 1500,
            });
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const cancelChange = () => {
        setShowModal(false);
    };

    const handleToUsers = () => navigate("/admin-user");
    const handleToProducts = () => navigate("/admin-product");
    const handleToPayHistory = () => navigate("/transaction-history");

    const { logout } = useAuth();
    const handleToLogOut = () => {
        logout();
        navigate("/");
    };

    useEffect(() => {
        const fetchUsers = async () => {
            axiosInstance.get(`http://localhost:5000/api/v1/user/get/all`)
                .then((res) => {
                    console.log(res.data.data);
                    setData(res.data.data);
                })
                .catch((err) => console.log(err));
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (authToken) {
            const { sub } = jwtDecode(authToken);
            setUid(sub);
        }
    }, [authToken]);
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

    return (
        <>
            <div>
                <div className={styles.app}>
                    <div className={styles.sidebar}>
                        <div className={styles.logo}>
                            <h1 className={styles.logoText}>ADMIN MANAGER</h1>
                        </div>
                        <ul className={styles.menu}>
                            <li onClick={handleToUsers} className={styles.menuItem + " " + styles.active}>
                                <span className={styles.icon}><FaUsers /></span>
                                <span className={styles.text}>Users</span>
                            </li>
                            <li onClick={handleToProducts} className={styles.menuItem}>
                                <span className={styles.icon}><FaBoxArchive /></span>
                                <span className={styles.text}>Products</span>
                            </li>
                            <li onClick={handleToPayHistory} className={styles.menuItem}>
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

                    <div className={styles.mainContent}>
                        <div className={styles.header}>
                            <h1>USERS</h1>
                        </div>

                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <h1>{data.length}</h1>
                                <h1>Total Users</h1>
                            </div>
                        </div>

                        <div className={styles.scrollableDiv}>
                            <table className={styles.userTable}>
                                <thead>
                                    <tr>
                                        <th>UID</th>
                                        <th>NAME</th>
                                        <th>EMAIL</th>


                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((user) => (
                                        <tr key={user.uid}>
                                            <td>{user.uid}</td>
                                            <td>{user.displayName}</td>
                                            <td>{user.email}</td>


                                            <td>
                                                <button
                                                    onClick={() => {
                                                        if (!user.uid) {
                                                            console.error("User UID is missing!", user);
                                                            return;
                                                        }
                                                        navigate(`/update-user/${user.uid}`);
                                                    }}
                                                    className={styles.edit}
                                                >
                                                    <BiSolidInbox />
                                                </button>

                                                <button onClick={() => handleDeleteUser(user.uid)} className={styles.delete}><FaTrash /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className={styles.notificationAlert}>
                    <div className={styles.notification}>
                        <p>Are you sure you want to delete this user?</p>
                        <div className={styles.notificationButton}>
                            <button className={styles.btnConfirm} onClick={confirmChange}>Confirm</button>
                            <button className={styles.btnCancel} onClick={cancelChange}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer />
        </>
    );
}

export default AdminUser;
