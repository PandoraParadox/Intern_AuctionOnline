import styles from "./updateUser.module.css";
import { FaUsers } from "react-icons/fa";
import { FaBoxArchive, FaMoneyCheckDollar } from "react-icons/fa6";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { getDatabase, ref, get, update } from "firebase/database";
const UpdateUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    address: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    console.log("User ID from URL:", id);
    if (!id) {
      toast.error("User ID is missing!", { position: "bottom-right", autoClose: 1000 });
      return;
    }

    const fetchUser = async () => {
      try {
        const db = getDatabase();
        const userRef = ref(db, `user/${id}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          setUser(snapshot.val());
        } else {
          toast.error("User not found!", { position: "bottom-right", autoClose: 1000 });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to fetch user data.", { position: "bottom-right", autoClose: 1000 });
      }
    };

    fetchUser();
  }, [id]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));

    if (name === "dateOfBirth") validateDate(value);
  };

  const validateDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      setDateError("Invalid date format. Use YYYY-MM-DD.");
      return false;
    }

    const [y, m, d] = date.split("-").map(Number);
    const isValid = new Date(y, m - 1, d).getDate() === d;
    if (!isValid) {
      setDateError("Invalid date. Please enter a valid one.");
      return false;
    }

    setDateError("");
    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateDate(user.dateOfBirth)) {
      toast.error(dateError, { position: "bottom-right", autoClose: 1000 });
      return;
    }

    setShowModal(true);
  };

  const confirmChange = async () => {
    try {
      const db = getDatabase();
      const userRef = ref(db, `user/${id}`);
      await update(userRef, user);

      toast.success("User updated successfully!", {
        position: "bottom-right",
        autoClose: 1000,
        onClose: () => navigate("/admin-user"),
      });
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update user.", { position: "bottom-right", autoClose: 1000 });
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
        <div className={styles.logo}><h1>ADMIN</h1></div>
        <ul className={styles.menu}>
          <li className={`${styles.menuItem} ${styles.active}`} onClick={handleToUsers}>
            <span className={styles.icon}><FaUsers /></span>
            <span className={styles.text}>Users</span>
          </li>
          <li className={styles.menuItem} onClick={handleToProducts}>
            <span className={styles.icon}><FaBoxArchive /></span>
            <span className={styles.text}>Products</span>
          </li>
          <li className={styles.menuItem} onClick={handleToPayHistory}>
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
                    value={user.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={user.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.userColumn}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="date">Date of Birth</label>
                  <input
                    type="text"
                    id="date"
                    name="dateOfBirth"
                    value={user.dateOfBirth}
                    onChange={handleChange}
                    placeholder="YYYY-MM-DD"
                    required
                  />
                  {dateError && <small style={{ color: "red" }}>{dateError}</small>}
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
