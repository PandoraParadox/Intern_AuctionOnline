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

function AdminUser() {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snapshot = await get(ref(db, "user"));
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    const usersList = Object.entries(usersData).map(([id, user]) => ({
                        id,
                        ...user,
                    }));
                    setData(usersList);
                } else {
                    console.log("No data available");
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    const handleDeleteUser = (id) => {
        setUserToDelete(id);
        setShowModal(true);
    };

    const confirmChange = async () => {
        try {
            await remove(ref(db, `user/${userToDelete}`));
            setData(data.filter(user => user.id !== userToDelete));
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

    return (
        <>
            <div>
                <div className={styles.app}>
                    <div className={styles.sidebar}>
                        <div className={styles.logo}>
                            <h1>ADMIN</h1>
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
                            <p className={styles.username}>ADMIN</p>
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
                                        <th>ID</th>
                                        <th>NAME</th>
                                        <th>EMAIL</th>
                                        <th>ADDRESS</th>
                                        <th>DATE OF BIRTH</th>
                                        <th>ROLE</th>
                                        <th>ACTION</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.address}</td>
                                            <td>{user.dateOfBirth}</td>
                                            <td>{user.role}</td>
                                            <td>{user.action}</td>
                                            <td>
                                                <button onClick={() => navigate(`/update-user/${user.id}`)} className={styles.edit}><BiSolidInbox /></button>
                                                <button onClick={() => handleDeleteUser(user.id)} className={styles.delete}><FaTrash /></button>
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
