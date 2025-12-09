import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router";
import Svg from "../../assets/Computer login-amico (1).svg";
import icon from "../../assets/icon.svg";


export default function ForgotPassword() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({ email: "", otp: "" });

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validateStep1 = () => {

        let newErrors = {};

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(email)) {
            newErrors.email = "Invalid email format";
        }
        setLoading(false);
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {

        let newErrors = {};

        if (!otp.trim()) {
            newErrors.otp = "OTP is required";
        } else if (!/^\d{6}$/.test(otp)) {
            newErrors.otp = "OTP must be 6 digits";
        }
        setLoading(false);
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // STEP 1: SEND OTP
    const handleSendOTP = async (e) => {

        e.preventDefault();

        if (!validateStep1()) return;
        setLoading(true);
        const res = await fetch(`${apiUrl}/users/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (res.ok) {
            toast.success("OTP sent to your email!");
            setStep(2);
            setErrors({ email: "", otp: "" });

            setLoading(false);
        } else {
            setLoading(false);
            toast.error(data.message || "Failed to send OTP");
        }
    };

    // STEP 2: VERIFY OTP
    const handleVerifyOTP = async (e) => {

        e.preventDefault();

        if (!validateStep2()) return;
        setLoading(true);
        const res = await fetch(`${apiUrl}/users/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();

        if (res.ok) {
            toast.success("Your new password has been sent to your email!");
            setTimeout(() => navigate("/TMS-operations/login"), 2000);
            setErrors({ email: "", otp: "" });


            setLoading(false);
        } else {
            setLoading(false);
            toast.error(data.message || "Invalid OTP");
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <ToastContainer position="top-center" autoClose={2000} />

            {/* Card Container */}
            <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl shadow-lg overflow-hidden max-w-5xl w-full">

                {/* Left: Form Section */}
                <div className="w-full md:w-1/2 p-8 sm:p-10">

                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <img src={icon} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
                        <h1 className="text-2xl sm:text-3xl text-[#3903a0] font-semibold">
                            Actowiz
                        </h1>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">
                        Forgot Password
                    </h2>

                    {/* STEP 1 — EMAIL */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-4">

                            <input
                                type="text"
                                placeholder="Enter your email"
                                className="w-full p-3 border rounded-lg bg-white"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrors({ ...errors, email: "" });
                                }}
                            />

                            {errors.email && (
                                <p className="text-red-500 text-sm">{errors.email}</p>
                            )}

                            {/* Button with loader */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    "Send OTP"
                                )}
                            </button>

                        </form>
                    )}

                    {/* STEP 2 — OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">

                            <p className="text-gray-600 text-center mb-2">
                                OTP has been sent to <span className="font-semibold">{email}</span>
                            </p>

                            {/* OTP Boxes */}
                            <div className="flex justify-center gap-2">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength={1}
                                        className="w-12 h-12 text-center text-xl border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        id={`otp-${index}`}
                                        value={otp[index] || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/, "");
                                            const newOtp = otp.split("");

                                            newOtp[index] = value;
                                            setOtp(newOtp.join(""));

                                            if (value && document.getElementById(`otp-${index + 1}`)) {
                                                document.getElementById(`otp-${index + 1}`).focus();
                                            }

                                            setErrors({ ...errors, otp: "" });
                                        }}
                                    />
                                ))}
                            </div>

                            {errors.otp && (
                                <p className="text-red-500 text-sm">{errors.otp}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    "Verify OTP"
                                )}
                            </button>

                        </form>
                    )}
                </div>

                {/* Right: Image Section */}
                <div className="w-full md:w-1/2 bg-blue-50 flex justify-center items-center p-6">
                    <img
                        src={Svg}
                        alt="Illustration"
                        className="object-contain max-h-[60vh] w-full"
                    />
                </div>

            </div>
        </div>
    );

}
