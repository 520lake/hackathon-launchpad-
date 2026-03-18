import { useState } from "react";
import axios from "axios";
import type { NavigateFunction } from "react-router-dom";

export function useAccountSettings(navigate: NavigateFunction) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("新密码至少需要6位");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "/api/v1/users/me/change-password",
        {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("密码修改成功");
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "密码修改失败");
    }
  };

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmText !== "注销账号") {
      alert('请输入"注销账号"以确认操作');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "/api/v1/users/me/deactivate",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      localStorage.removeItem("token");
      setShowDeactivateModal(false);
      alert("账号已注销，您现在以游客身份浏览");
      navigate("/");
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "注销失败");
    }
  };

  return {
    showChangePassword,
    setShowChangePassword,
    passwordForm,
    setPasswordForm,
    showDeactivateModal,
    setShowDeactivateModal,
    deactivateConfirmText,
    setDeactivateConfirmText,
    handleChangePassword,
    handleDeactivateAccount,
  };
}
