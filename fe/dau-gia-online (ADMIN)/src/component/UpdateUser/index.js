import styles from "./updateUser.module.css";
import { FaUsers } from "react-icons/fa";
import { FaBoxArchive, FaMoneyCheckDollar } from "react-icons/fa6";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { getDatabase, ref, get, update } from "firebase/database";
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../../interceptor';

const UpdateUser = () => {
  const { uid } = useParams();
  console.log("uid: ", uid);
  const navigate = useNavigate();
  const { logout } = useAuth();


  const [users, setUsers] = useState({
    name: "",
    email: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [dateError, setDateError] = useState("");

  const { authToken } = useAuth();
  const [uids, setUid] = useState(null);
  const [user, setuser] = useState(null);

  useEffect(() => {
    if (authToken) {
      const { sub } = jwtDecode(authToken);
      setUid(sub);
    }
  }, [authToken]);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await axiosInstance.get(`http://localhost:5000/api/v1/user/${uids}`);
        setuser(userRes.data);
      } catch (err) {
        console.error("Lỗi fetch dữ liệu:", err);
      }
    };

    if (uids) {
      fetchUser();
    }
  }, [uids]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsers((prev) => ({ ...prev, [name]: value }));

  };


  const handleUpdate = async (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const confirmChange = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/user/update/${uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: users.email,
          displayName: users.name,
        }),
      });

      if (!response.ok) throw new Error("Update failed");

      toast.success("User updated successfully!", {
        position: "bottom-right",
        autoClose: 1000,
        onClose: () => navigate("/admin-user"),
      });
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update user.", {
        position: "bottom-right",
        autoClose: 1000,
      });
    }

    setShowModal(false);
  };




  const cancelChange = () => setShowModal(false);
  const handleCancel = () => {
    toast.info("User update canceled.", { position: "bottom-right", autoClose: 1000 });
    navigate("/admin-user");
  };
  const handleToUsers = () => navigate("/admin-user");
  const handleToProducts = () => navigate("/admin-product");
  const handleToPayHistory = () => navigate("/transaction-history");
  const handleToLogOut = () => {
    logout();
    navigate("/");
  };

  return (
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
        <div className={styles.header}><h1>UPDATE USER</h1></div>

        <div className={styles.userUpdate}>
          <form className="form__updateUser" onSubmit={handleUpdate}>
            <div className={styles.userDetails}>
              <div className={styles.userColumn}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={users.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={users.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

            </div>

            <div className={styles.userActions}>
              <button type="button" onClick={handleCancel}>Cancel</button>
              <button type="submit">Update</button>
            </div>
          </form>


          {showModal && (
            <div className={styles.notificationAlert}>
              <div className={styles.notification}>
                <p>Are you sure you want to update the information?</p>
                <div className={styles.notificationButton}>
                  <button className={styles.btnConfirm} onClick={confirmChange}>Confirm</button>
                  <button className={styles.btnCancel} onClick={cancelChange}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <ToastContainer />
        </div>
      </div>
    </div>
  );
};

export default UpdateUser;
