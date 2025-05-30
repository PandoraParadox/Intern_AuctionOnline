import { useState } from "react";
import styles from "./login.module.css"
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ToastContainer, toast } from 'react-toastify';
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from "jwt-decode";
import { auth } from "../../firebase";
import { GoogleAuthProvider, signInWithPopup, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const idToken = await user.getIdToken();
                login(idToken);
                toast.success("Đăng nhập thành công", {
                    position: "bottom-right",
                    autoClose: 1000,
                    onClose: () => navigate("/admin-user")
                });
            })
            .catch((error) => {
                console.error("Login failed:", error.code, error.message);
                toast.error("Sai tài khoản hoặc mật khẩu!", {
                    position: "bottom-right",
                    autoClose: 1000
                });
            });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };


    const handleGoogleLogin = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(async (result) => {
                const user = result.user;
                const idToken = await user.getIdToken();
                login(idToken);
                toast.success("Đăng nhập thành công", {
                    position: "bottom-right",
                    autoClose: 1000,
                    onClose: () => navigate("/admin-user")
                });
            })
            .catch((error) => {
                console.error("Lỗi đăng nhập Google:", error.message);
                toast.error("Đăng nhập bằng Google thất bại", {
                    position: "bottom-right",
                    autoClose: 1000
                });
            });
    };

    return (
        <>
            <div>
                <div className={styles.background}>
                    <header>
                        <div className={styles.headerContent}>
                            <img src="/Logo.jpg" alt="Logo" className={styles.headerLogo} />
                            <h1 className={styles.headerTitle}>Login</h1>
                        </div>
                    </header>
                    <div className={styles.container}>
                        <h1 className={styles.h1}>Login</h1>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.khung}>
                                <input type="email" required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <span></span>
                                <label>Email</label>
                            </div>
                            <div className={styles.khung}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.passwordInput}
                                />
                                <button
                                    type="button"
                                    onClick={toggleShowPassword}
                                    className={styles.eyeButton}
                                >
                                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                                </button>
                                <span></span>
                                <label>Password</label>
                            </div>
                            <input type="submit" value="Login" />
                        </form>
                        <button className={styles.oauth2} onClick={handleGoogleLogin}>Login with Gmail</button>
                    </div>
                    <ToastContainer />
                </div>
            </div>
        </>
    )
}
export default Login; 