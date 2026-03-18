import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloseIcon } from "./ProfileIcons";

interface AccountTabProps {
  currentUser: any;
  setActiveTab: (tab: string) => void;
}

export default function AccountTab({
  currentUser,
  setActiveTab,
}: AccountTabProps) {
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("密码修改成功");
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      alert("密码修改失败，请检查当前密码是否正确");
    }
  };

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmText !== "DELETE") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post("/api/v1/users/me/deactivate", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      navigate("/login");
    } catch {
      alert("账号停用失败");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Email Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">邮箱地址</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">{currentUser?.email}</p>
            <p className="text-sm text-gray-400 mt-1">
              {currentUser?.email_verified ? "已验证" : "未验证"}
            </p>
          </div>
        </div>
      </div>

      {/* Phone Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">手机号码</h3>
        <p className="text-white">
          {currentUser?.phone || "未绑定"}
        </p>
      </div>

      {/* Password Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">密码</h3>
        {!showChangePassword ? (
          <Button
            onClick={() => setShowChangePassword(true)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            修改密码
          </Button>
        ) : (
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="当前密码"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  currentPassword: e.target.value,
                }))
              }
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              type="password"
              placeholder="新密码"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  newPassword: e.target.value,
                }))
              }
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              type="password"
              placeholder="确认新密码"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  confirmPassword: e.target.value,
                }))
              }
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleChangePassword}
                className="bg-purple-600 hover:bg-purple-700"
              >
                确认修改
              </Button>
              <Button
                onClick={() => setShowChangePassword(false)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
        <h3 className="text-lg font-semibold text-red-400 mb-2">危险区域</h3>
        <p className="text-sm text-gray-400 mb-4">
          停用账号后，您的所有数据将被保留但无法登录。
        </p>
        <Button
          onClick={() => setShowDeactivateModal(true)}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          停用账号
        </Button>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-red-500/20"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-400">
                确认停用账号
              </h3>
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              此操作将停用您的账号。请输入{" "}
              <span className="text-red-400 font-mono">DELETE</span>{" "}
              以确认。
            </p>
            <Input
              value={deactivateConfirmText}
              onChange={(e) => setDeactivateConfirmText(e.target.value)}
              placeholder='输入 "DELETE" 确认'
              className="bg-white/5 border-red-500/20 text-white mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeactivateModal(false)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                取消
              </Button>
              <Button
                onClick={handleDeactivateAccount}
                disabled={deactivateConfirmText !== "DELETE"}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                确认停用
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}